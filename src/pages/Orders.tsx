import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Loader2, CheckCircle2, Clock, Truck, CheckCircle, ExternalLink, ShieldCheck, Star, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import ReviewDialog from "@/components/ReviewDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getSmartFallback } from "@/lib/imageUtils";
import { useProfile } from "@/hooks/useProfile";
import Invoice from "@/components/Invoice";
import { useToast } from "@/hooks/use-toast";

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, slug, image_url)), delivery_receipts(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      const { data: userReviews } = await (supabase.from("reviews" as any).select("order_id") as any).eq("user_id", user!.id);
      const reviewedOrderIds = new Set(userReviews?.map(r => r.order_id));

      return (data || []).map((order: any) => ({
        ...order,
        is_reviewed: reviewedOrderIds.has(order.id)
      }));
    },
    enabled: !!user,
  });

  if (!user) { navigate("/auth"); return null; }

  const statusSteps = [
    { key: "pending", label: "Ordered", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { key: "confirmed", label: "Confirmed", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50" },
    { key: "processing", label: "Processing", icon: Package, color: "text-purple-500", bg: "bg-purple-50" },
    { key: "shipped", label: "Shipped", icon: Truck, color: "text-indigo-500", bg: "bg-indigo-50" },
    { key: "delivered", label: "Delivered", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/5" },
  ];

  const getActiveStep = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pending") return 0;
    if (s === "confirmed") return 1;
    if (s === "processing" || s === "packed") return 2;
    if (s === "shipped" || s === "on_the_way") return 3;
    if (s === "delivered") return 4;
    return 0;
  };

  const handlePrint = (orderId: string) => {
    setPrintingOrderId(orderId);
    setTimeout(() => {
      const content = document.getElementById(`invoice-print-${orderId}`);
      if (!content) {
        toast({ title: "Error", description: "Invoice content not found", variant: "destructive" });
        return;
      }
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: t('common.error'), description: "Please allow popups to download the invoice", variant: "destructive" });
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${orderId}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="p-8">
              ${content.innerHTML}
            </div>
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setPrintingOrderId(null);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white border-b border-border mb-8">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground">{t('orders.title')}</h1>
          <p className="text-muted-foreground mt-2">Manage and track your farm-fresh orders</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">{t('orders.loading')}</p>
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {(orders as any[]).map(order => (
              <div key={order.id} className="group overflow-hidden rounded-3xl border border-border bg-white shadow-premium hover:shadow-hover transition-all duration-300">
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/30 px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Order Date</p>
                      <p className="text-sm font-bold">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Amount</p>
                      <p className="text-sm font-black text-primary">₹{order.total}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Order ID</p>
                      <p className="text-sm font-mono text-muted-foreground truncate max-w-[120px]">#{order.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div 
                    className="flex items-center gap-2 group/status cursor-pointer select-none"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                      order.status === 'delivered' ? "bg-primary text-white" : "bg-white text-foreground border border-border"
                    )}>
                      {order.status}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "h-8 w-8 rounded-full transition-all duration-300", 
                        expandedOrderId === order.id ? "rotate-90 bg-primary/10 text-primary" : "text-muted-foreground group-hover/status:bg-primary/5 group-hover/status:text-primary group-hover/status:translate-x-0.5"
                      )}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Summary row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex -space-x-3 overflow-hidden">
                      {order.order_items?.slice(0, 4).map((item: any, idx: number) => (
                        <div key={idx} className="h-10 w-10 rounded-full border-2 border-white overflow-hidden bg-muted shadow-sm ring-1 ring-border">
                          <img 
                            src={item.products?.image_url || getSmartFallback(item.products?.name, item.products?.slug)} 
                            alt={item.products?.name} 
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                        </div>
                      ))}
                      {(order.order_items?.length || 0) > 4 && (
                        <div className="h-10 w-10 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm ring-1 ring-border">
                          +{(order.order_items?.length || 0) - 4}
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      className="text-xs font-bold text-primary p-0 h-auto"
                    >
                      {expandedOrderId === order.id ? "Show Less" : "View Order Details"}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {expandedOrderId === order.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                  {/* Items Section */}
                  <div className="grid gap-6 md:grid-cols-2 mb-8">
                    <div className="space-y-4">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            <img 
                              src={item.products?.image_url || getSmartFallback(item.products?.name, item.products?.slug)} 
                              alt={item.products?.name} 
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" 
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate">{item.products?.name}</p>
                            <p className="text-xs text-muted-foreground">{item.variant_name || "Standard"}</p>
                            <p className="text-xs font-black text-primary mt-1">₹{item.price} × {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted/10 rounded-2xl p-4 border border-border/50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Shipping Address</p>
                      <p className="text-xs leading-relaxed whitespace-pre-line text-foreground/80 font-medium">
                        {order.shipping_address}
                      </p>
                    </div>
                  </div>

                  {/* Tracking Timeline (Premium Style) */}
                  <div className="relative py-4 mb-2">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(getActiveStep(order.status) / (statusSteps.length - 1)) * 100}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <div className="flex justify-between relative z-10">
                      {statusSteps.map((step, idx) => {
                        const isActive = getActiveStep(order.status) >= idx;
                        const isCurrent = getActiveStep(order.status) === idx;
                        const Icon = step.icon;

                        return (
                          <div key={step.key} className="flex flex-col items-center gap-2">
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-700",
                              isActive ? `${step.bg} ${step.color} shadow-lg ring-4 ring-white` : "bg-muted text-muted-foreground/40 ring-4 ring-white"
                            )}>
                              <Icon className={cn("h-5 w-5", isCurrent && "animate-pulse")} />
                            </div>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest transition-colors duration-500",
                              isActive ? "text-foreground" : "text-muted-foreground/40"
                            )}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contextual Status Alerts */}
                  <div className="mt-6 flex flex-col gap-3">
                    {order.status === "pending" && (
                      <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-500">
                        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-black text-amber-900 leading-none mb-1">Payment Verification Pending</p>
                          <p className="text-xs text-amber-800/60 font-medium">Verify Txn: {order.payment_txn_id?.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    )}

                    {order.delivery_receipts?.map((receipt: any) => (
                      <div key={receipt.id} className="rounded-2xl bg-primary/5 p-4 border border-primary/10 flex items-center justify-between group/receipt hover:bg-primary/10 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-primary/10">
                            <Truck className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-primary leading-none mb-1">{receipt.courier_name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">ID: {receipt.tracking_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-white text-[9px] font-black uppercase border border-primary/10 text-primary">
                            In Transit
                          </span>
                          <a href={receipt.tracking_url || "#"} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-transform">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/50">
                      <div className="flex gap-3">
                        {order.status === "delivered" && !order.is_reviewed && (
                          <Button size="sm" className="gap-2 rounded-full h-9 px-6 font-bold shadow-lg shadow-primary/10" onClick={() => setReviewOrder(order)}>
                            <Star className="h-4 w-4" /> Rate Experience
                          </Button>
                        )}
                        {order.is_reviewed && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle className="h-3.5 w-3.5" /> Reviewed
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {order.payment_status === 'verified' ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs font-bold text-primary hover:text-primary/80 hover:bg-primary/5 rounded-full"
                            onClick={() => handlePrint(order.id)}
                          >
                            Download Invoice
                          </Button>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground italic bg-muted/30 px-3 py-1 rounded-full">
                            Invoice available after payment verification
                          </span>
                        )}
                      </div>
                      
                      {/* Hidden Invoice Component for Printing */}
                      <div className="hidden" id={`invoice-print-${order.id}`}>
                        <Invoice order={order} profile={profile} />
                      </div>
                    </div>
                  </div>
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    ) : (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="mb-6 rounded-3xl bg-primary/5 p-10 text-primary ring-1 ring-primary/10">
              <Package className="h-16 w-16" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-black tracking-tight">{t('orders.no_orders')}</h2>
            <p className="mb-8 text-muted-foreground font-medium">{t('orders.start_shopping')}</p>
            <Link to="/products">
              <Button size="lg" className="rounded-full h-14 px-10 text-lg shadow-xl shadow-primary/20 font-bold">
                {t('orders.shop_now')}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {reviewOrder && (
        <ReviewDialog
          isOpen={!!reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={() => { queryClient.invalidateQueries({ queryKey: ["orders", user?.id] }); }}
          orderId={reviewOrder.id}
          userId={user.id}
          userName={profile?.full_name || user.email?.split('@')[0] || "Customer"}
        />
      )}
    </main>
  );
};

export default Orders;
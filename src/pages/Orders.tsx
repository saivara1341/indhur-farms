import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Loader2, CheckCircle2, Clock, Truck, CheckCircle, ExternalLink, ShieldCheck, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import ReviewDialog from "@/components/ReviewDialog";
import { useState } from "react";

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url)), delivery_receipts(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      // Also fetch user's reviews to see which orders are already reviewed
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
    { key: "pending", label: "Order Placed", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { key: "confirmed", label: "Confirmed", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50" },
    { key: "processing", label: "Processing", icon: Package, color: "text-purple-500", bg: "bg-purple-50" },
    { key: "shipped", label: "Out for Delivery", icon: Truck, color: "text-indigo-500", bg: "bg-indigo-50" },
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

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="mb-8 font-display text-3xl font-bold">{t('orders.title')}</h1>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('orders.loading')}</p>
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {(orders as any[]).map(order => (
            <div key={order.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              {/* Tracking Timeline */}
              <div className="mt-6 border-t border-border/50 pt-6">
                <div className="flex justify-between items-start mb-8 relative">
                  {statusSteps.map((step, idx) => {
                    const isActive = getActiveStep(order.status) >= idx;
                    const isCurrent = getActiveStep(order.status) === idx;
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${isActive ? `${step.bg} ${step.color} shadow-sm ring-2 ring-white ring-offset-2 ring-offset-current` : "bg-muted text-muted-foreground/30"
                          } ${isCurrent ? "animate-pulse" : ""}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-tighter text-center max-w-[60px] ${isActive ? "text-foreground" : "text-muted-foreground/40"}`}>
                          {step.label}
                        </span>

                        {/* Connecting Line */}
                        {idx < statusSteps.length - 1 && (
                          <div className={`absolute left-[calc(50%+20px)] top-5 h-[2px] w-[calc(100%-40px)] -z-10 ${getActiveStep(order.status) > idx ? "bg-primary/30" : "bg-muted"
                            }`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {order.status === "pending" && (
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
                    <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Awaiting Payment Verification</p>
                      <p className="text-xs text-amber-700/70">Our team is verifying your payment (Txn: {order.payment_txn_id?.slice(-6)}). This usually takes 2-4 hours.</p>
                    </div>
                  </div>
                )}

                {order.status === "confirmed" && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-primary">Order Confirmed! 🎉</p>
                      <p className="text-xs text-primary/70">Your payment has been verified. We are now preparing your fresh farm products for delivery.</p>
                    </div>
                  </div>
                )}

                {order.delivery_receipts && order.delivery_receipts.length > 0 && (
                  <div className="space-y-3">
                    {order.delivery_receipts.map((receipt: any) => (
                      <div key={receipt.id} className="rounded-2xl bg-primary/5 p-4 border border-primary/10 hover:shadow-premium transition-all group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Truck className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-primary">{receipt.courier_name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">Tracking ID: {receipt.tracking_number}</p>
                            </div>
                          </div>
                          <a
                            href={receipt.tracking_url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            Track Live <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${receipt.status === "delivered" ? "bg-primary text-white" : "bg-primary/10 text-primary"
                            }`}>
                            {receipt.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === "delivered" && !order.is_reviewed && (
                  <Button 
                    size="sm" 
                    className="gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all rounded-full px-4"
                    onClick={() => setReviewOrder(order)}
                  >
                    <Star className="h-4 w-4" />
                    Leave a Review
                  </Button>
                )}
                {order.is_reviewed && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold">
                    <CheckCircle className="h-3 w-3" />
                    Reviewed
                  </div>
                )}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-primary/10 p-6 text-primary">
            <Package className="h-12 w-12" />
          </div>
          <h2 className="mb-2 font-display text-xl font-bold">{t('orders.no_orders')}</h2>
          <p className="mb-8 max-w-sm text-muted-foreground">{t('orders.start_shopping')}</p>
          <Link to="/products"><Button variant="hero" size="lg">{t('orders.shop_now')}</Button></Link>
        </div>
      )}

      {reviewOrder && (
        <ReviewDialog
          isOpen={!!reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
          }}
          orderId={reviewOrder.id}
          userId={user.id}
          userName={user.email?.split('@')[0] || "Customer"}
        />
      )}
    </main>
  );
};

export default Orders;
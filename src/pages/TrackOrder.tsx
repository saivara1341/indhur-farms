import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Package, MapPin, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  created_at: string;
  total: number;
  order_items: any[];
}

const TrackOrder = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderIdInput, setOrderIdInput] = useState(searchParams.get("id") || "");
  const [phoneInput, setPhoneInput] = useState("");
  
  const currentOrderId = searchParams.get("id");
  const currentPhone = searchParams.get("phone");

  const { data: order, isLoading, error } = useQuery<Order | null>({
    queryKey: ["track-order", currentOrderId, currentPhone],
    queryFn: async () => {
      if (!currentOrderId || !currentPhone) return null;
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (name)
          )
        `)
        .eq("id", currentOrderId)
        .ilike("phone", `%${currentPhone}%`)
        .single();

      if (error) throw error;
      return data as Order;
    },
    enabled: !!currentOrderId && !!currentPhone,
    retry: false
  });

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput || !phoneInput) return;
    setSearchParams({ id: orderIdInput.trim(), phone: phoneInput.trim() });
  };

  const steps = [
    { status: "pending", label: "Order Placed", icon: Clock },
    { status: "confirmed", label: "Confirmed", icon: Package },
    { status: "shipped", label: "Shipped", icon: Package },
    { status: "delivered", label: "Delivered", icon: MapPin },
  ];

  const currentStatusIndex = order ? steps.findIndex(s => s.status === order.status) : -1;

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-black tracking-tight mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">Enter your order details to see the latest updates</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 shadow-xl mb-12">
        <form onSubmit={handleTrack} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input 
                id="orderId" 
                placeholder="e.g. 550e8400-e29b..." 
                value={orderIdInput}
                onChange={e => setOrderIdInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="Your 10-digit number" 
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-14 text-lg rounded-2xl gap-2 shadow-lg shadow-primary/20" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            Track Order
          </Button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-12"
          >
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="font-medium text-muted-foreground">Finding your order...</p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 text-center"
          >
            <p className="text-destructive font-bold mb-1">Order Not Found</p>
            <p className="text-sm text-muted-foreground">Please double-check the Order ID and Phone Number.</p>
          </motion.div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-1">Order Status</p>
                <h3 className="text-2xl font-black text-primary capitalize">{order.status}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-1">Placed On</p>
                <p className="font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Tracking Progress */}
            <div className="relative py-8">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-muted sm:left-1/2 sm:-ml-px" />
              <div className="space-y-12">
                {steps.map((step, idx) => {
                  const isCompleted = idx <= currentStatusIndex;
                  const isCurrent = idx === currentStatusIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="relative flex items-center sm:justify-center">
                      <div className={cn(
                        "z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background transition-all duration-500",
                        isCompleted ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className={cn(
                        "ml-6 sm:absolute sm:ml-0",
                        idx % 2 === 0 ? "sm:right-[calc(50%+3rem)] sm:text-right" : "sm:left-[calc(50%+3rem)] sm:text-left"
                      )}>
                        <h4 className={cn("text-lg font-bold", isCompleted ? "text-foreground" : "text-muted-foreground")}>
                          {step.label}
                        </h4>
                        {isCurrent && <span className="text-xs font-black uppercase text-primary animate-pulse">Current Stage</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
              <h4 className="font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Order Items
              </h4>
              <div className="divide-y divide-border">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="py-4 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold">{item.products?.name}</p>
                      <p className="text-muted-foreground">{item.variant_name || ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">×{item.quantity}</p>
                      <p className="text-primary font-bold">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-end">
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-black text-primary">₹{order.total}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default TrackOrder;

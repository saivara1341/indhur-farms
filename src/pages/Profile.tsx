import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Package, LogOut, Mail, FileText, Printer, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Invoice from "@/components/Invoice";

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  if (authLoading || !user) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('profile.loading')}</p>
    </div>
  );

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  const statusColors: Record<string, string> = {
    pending: "bg-secondary/20 text-secondary-foreground",
    confirmed: "bg-primary/20 text-primary",
    delivered: "bg-primary/20 text-primary",
    cancelled: "bg-destructive/20 text-destructive",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Profile Header */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{displayName}</h1>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { signOut(); navigate("/"); }} className="gap-2">
            <LogOut className="h-4 w-4" /> {t('profile.sign_out')}
          </Button>
        </div>
      </div>

      {/* Orders Section */}
      <h2 className="mb-4 font-display text-xl font-bold">{t('profile.my_orders')}</h2>

      {ordersLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
          <p className="text-xs text-muted-foreground">{t('orders.loading')}</p>
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-card p-5 shadow-card group hover:border-primary/50 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                  <p className="font-display font-semibold text-lg text-primary">₹{Number(order.total)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                    {order.status}
                  </span>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                        <FileText className="h-3.5 w-3.5" /> {t('invoice.title')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
                      <div className="sticky top-0 z-20 flex justify-end gap-2 p-4 bg-background/50 backdrop-blur-sm print:hidden">
                        <Button size="sm" onClick={handlePrint} className="gap-2">
                          <Printer className="h-4 w-4" /> {t('invoice.print')}
                        </Button>
                      </div>
                      <Invoice order={order} profile={profile} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(order.order_items as any[])?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/50 border border-border px-3 py-2 text-sm">
                    <img src={item.products?.image_url || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-lg object-cover shadow-sm" />
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[150px]">{item.products?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.quantity} × ₹{item.price_at_time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground font-medium">
                  {new Date(order.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {order.payment_status === 'verified' && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    {t('invoice.paid')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold">{t('profile.no_orders')}</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">{t('profile.start_shopping')}</p>
          <Link to="/products">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
              {t('profile.shop_now')}
            </Button>
          </Link>
        </div>
      )}
    </main>
  );
};

export default Profile;
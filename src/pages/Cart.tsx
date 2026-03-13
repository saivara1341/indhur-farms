import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { getSmartFallback } from "@/lib/imageUtils";

const Cart = () => {
  const { items, cartTotal, loading, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) {
    return (
      <main className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-20">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 font-display text-2xl font-bold">{t('cart.please_login')}</h1>
        <p className="mb-6 text-muted-foreground">{t('cart.login_desc')}</p>
        <Link to="/auth"><Button>{t('nav.login')}</Button></Link>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-20">
        <div className="mb-6 rounded-full bg-primary/10 p-6 text-primary">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold">{t('cart.empty')}</h1>
        <p className="mb-8 max-w-sm text-center text-muted-foreground">{t('cart.empty_desc')}</p>
        <Link to="/products"><Button variant="hero" size="lg">{t('cart.start_shopping')}</Button></Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-4">
        <Link to="/products" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-primary/5 hover:shadow-md">
          <ArrowLeft className="h-4 w-4" /> {t('cart.continue_shopping') || "← Continue Shopping"}
        </Link>
      </div>
      <h1 className="mb-8 font-display text-3xl font-bold">{t('cart.title')}</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map(item => (
            <div key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
              <img
                src={item.product.image_url || getSmartFallback(item.product.name, item.product.slug)}
                alt={item.product.name}
                className="h-24 w-24 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== getSmartFallback(item.product.name, item.product.slug)) {
                    target.src = getSmartFallback(item.product.name, item.product.slug);
                  }
                }}
              />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-display font-semibold">{item.product.name}</h3>
                  <div className="flex items-center gap-2">
                    {item.variant_name && (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                        {item.variant_name}
                      </span>
                    )}
                    <p className="text-sm text-muted-foreground">₹{Number(item.price)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-lg border border-border">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_name)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_name)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">₹{item.quantity * Number(item.price)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.product_id, item.variant_name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary — no delivery fee shown here */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card h-fit">
          <h3 className="mb-4 font-display text-lg font-semibold">{t('checkout.order_summary')}</h3>
          <div className="space-y-2 text-sm">
            {items.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground">{item.product.name} {item.variant_name && `(${item.variant_name})`} × {item.quantity}</span>
                <span>₹{item.quantity * Number(item.price)}</span>
              </div>
            ))}
            <div className="my-3 border-t border-border" />
            <div className="flex justify-between text-lg font-bold">
              <span>{t('checkout.total')}</span>
              <span className="text-primary">₹{cartTotal}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">🚚 Delivery charges calculated at checkout based on your region.</p>
          </div>
          <Link to="/checkout">
            <Button variant="hero" size="lg" className="mt-6 w-full">{t('cart.checkout')}</Button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Cart;
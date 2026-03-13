import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  variant_name: string | null;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    unit: string | null;
    stock: number;
    slug: string;
    variants?: any[];
  };
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number, variantName?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantName?: string) => Promise<void>;
  removeFromCart: (productId: string, variantName?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  cartCount: 0,
  cartTotal: 0,
  loading: false,
  addToCart: async () => { },
  updateQuantity: async () => { },
  removeFromCart: async () => { },
  clearCart: async () => { },
  refetch: async () => { },
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_id, variant_name, quantity, products(id, name, price, image_url, unit, stock, slug, variants)")
      .eq("user_id", user.id);

    if (!error && data) {
      setItems(data.map((item: any) => {
        const product = item.products;
        let price = Number(product.price || 0);
        if (item.variant_name && product.variants) {
          // Check both name and unit for variant matching
          const variant = product.variants.find((v: any) => (v.name || v.unit) === item.variant_name || v.unit === item.variant_name);
          if (variant) price = Number(variant.price);
        }
        return { ...item, product, price };
      }));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1, variantName = "") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const existing = items.find(i => i.product_id === productId && (i.variant_name || "") === (variantName || ""));
    if (existing) {
      await updateQuantity(productId, existing.quantity + quantity, variantName);
      return;
    }
    await (supabase.from("cart_items") as any).insert({ 
      user_id: user.id, 
      product_id: productId, 
      variant_name: variantName,
      quantity 
    });
    toast({ title: t('cart.item_added') });
    fetchCart();
  };

  const updateQuantity = async (productId: string, quantity: number, variantName = "") => {
    if (!user) return;
    if (quantity <= 0) { await removeFromCart(productId, variantName); return; }
    await (supabase.from("cart_items") as any)
      .update({ quantity })
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("variant_name", variantName);
    fetchCart();
  };

  const removeFromCart = async (productId: string, variantName = "") => {
    if (!user) return;
    await supabase.from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .eq("variant_name", variantName);
    toast({ title: t('cart.item_removed') });
    fetchCart();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  };

  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = items.reduce((acc, i) => acc + i.quantity * Number(i.price), 0);

  return (
    <CartContext.Provider value={{ items, cartCount, cartTotal, loading, addToCart, updateQuantity, removeFromCart, clearCart, refetch: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);


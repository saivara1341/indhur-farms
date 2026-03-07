import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    unit: string | null;
    stock: number;
    slug: string;
  };
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
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
      .select("id, product_id, quantity, products(id, name, price, image_url, unit, stock, slug)")
      .eq("user_id", user.id);

    if (!error && data) {
      setItems(data.map((item: any) => ({ ...item, product: item.products })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await updateQuantity(productId, existing.quantity + quantity);
      return;
    }
    await (supabase.from("cart_items") as any).insert({ user_id: user.id, product_id: productId, quantity });
    toast({ title: t('cart.item_added') });
    fetchCart();
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) { await removeFromCart(productId); return; }
    await (supabase.from("cart_items") as any).update({ quantity }).eq("user_id", user.id).eq("product_id", productId);
    fetchCart();
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
    toast({ title: t('cart.item_removed') });
    fetchCart();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  };

  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = items.reduce((acc, i) => acc + i.quantity * Number(i.product?.price || 0), 0);

  return (
    <CartContext.Provider value={{ items, cartCount, cartTotal, loading, addToCart, updateQuantity, removeFromCart, clearCart, refetch: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

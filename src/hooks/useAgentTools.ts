
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * useAgentTools Hook
 * 
 * Exposes application logic to the Voice Agent.
 * This acts as the "Arms and Legs" for the AI Brain.
 */
export const useAgentTools = () => {
  const { addToCart, items, cartTotal, clearCart } = useCart();
  const { isAdmin } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const tools = {
    // --- USER TOOLS ---
    
    async addToCart(params: { product: string; quantity?: string | number }) {
      // Find the closest product match
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${params.product}%`)
        .eq("is_active", true)
        .limit(1);

      if (products && products.length > 0) {
        const product = products[0];
        const qty = typeof params.quantity === 'number' ? params.quantity : parseInt(params.quantity || "1");
        await addToCart(product.id, qty);
        toast({ title: `Added ${qty} ${product.name} to cart` });
        return `Added ${qty} ${product.name} to your cart.`;
      }
      return `I couldn't find a product named ${params.product}.`;
    },

    async navigateTo(params: { path: string }) {
      navigate(params.path);
      return `Navigated to ${params.path.replace('/', '') || 'Home'}.`;
    },

    async startCheckout() {
      if (items.length === 0) return "Your cart is empty. Please add something first.";
      navigate("/checkout");
      return "Taking you to the checkout page. Please confirm your delivery details.";
    },

    async listCart() {
      if (items.length === 0) return "Your cart is currently empty.";
      const list = items.map(i => `${i.quantity} x ${i.product.name}`).join(", ");
      return `You have ${list} in your cart. Total is ₹${cartTotal}.`;
    },

    // --- ADMIN TOOLS ---

    async getAdminStats() {
      if (!isAdmin) return "Unauthorized access.";
      
      const { data: orders } = await supabase.from("orders").select("total, status");
      const { count: pendingCount } = await supabase.from("orders").select("*").eq("status", "pending");
      const totalRev = orders?.reduce((acc, curr) => acc + Number(curr.total), 0) || 0;
      
      return `Admin Summary: Total Revenue is ₹${totalRev.toLocaleString()}. You have ${pendingCount} pending orders.`;
    },

    async switchAdminTab(params: { tab: string }) {
      if (!isAdmin) return "Unauthorized.";
      navigate(`/admin?tab=${params.tab}`);
      return `Switched admin view to ${params.tab}.`;
    },

    async updateOrderStatus(params: { orderId: string; status: string }) {
      if (!isAdmin) return "Unauthorized.";
      const { error } = await supabase
        .from("orders")
        .update({ status: params.status })
        .eq("id", params.orderId);
      
      if (error) return "Error updating order status.";
      return `Order ${params.orderId} is now ${params.status}.`;
    }
  };

  return { tools, isAdmin, user, items };
};

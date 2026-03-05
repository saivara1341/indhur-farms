import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "react-i18next";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const { t } = useTranslation();

  const [activeImg, setActiveImg] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)").eq("slug", slug).single();
      if (error || !data) return null;

      // Extract base name by stripping common weight suffixes
      const baseName = data.name.replace(/\s*-\s*[0-9.]+(g|kg|ml|l)$/i, "").trim();

      // Fetch all variants with the same base name (same category)
      const { data: variants } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", data.category_id)
        .like("name", `${baseName}%`)
        .order("price", { ascending: true });

      return {
        ...data,
        baseName,
        variants: variants || [data],
      };
    },
  });

  if (isLoading) return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('product_detail.loading')}</p>
    </div>
  );
  if (!product) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t('product_detail.not_found')}</div>;

  const fallbackImg = product.slug.includes("powder") ? "https://images.unsplash.com/photo-1598662957563-ee4965d4d72c?w=800&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1615485242231-8933227928b9?w=800&auto=format&fit=crop&q=80";
  const currentImg = activeImg || product.image_url || ((product.gallery as string[])?.[0]) || fallbackImg;
  const gallery = (product.gallery as string[]) || [];
  const discount = product.compare_at_price ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100) : 0;

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl bg-muted shadow-lg border border-border">
            <img src={currentImg} alt={product.name} className="h-full w-full object-cover transition-all duration-500" />
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {gallery.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(url)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${activeImg === url || (!activeImg && url === product.image_url) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          {product.categories && (
            <span className="mb-2 text-sm font-medium text-secondary">{(product.categories as any).name}</span>
          )}
          <h1 className="font-display text-3xl font-bold lg:text-4xl">{product.baseName || product.name}</h1>

          {product.variants && product.variants.length > 1 && (
            <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <label className="text-sm font-bold text-foreground mb-2 block">Choose Weight Variant</label>
              <select
                className="w-full max-w-sm h-11 rounded-lg border border-input bg-background px-3 py-2 outline-none ring-offset-background focus:ring-2 focus:ring-primary/50 text-foreground font-semibold shadow-sm"
                value={product.slug}
                onChange={(e) => navigate(`/product/${e.target.value}`)}
              >
                {product.variants.map((v: any) => (
                  <option key={v.id} value={v.slug}>
                    {v.unit} - ₹{v.price} {v.compare_at_price ? `(Was ₹${v.compare_at_price})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">₹{Number(product.price)}</span>
            {product.compare_at_price && (
              <>
                <span className="text-lg text-muted-foreground line-through">₹{Number(product.compare_at_price)}</span>
                <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs font-bold text-secondary">{discount}% {t('products.off')}</span>
              </>
            )}
            {product.unit && <span className="text-sm text-muted-foreground">{t('product_detail.per')} {product.unit}</span>}
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-border">
              <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <Button variant="hero" size="lg" className="flex-1" onClick={() => addToCart(product.id, qty)}>
              <ShoppingCart className="mr-2 h-5 w-5" /> {t('products.add_to_cart')}
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>✅ {product.stock > 0 ? `${t('product_detail.in_stock')} (${product.stock} ${t('product_detail.available')})` : t('products.out_of_stock')}</p>
            <p>{t('product_detail.free_delivery')}</p>
            <p>{t('product_detail.organic')}</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "react-i18next";
import { getSmartFallback } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTranslatedBaseName, getTranslatedProductName } from "@/lib/translations";

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

      const productData = data as any;
      const baseName = productData.name.replace(/\s*(?:-\s*)?[0-9.]+\s*(g|kg|ml|l|grams|kgs)$/i, "").trim();

      // Fetch all variants with the same base name (same category)
      const { data: variants } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", productData.category_id)
        .like("name", `${baseName}%`)
        .order("price", { ascending: true });

      return {
        ...productData,
        baseName,
        variants: variants || [productData],
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

  const variantWithImage = product.variants?.find((v: any) => v.image_url);
  const fallbackImg = getSmartFallback(product.name, product.slug);
  const currentImg = activeImg || product.image_url || ((product.gallery as string[])?.[0]) || variantWithImage?.image_url || fallbackImg;

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
          <h1 className="font-display text-3xl font-bold lg:text-4xl">
            {getTranslatedBaseName(product.baseName || product.name, t)}
          </h1>

          {product.variants && product.variants.length > 1 && (
            <div className="mt-8 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('product_detail.choose_variant')}
              </label>
              <Select
                value={product.slug}
                onValueChange={(value) => navigate(`/product/${value}`)}
              >
                <SelectTrigger className="w-full md:w-[300px] h-14 rounded-2xl border-2 border-primary/20 bg-background/50 backdrop-blur-sm shadow-premium focus:ring-primary/20 transition-all hover:border-primary/40">
                  <SelectValue placeholder={t('product_detail.choose_variant')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-primary/10 shadow-premium backdrop-blur-md">
                  {product.variants.map((v: any) => (
                    <SelectItem
                      key={v.id}
                      value={v.slug}
                      className="rounded-xl py-3 focus:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center justify-between w-full min-w-[200px] gap-4">
                        <span className="font-bold">{v.unit}</span>
                        <span className="text-sm font-black text-primary">₹{v.price}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-black text-primary drop-shadow-sm">₹{Number(product.price)}</span>
            {product.compare_at_price && (
              <>
                <span className="text-lg text-muted-foreground line-through opacity-60">₹{Number(product.compare_at_price)}</span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-black uppercase text-secondary-foreground shadow-sm">{discount}% {t('products.off')}</span>
              </>
            )}
            {product.unit && <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('product_detail.per')} {product.unit}</span>}
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
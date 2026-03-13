import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Loader2, ArrowLeft } from "lucide-react";
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
import { getTranslatedBaseName } from "@/lib/translations";

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const { t } = useTranslation();

  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)").eq("slug", slug).single();
      if (error || !data) return null;
      return data as any;
    },
  });

  const variants = product?.variants || [];
  const selectedVariant = variants.find((v: any) => v.id === selectedVariantId) || variants[0];

  if (isLoading) return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('product_detail.loading')}</p>
    </div>
  );
  if (!product) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t('product_detail.not_found')}</div>;

  const currentImg = activeImg || product.image_url || ((product.gallery as string[])?.[0]) || getSmartFallback(product.name, product.slug);
  const gallery = (product.gallery as string[]) || [];

  const displayPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
  const displayUnit = selectedVariant ? selectedVariant.unit : product.unit;

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 mb-6 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-primary/5 hover:shadow-md"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

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
            {getTranslatedBaseName(product.name, t)}
          </h1>

          {variants.length > 0 && (
            <div className="mt-8 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('product_detail.choose_variant', 'Select Quantity')}
              </label>
              <Select
                value={selectedVariantId || variants[0]?.id}
                onValueChange={(value) => setSelectedVariantId(value)}
              >
                <SelectTrigger className="w-full md:w-[300px] h-14 rounded-2xl border-2 border-primary/20 bg-background/50 backdrop-blur-sm shadow-premium focus:ring-primary/20 transition-all hover:border-primary/40">
                  <SelectValue placeholder={t('product_detail.choose_variant')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-primary/10 shadow-premium backdrop-blur-md">
                  {variants.map((v: any) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
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

          {/* Price — no discount display */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-black text-primary drop-shadow-sm">₹{displayPrice * qty}</span>
            {displayUnit && <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('product_detail.per')} {displayUnit}</span>}
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-border">
              <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <Button variant="hero" size="lg" className="flex-1" onClick={() => addToCart(product.id, qty, selectedVariant?.unit || "")}>
              <ShoppingCart className="mr-2 h-5 w-5" /> {t('products.add_to_cart')}
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>✅ {product.stock > 0 ? `${t('product_detail.in_stock')} (${product.stock} ${t('product_detail.available')})` : t('products.out_of_stock')}</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { getSmartFallback, DEFAULT_FARM_IMAGE } from "@/lib/imageUtils";

export interface ProductVariant {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string | null;
  unit: string | null;
}

interface ProductCardProps {
  baseName: string;
  variants: ProductVariant[];
}


import { useState } from "react";

// ── Component ─────────────────────────────────────────────────
const ProductCard = ({ baseName, variants }: ProductCardProps) => {
  const { addToCart } = useCart();

  // Sort variants by price so the lowest price variant is selected by default
  const sortedVariants = [...variants].sort((a, b) => a.price - b.price);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(sortedVariants[0]?.id || "");

  const selectedVariant = sortedVariants.find(v => v.id === selectedVariantId) || sortedVariants[0];

  if (!selectedVariant) return null;

  const { id, name, slug, price, compareAtPrice, unit } = selectedVariant;

  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  // Admin upload takes priority. If selected variant doesn't have an image, find ANY variant that does!
  const customImageUrl = selectedVariant.imageUrl || sortedVariants.find(v => v.imageUrl)?.imageUrl;
  const displayImage = customImageUrl || getSmartFallback(name, slug);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-primary/5 bg-card shadow-premium transition-all duration-500 hover-lift active:scale-[0.98] flex flex-col">
      {discount > 0 && (
        <span className="absolute left-2 top-2 z-10 express-badge shadow-lift">
          {discount}% OFF
        </span>
      )}
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="express-badge bg-primary text-white">Express</span>
      </div>

      <Link to={`/product/${slug}`}>
        <div className="aspect-[4/5] overflow-hidden bg-muted/30">
          <img
            src={displayImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              // If smart fallback fails, try generic farm image
              if (img.src !== DEFAULT_FARM_IMAGE) {
                img.src = DEFAULT_FARM_IMAGE;
              }
            }}
          />
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Pure Farm Fresh</span>
        </div>

        <Link to={`/product/${slug}`} className="mb-2 block">
          <h3 className="font-display text-base font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {baseName}
          </h3>
        </Link>

        <div className="mt-auto">
          {sortedVariants.length > 1 ? (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {sortedVariants.map((v) => {
                  const isActive = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedVariantId(v.id);
                      }}
                      className={cn(
                        "group relative flex flex-col items-center justify-center rounded-xl border px-3 py-1.5 transition-all duration-300",
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-secondary/20 bg-secondary/5 hover:border-primary/30"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold leading-none",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>{v.unit}</span>
                      <span className={cn(
                        "text-[8px] font-medium opacity-70 mt-0.5",
                        isActive ? "text-primary" : "text-muted-foreground/60"
                      )}>₹{v.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-8 mb-4 flex items-center">
              {unit && <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">{unit} - ₹{price}</span>}
            </div>
          )}

          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-foreground drop-shadow-sm">₹{price}</span>
                {compareAtPrice && (
                  <span className="text-xs text-muted-foreground/60 line-through decoration-destructive/30">₹{compareAtPrice}</span>
                )}
              </div>
            </div>

            <Button
              size="icon"
              className="h-10 w-10 shrink-0 rounded-2xl bg-primary shadow-premium hover:scale-110 active:scale-95 transition-all group/btn"
              onClick={(e) => {
                e.preventDefault();
                addToCart(id);
              }}
            >
              <ShoppingCart className="h-4 w-4 fill-current group-hover/btn:rotate-12 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

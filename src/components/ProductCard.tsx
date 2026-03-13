import { Link } from "react-router-dom";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { getSmartFallback, DEFAULT_FARM_IMAGE } from "@/lib/imageUtils";
import { useTranslation } from "react-i18next";
import { getTranslatedBaseName } from "@/lib/translations";
import { useState } from "react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    unit: string | null;
    variants?: any[];
  };
}

// ── Component ─────────────────────────────────────────────────
const ProductCard = ({ product }: ProductCardProps) => {
  const { t } = useTranslation();
  const { items, addToCart, updateQuantity } = useCart();

  // Sort variants by price so the lowest price variant is selected by default
  const sortedVariants = [...(product.variants || [])].sort((a, b) => a.price - b.price);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(sortedVariants[0]?.id || "");

  const selectedVariant = sortedVariants.find(v => v.id === selectedVariantId) || {
    id: product.id,
    name: product.name,
    price: product.price,
    unit: product.unit,
    variant_name: ""
  };

  const id = product.id;
  const variantName = selectedVariant.unit || "";
  const price = Number(selectedVariant.price);

  // Check if the current variant is already in the cart
  const cartItem = items.find(item => item.product_id === id && (item.variant_name || "") === variantName);
  const isInCart = !!cartItem;

  const displayImage = product.image_url || getSmartFallback(product.name, product.slug);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-primary/5 bg-card shadow-premium transition-all duration-500 hover-lift active:scale-[0.98] flex flex-col">
      <Link to={`/product/${product.slug}`}>
        <div className="aspect-[4/5] overflow-hidden bg-muted/30">
          <img
            src={displayImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src !== DEFAULT_FARM_IMAGE) {
                img.src = DEFAULT_FARM_IMAGE;
              }
            }}
          />
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link to={`/product/${product.slug}`} className="mb-2 block">
          <h3 className="font-display text-base font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {getTranslatedBaseName(product.name, t)}
          </h3>
        </Link>

        <div className="mt-auto">
          <div className="mb-3">
            {sortedVariants.length > 0 && (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 ml-0.5">
                {t("products.quantity_label", "Select Quantity:")}
              </span>
            )}
            {sortedVariants.length > 0 ? (
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
            ) : product.unit ? (
              <div className="flex items-center">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                  {product.unit} - ₹{product.price}
                </span>
              </div>
            ) : null}
          </div>

          {/* Price + Action Button */}
          <div className="flex items-center justify-between gap-2 border-t border-border/10 pt-3 mt-1">
            <span className="text-xl font-black text-foreground drop-shadow-sm">₹{price * (cartItem?.quantity || 1)}</span>

            {isInCart ? (
              <div className="flex items-center gap-1.5 rounded-xl border-2 border-primary/20 bg-primary/5 p-0.5 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    updateQuantity(id, (cartItem?.quantity || 0) - 1, variantName);
                  }}
                >
                  <Minus className="h-4 w-4 stroke-[3px]" />
                </Button>
                <span className="w-5 text-center text-sm font-black text-primary">{cartItem?.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    updateQuantity(id, (cartItem?.quantity || 0) + 1, variantName);
                  }}
                >
                  <Plus className="h-4 w-4 stroke-[3px]" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="h-9 px-5 rounded-xl bg-primary shadow-premium hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all font-bold text-xs uppercase tracking-wider gap-2 group/btn"
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(id, 1, variantName);
                }}
              >
                <Plus className="h-3.5 w-3.5 group-hover/btn:rotate-90 transition-transform" />
                {t("products.add_to_cart", "ADD")}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductCard;


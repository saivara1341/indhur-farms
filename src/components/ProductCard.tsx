import { Link } from "react-router-dom";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  showAllVariants?: boolean;
}

// ── Component ─────────────────────────────────────────────────
const ProductCard = ({ product, showAllVariants = false }: ProductCardProps) => {
  const { t } = useTranslation();
  const { items, addToCart, updateQuantity } = useCart();

  // Sort variants by price so the lowest price variant is selected by default
  const sortedVariants = [...(product.variants || [])].sort((a, b) => a.price - b.price);
  const [localQty, setLocalQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(sortedVariants[0]?.id || "");

  const [isExpanded, setIsExpanded] = useState(false);

  const selectedVariant = sortedVariants.find(v => v.id === selectedVariantId) || {
    id: product.id,
    name: product.name,
    price: product.price,
    unit: product.unit,
  };

  const id = product.id;
  const variantName = selectedVariant.unit || "";
  const price = Number(selectedVariant.price);

  // Check if the current variant is already in the cart
  const cartItem = items.find(item => item.product_id === id && (item.variant_name || "") === variantName);
  const isInCart = !!cartItem;

  const displayImage = product.image_url || getSmartFallback(product.name, product.slug);

  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-primary/5 bg-card shadow-premium transition-all duration-500 hover-lift active:scale-[0.98] flex flex-col">
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
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2 ml-0.5">
              {t("products.quantity_label", "Available Weights:")}
            </span>
            {sortedVariants.length > 0 ? (
              showAllVariants ? (
                /* Landing Page Mode: Show all buttons or limit to 2 */
                <div className="grid grid-cols-2 gap-2" onClick={(e) => e.preventDefault()}>
                  {(!isExpanded && sortedVariants.length > 2) ? (
                    <>
                      {/* Slot 1: Currently selected variant */}
                      <button
                        className="flex flex-col items-center justify-center rounded-xl p-2 transition-all border-2 border-primary bg-primary/10 shadow-sm"
                      >
                        <span className="text-[10px] font-black text-primary">{selectedVariant.unit}</span>
                        <span className="text-[9px] font-bold opacity-70 text-primary">₹{selectedVariant.price}</span>
                      </button>
                      {/* Slot 2: +X More button */}
                      <button
                        onClick={() => setIsExpanded(true)}
                        className="flex flex-col items-center justify-center rounded-xl p-2 transition-all border-2 border-dashed border-primary/30 bg-muted/20 hover:bg-muted text-muted-foreground"
                      >
                        <span className="text-[10px] font-black">+{sortedVariants.length - 1} {t('common.more', 'More')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {sortedVariants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVariantId(v.id);
                            setIsExpanded(false); // auto-collapse on selection
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-xl p-2 transition-all border-2",
                            selectedVariantId === v.id 
                              ? "border-primary bg-primary/10 shadow-sm" 
                              : "border-transparent bg-muted/50 hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <span className={cn("text-[10px] font-black", selectedVariantId === v.id ? "text-primary" : "")}>{v.unit}</span>
                          <span className={cn("text-[9px] font-bold opacity-70", selectedVariantId === v.id ? "text-primary" : "")}>₹{v.price}</span>
                        </button>
                      ))}
                      {isExpanded && sortedVariants.length > 2 && (
                        <button
                          onClick={() => setIsExpanded(false)}
                          className="flex flex-col items-center justify-center rounded-xl p-2 transition-all border-2 border-transparent bg-muted/20 hover:bg-muted text-muted-foreground col-span-2 mt-1"
                        >
                          <span className="text-[10px] font-bold">{t('common.show_less', 'Show Less')}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                /* Regular Mode: Dropdown */
                <div onClick={(e) => e.preventDefault()}>
                  <Select
                    value={selectedVariantId}
                    onValueChange={(value) => setSelectedVariantId(value)}
                  >
                    <SelectTrigger className="w-full h-9 rounded-xl border-primary/20 bg-background hover:border-primary/50 transition-colors text-xs font-bold shadow-sm focus:ring-primary/20">
                      <SelectValue>
                        {selectedVariant.unit}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-primary/10 shadow-premium">
                      {sortedVariants.map((v) => (
                        <SelectItem
                          key={v.id}
                          value={v.id}
                          className="text-xs focus:bg-primary/10 focus:text-primary rounded-lg cursor-pointer py-2"
                        >
                          <div className="flex items-center justify-between w-full min-w-[140px] gap-4">
                            <span className="font-bold">{v.unit}</span>
                            <span className="text-secondary font-black">₹{v.price}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            ) : product.unit ? (
              <div className="flex flex-wrap gap-1.5">
                <div className="group relative flex min-w-[50px] flex-col items-center justify-center rounded-xl border border-primary bg-primary/10 py-1.5 shadow-sm ring-1 ring-primary/20">
                  <span className="text-[10px] font-black leading-none text-primary">{product.unit}</span>
                  <span className="text-[8px] font-bold opacity-70 mt-0.5 text-primary">₹{product.price}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Price + Action Button */}
          <div className="flex flex-col gap-3 border-t border-border/10 pt-3 mt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl font-black text-foreground drop-shadow-sm">
                ₹{price * (isInCart ? (cartItem?.quantity || 1) : localQty)}
              </span>

              {/* Multiplier / Local Qty */}
              <div className="flex items-center gap-1.5 rounded-xl border-2 border-primary/20 bg-primary/5 p-0.5 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isInCart) {
                      updateQuantity(id, (cartItem?.quantity || 0) - 1, variantName);
                    } else {
                      setLocalQty(prev => Math.max(1, prev - 1));
                    }
                  }}
                >
                  <Minus className="h-4 w-4 stroke-[3px]" />
                </Button>
                <span className="w-5 text-center text-sm font-black text-primary">
                  {isInCart ? cartItem?.quantity : localQty}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isInCart) {
                      updateQuantity(id, (cartItem?.quantity || 0) + 1, variantName);
                    } else {
                      setLocalQty(prev => prev + 1);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 stroke-[3px]" />
                </Button>
              </div>
            </div>

            {!isInCart && (
              <Button
                size="sm"
                className="w-full h-9 rounded-xl bg-primary shadow-premium hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all font-bold text-xs uppercase tracking-wider gap-2 group/btn"
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(id, localQty, variantName);
                }}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("products.add_to_cart", "Add to Cart")}
              </Button>
            )}
            {isInCart && (
              <div className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-tighter text-center py-1 rounded-lg border border-primary/20">
                {t("products.in_cart", "In Cart")}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductCard;


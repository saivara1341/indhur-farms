import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import pasupuKommuluImg from "@/assets/pasupu-kommulu.jpg";
import pasupuPodiImg from "@/assets/pasupu-podi.jpg";

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

// ── Curated fallback images keyed by product keyword ─────────
// ── Exact slug → image (highest priority, product-specific) ──
const SLUG_IMAGES: Record<string, string> = {
  "dry-turmeric-fingers-250g": pasupuKommuluImg,
  "dry-turmeric-fingers-500g": pasupuKommuluImg,
  "dry-turmeric-fingers-1kg": pasupuKommuluImg,
  "dry-turmeric-fingers-2kg": pasupuKommuluImg,
  "dry-turmeric-fingers-3kg": pasupuKommuluImg,
  "dry-turmeric-fingers-4kg": pasupuKommuluImg,
  "dry-turmeric-fingers-5kg": pasupuKommuluImg,
  "pure-turmeric-powder-250g": pasupuPodiImg,
  "pure-turmeric-powder-500g": pasupuPodiImg,
  "pure-turmeric-powder-1kg": pasupuPodiImg,
  "pure-turmeric-powder-2kg": pasupuPodiImg,
  "pure-turmeric-powder-3kg": pasupuPodiImg,
  "pure-turmeric-powder-4kg": pasupuPodiImg,
  "pure-turmeric-powder-5kg": pasupuPodiImg,
  "pasupu-kommulu": pasupuKommuluImg,
  "pasupu-turmeric-powder": pasupuPodiImg,
};

// ── Keyword fallback map ──────────────────────────────────────
const FALLBACK_IMAGES: { keywords: string[]; url: string }[] = [
  {
    keywords: ["turmeric", "pasupu", "kommulu", "haldi"],
    url: "https://images.unsplash.com/photo-1615485242231-8933227928b9?w=800&auto=format&fit=crop&q=80",
  },
  {
    keywords: ["powder", "churna"],
    url: "https://images.unsplash.com/photo-1596647413661-d7790eb21cf5?w=800&auto=format&fit=crop&q=80",
  },
  {
    keywords: ["fruit", "mango", "banana", "orange", "apple", "papaya"],
    url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80",
  },
  {
    keywords: ["vegetable", "veggie", "tomato", "onion", "chilli", "brinjal"],
    url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
  },
  {
    keywords: ["paddy", "rice", "grain", "wheat", "millet"],
    url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80",
  },
  {
    keywords: ["sugarcane", "jaggery", "bellam", "sugar", "cane"],
    url: "https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=800&auto=format&fit=crop&q=80",
  },
];

// Generic farm fallback
const DEFAULT_FARM_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80";

function getSmartFallback(name: string, slug: string): string {
  // 1. Exact slug match
  if (SLUG_IMAGES[slug]) return SLUG_IMAGES[slug];
  // 2. Keyword match
  const text = `${name} ${slug}`.toLowerCase();
  for (const entry of FALLBACK_IMAGES) {
    if (entry.keywords.some((kw) => text.includes(kw))) return entry.url;
  }
  return DEFAULT_FARM_IMAGE;
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
                {sortedVariants.map((v) => (
                  <button
                    key={v.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedVariantId(v.id);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold tracking-tight transition-all border",
                      selectedVariantId === v.id
                        ? "bg-primary text-white border-primary shadow-sm scale-105"
                        : "bg-secondary/10 text-muted-foreground border-secondary/20 hover:border-primary/30"
                    )}
                  >
                    {v.unit}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-8 mb-4 flex items-center">
              {unit && <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">{unit}</span>}
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

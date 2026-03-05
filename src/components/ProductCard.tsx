import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string | null;
  unit: string | null;
}

// ── Curated fallback images keyed by product keyword ─────────
// ── Exact slug → image (highest priority, product-specific) ──
const SLUG_IMAGES: Record<string, string> = {
  "pasupu-kommulu": "/pasupu-kommulu.jpg",
  "pasupu-turmeric-powder": "/turmeric-powder.png",
};

// ── Keyword fallback map ──────────────────────────────────────
const FALLBACK_IMAGES: { keywords: string[]; url: string }[] = [
  {
    keywords: ["turmeric", "pasupu", "kommulu", "haldi"],
    url: "https://images.unsplash.com/photo-1615485242231-8933227928b9?w=800&auto=format&fit=crop&q=80",
  },
  {
    keywords: ["powder", "churna"],
    url: "https://images.unsplash.com/photo-1598662957563-ee4965d4d72c?w=800&auto=format&fit=crop&q=80",
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

// ── Component ─────────────────────────────────────────────────
const ProductCard = ({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  imageUrl,
  unit,
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  // Admin upload takes priority; smart fallback otherwise
  const displayImage = imageUrl || getSmartFallback(name, slug);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-primary/5 bg-card shadow-premium transition-all duration-500 hover-lift active:scale-[0.98]">
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

      <div className="p-3">
        <div className="flex items-center gap-1 mb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Pure Farm Fresh</span>
        </div>
        <Link to={`/product/${slug}`}>
          <h3 className="font-display text-base font-bold text-foreground line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-foreground">₹{price}</span>
              {compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through decoration-destructive/50">₹{compareAtPrice}</span>
              )}
            </div>
            {unit && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{unit}</span>}
          </div>
          <Button
            size="icon"
            className="h-10 w-10 rounded-xl bg-primary shadow-lift hover:scale-110 active:scale-95 transition-all"
            onClick={(e) => {
              e.preventDefault();
              addToCart(id);
            }}
          >
            <ShoppingCart className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

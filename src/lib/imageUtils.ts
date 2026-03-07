import pasupuKommuluImg from "@/assets/pasupu-kommulu.jpg";
import pasupuPodiImg from "@/assets/pasupu-podi.jpg";

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
        url: "https://images.unsplash.com/photo-1615485242231-8933227928b9?w=400&auto=format&fit=crop&q=80",
    },
    {
        keywords: ["powder", "churna"],
        url: "https://images.unsplash.com/photo-1596647413661-d7790eb21cf5?w=400&auto=format&fit=crop&q=80",
    },
    {
        keywords: ["fruit", "mango", "banana", "orange", "apple", "papaya"],
        url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&auto=format&fit=crop&q=80",
    },
    {
        keywords: ["vegetable", "veggie", "tomato", "onion", "chilli", "brinjal"],
        url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80",
    },
    {
        keywords: ["paddy", "rice", "grain", "wheat", "millet"],
        url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80",
    },
    {
        keywords: ["sugarcane", "jaggery", "bellam", "sugar", "cane"],
        url: "https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=400&auto=format&fit=crop&q=80",
    },
];

// Generic farm fallback
export const DEFAULT_FARM_IMAGE =
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=80";

export function getSmartFallback(name: string = "", slug: string = ""): string {
    // 1. Exact slug match
    if (slug && SLUG_IMAGES[slug]) return SLUG_IMAGES[slug];

    // 2. Keyword match
    const text = `${name} ${slug}`.toLowerCase();
    for (const entry of FALLBACK_IMAGES) {
        if (entry.keywords.some((kw) => text.includes(kw))) return entry.url;
    }

    return DEFAULT_FARM_IMAGE;
}

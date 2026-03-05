import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAdmin } from "@/hooks/useAdmin";
import { Plus, Clock } from "lucide-react";

// Categories that currently have live products.
// Anything NOT in this list is treated as "Coming Soon" and shows no products.
const LIVE_CATEGORY_SLUGS = ["turmeric-products"];

const Products = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      return data || [];
    },
  });

  // Only show categories that are NOT the old "farmer-to-consumer" slug
  const categories = (allCategories as any[]).filter(
    (c) => c.slug !== "farmer-to-consumer"
  );

  const liveCategories = (categories as any[]).filter((c) =>
    LIVE_CATEGORY_SLUGS.includes(c.slug)
  );
  const comingSoonCategories = (categories as any[]).filter(
    (c) => !LIVE_CATEGORY_SLUGS.includes(c.slug)
  );

  // Determine if the selected category is live or coming-soon
  const selectedCat = categories.find((c) => c.slug === categorySlug);
  const isSelectedComingSoon =
    selectedCat && !LIVE_CATEGORY_SLUGS.includes(selectedCat.slug);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", categorySlug],
    queryFn: async () => {
      // If selected category is coming soon, return empty immediately
      if (isSelectedComingSoon) return [];

      let query = supabase
        .from("products")
        .select("*, categories(slug)")
        .eq("is_active", true);

      if (categorySlug) {
        const cat = liveCategories.find((c) => c.slug === categorySlug);
        if (cat) query = query.eq("category_id", cat.id);
        else {
          // Restrict to live categories only when "All" is selected
          const liveIds = liveCategories.map((c) => c.id);
          if (liveIds.length) query = query.in("category_id", liveIds);
        }
      } else {
        // "All" tab — only show products from live categories
        const liveIds = liveCategories.map((c) => c.id);
        if (liveIds.length) query = query.in("category_id", liveIds);
      }

      const { data } = await query.order("created_at", { ascending: false });
      return data || [];
    },
    enabled: categories.length > 0,
  });

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Page heading */}
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground">
          {selectedCat?.name || t("products.page_title")}
        </h1>
        {isAdmin && (
          <Button
            onClick={() => navigate("/admin?tab=products&action=new")}
            className="gap-2 bg-primary shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> {t("products.add_catalogue")}
          </Button>
        )}
      </div>
      <p className="mb-8 text-muted-foreground">{t("products.subtitle")}</p>

      {/* ── Category filter tabs ──────────────────────────────── */}
      <div className="mb-8 flex flex-wrap gap-3 scrollbar-none">
        {/* "All" tab — always visible */}
        <Button
          variant={!categorySlug ? "default" : "outline"}
          size="sm"
          className={`rounded-full px-5 font-bold transition-all ${!categorySlug
            ? "bg-primary text-white shadow-lift"
            : "border-primary/20 text-primary hover:bg-primary/5"
            }`}
          onClick={() => setSearchParams({})}
        >
          {t("products.all")}
        </Button>

        {/* Live categories */}
        {(liveCategories as any[]).map((cat) => (
          <Button
            key={cat.id}
            variant={categorySlug === cat.slug ? "default" : "outline"}
            size="sm"
            className={`rounded-full px-6 font-bold transition-all ${categorySlug === cat.slug
              ? "bg-primary text-white shadow-lift"
              : "border-primary/20 text-primary hover:bg-primary/5"
              }`}
            onClick={() => setSearchParams({ category: cat.slug })}
          >
            {cat.name}
          </Button>
        ))}

        {/* Coming Soon categories */}
        {(comingSoonCategories as any[]).map((cat) => (
          <div
            key={cat.id}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary/40 cursor-not-allowed select-none transition-opacity hover:opacity-80"
          >
            {cat.name}
            <span className="express-badge text-[8px] opacity-60">Soon</span>
          </div>
        ))}
      </div>
      {isSelectedComingSoon && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-400">
            <Clock className="h-10 w-10" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Coming Soon!
          </h2>
          <p className="max-w-sm text-muted-foreground">
            We're working hard to bring <strong>{selectedCat?.name}</strong>{" "}
            products to you. Stay tuned — fresh from our farm to your door!
          </p>
          <Button variant="outline" onClick={() => setSearchParams({})}>
            Browse available products
          </Button>
        </div>
      )}

      {/* ── Loading state ── */}
      {!isSelectedComingSoon && isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 py-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isSelectedComingSoon && !isLoading && products.length === 0 && (
        <p className="py-20 text-center text-muted-foreground">
          {t("products.no_products")}
        </p>
      )}

      {/* ── Product grid ── */}
      {!isSelectedComingSoon && !isLoading && products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6">
          {Object.values((products as any[]).reduce((groups: Record<string, any>, product) => {
            const baseName = product.name.replace(/\s*-\s*[0-9.]+(g|kg|ml|l)$/i, "").trim();
            if (!groups[baseName]) groups[baseName] = { baseName, variants: [] };
            groups[baseName].variants.push({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: Number(product.price),
              compareAtPrice: product.compare_at_price ? Number(product.compare_at_price) : null,
              imageUrl: product.image_url || null,
              unit: product.unit || null,
            });
            return groups;
          }, {})).map((group: any, idx) => (
            <ProductCard
              key={idx}
              baseName={group.baseName}
              variants={group.variants}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default Products;
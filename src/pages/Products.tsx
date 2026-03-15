import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAdmin } from "@/hooks/useAdmin";
import { Plus, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Products = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [showAllCategories, setShowAllCategories] = useState(false);

  // 1. Fetch all categories
  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      return ((data || []) as Category[]).filter(c => c.slug !== "farmer-to-consumer");
    },
  });

  // 2. Fetch all active product category IDs to determine "Live" vs "Coming Soon"
  const { data: liveCategoryIds = new Set<string>() } = useQuery({
    queryKey: ["live-category-ids"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("category_id")
        .eq("is_active", true);
      return new Set((data as any[] || []).map(p => p.category_id).filter(Boolean) as string[]);
    },
  });

  // Split categories based on product presence
  const liveCategories = (allCategories as Category[]).filter(c => liveCategoryIds.has(c.id));
  const comingSoonCategories = (allCategories as Category[]).filter(c => 
    !liveCategoryIds.has(c.id) && 
    !["sugarcane", "turmeric-roots", "turmeric-powder"].includes(c.slug)
  );

  // Determine if the selected category is live or coming-soon
  const selectedCat = (allCategories as Category[]).find((c) => c.slug === categorySlug);
  const isSelectedComingSoon = selectedCat && !liveCategoryIds.has(selectedCat.id);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", categorySlug],
    queryFn: async () => {
      if (isSelectedComingSoon) return [];

      let query = supabase
        .from("products")
        .select("*, categories(slug)")
        .eq("is_active", true);

      if (categorySlug) {
        const cat = liveCategories.find((c) => c.slug === categorySlug);
        if (cat) query = query.eq("category_id", cat.id);
      } else {
        const liveIds = liveCategories.map((c) => c.id);
        if (liveIds.length) query = query.in("category_id", liveIds);
      }

      const { data } = await query.order("created_at", { ascending: false });
      return data || [];
    },
    enabled: allCategories.length > 0,
  });

  const visibleLiveCategories = showAllCategories 
    ? liveCategories 
    : liveCategories.slice(0, 3);

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground">
          {selectedCat ? t(`categories.${selectedCat.slug}`, selectedCat.name) : t("products.page_title")}
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
      <div className="mb-8 flex flex-wrap items-center gap-3">
        {/* "All" tab */}
        <Button
          variant={!categorySlug ? "default" : "outline"}
          size="sm"
          className={cn(
            "rounded-full px-5 font-bold transition-all",
            !categorySlug ? "bg-primary text-white shadow-lift" : "border-primary/20 text-primary hover:bg-primary/5"
          )}
          onClick={() => {
            setSearchParams({});
          }}
        >
          {t("products.all")}
        </Button>

        {/* Live categories (Limited to 3) */}
        {visibleLiveCategories.map((cat) => (
          <Button
            key={cat.id}
            variant={categorySlug === cat.slug ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full px-6 font-bold transition-all",
              categorySlug === cat.slug ? "bg-primary text-white shadow-lift" : "border-primary/20 text-primary hover:bg-primary/5"
            )}
            onClick={() => setSearchParams({ category: cat.slug })}
          >
            {t(`categories.${cat.slug}`, cat.name)}
          </Button>
        ))}

        {/* View All Toggle */}
        {liveCategories.length > 3 && (
          <button 
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-xs font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors px-2"
          >
            {showAllCategories ? "Show Less" : "View All"}
          </button>
        )}

        {/* Coming Soon categories (Distinct style) */}
        {comingSoonCategories.length > 0 && (
          <div className="ml-2 flex flex-wrap gap-2 pt-1 border-l border-primary/10 pl-4">
            {comingSoonCategories.map((cat) => (
              <div
                key={cat.id}
                className="group relative inline-flex items-center gap-2 rounded-full border border-dashed border-muted-foreground/20 bg-muted/30 px-3 py-1 text-[10px] font-bold text-muted-foreground/60 transition-all hover:bg-muted/50 cursor-help"
                title="Fresh items arriving soon!"
              >
                {t(`categories.${cat.slug}`, cat.name)}
                <span className="express-badge text-[7px] opacity-40 uppercase">Soon</span>
              </div>
            ))}
          </div>
        )}
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
            We're working hard to bring <strong>{t(`categories.${selectedCat?.slug}`, selectedCat?.name)}</strong>{" "}
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
          {(products as any[]).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default Products;
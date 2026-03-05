import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Truck, Sprout, HandCoins, ArrowRight, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import heroBanner from "@/assets/hero-banner.jpg";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Index = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Leaf, title: "Farmer to Consumer", desc: "Zero chemicals, zero pesticides — pure pasupu" },
    { icon: Truck, title: "Worldwide Delivery", desc: "Farm-to-door shipping across India & globally" },
    { icon: Sprout, title: "Single-Origin", desc: "Grown on our own turmeric farm in Telangana" },
    { icon: HandCoins, title: "No Middlemen", desc: "Direct from our farm to your door — fresher, cheaper, better" },
  ];

  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_featured", true).eq("is_active", true).limit(8);
      return (data || []) as any[];
    },
  });

  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          src={heroBanner}
          alt="Indhur Farms Turmeric"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="container relative z-10 mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm"
            >
              <Star className="h-3.5 w-3.5 fill-white" /> {t("hero.tagline")}
            </motion.span>
            <h1 className="font-display text-5xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-lg">
              {t("hero.title")}
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-white/85 font-medium">
              {t("hero.subtitle")}
            </p>
            <div className="mt-4 flex items-center gap-3 text-sm font-bold text-white/80">
              <Truck className="h-5 w-5" />
              <span>{t("hero.delivery")}</span>
            </div>
            <div className="mt-10 flex flex-wrap gap-5">
              <Link to="/products">
                <Button size="xl" className="rounded-full px-10 shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
                  {t("hero.shop_btn")} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="xl" className="rounded-full px-10 border-2 border-white/50 text-white bg-transparent hover:bg-white/10 transition-all backdrop-blur-sm">
                  {t("hero.story_btn")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute bottom-0 right-0 h-64 w-64 bg-primary/20 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-0 right-1/4 h-32 w-32 bg-secondary/20 blur-[60px] pointer-events-none rounded-full" />
      </section>

      {/* Features */}
      <section className="relative -mt-10 z-20 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="group flex flex-col items-center gap-4 rounded-3xl border border-border bg-card/80 p-8 text-center backdrop-blur-md shadow-lg hover:border-primary/50 hover:shadow-2xl transition-all"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="font-display text-base font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mb-3 font-display text-4xl font-black tracking-tight sm:text-5xl"
              >
                {t("products.title")}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="mx-auto max-w-2xl text-lg text-muted-foreground font-medium"
              >
                {t("products.subtitle")}
              </motion.p>
              <div className="mt-4 flex justify-center">
                <div className="h-1.5 w-24 rounded-full bg-primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {Object.values(featuredProducts.reduce((groups: Record<string, any>, product) => {
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
              }, {})).map((group: any, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ProductCard
                    baseName={group.baseName}
                    variants={group.variants}
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Link to="/products">
                <Button variant="outline" size="xl" className="group rounded-full px-12 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all">
                  {t("products.view_all")} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Farm Preview */}
      <section className="py-20 bg-background overflow-hidden relative">
        <div className="container mx-auto px-4">
          <div className="relative h-[400px] w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl group border border-primary/10">
            <img
              src="https://images.unsplash.com/photo-1627916607164-7b20241db935?auto=format&fit=crop&q=80&w=2000"
              alt="Farm Journey"
              className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:p-12">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md"
              >
                <Leaf className="h-3 w-3" /> Farm to Table
              </motion.span>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-display font-bold text-white mb-2"
              >
                Experience the journey of food
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-white/80 max-w-lg leading-relaxed text-sm md:text-base font-medium"
              >
                Straight from our fields to your home, without mediators.
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-muted-foreground/10 to-transparent pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="font-display text-4xl font-black leading-tight sm:text-6xl tracking-tight">
              {t("cta.title")}
            </h2>
            <p className="mt-6 text-xl text-primary-foreground/80 font-medium">
              {t("cta.subtitle")}
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
              <a href="https://www.instagram.com/indhur.farms" target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 rounded-full px-10 shadow-xl group">
                  {t("cta.follow")} <Star className="ml-2 h-5 w-5 fill-primary group-hover:rotate-45 transition-transform" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Background Patterns */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full border-2 border-white/5" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full border-2 border-white/5" />
      </section>
    </main>
  );
};

export default Index;
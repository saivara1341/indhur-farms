import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Truck, Sprout, HandCoins, ArrowRight, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import heroBanner from "@/assets/hero-banner.jpg";
import farmJourney from "@/assets/farm-journey.png";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { getTranslatedBaseName } from "@/lib/translations";
import { useEffect, useRef, useCallback } from "react";
import ReviewCarousel from "@/components/ReviewCarousel";
import MetaSEO from "@/components/MetaSEO";

const Index = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Leaf, title: t("features.f2c.title"), desc: t("features.f2c.desc") },
    { icon: Truck, title: t("features.delivery.title"), desc: t("features.delivery.desc") },
    { icon: Sprout, title: t("features.origin.title"), desc: t("features.origin.desc") },
    { icon: HandCoins, title: t("features.direct.title"), desc: t("features.direct.desc") },
  ];

  // ── Auto-scroll: activates after 2s of idle (no touch/mouse/keyboard/scroll) ──
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const SCROLL_SPEED = 0.7; // px per frame
  const IDLE_DELAY = 2000;  // ms

  const stopAutoScroll = useCallback(() => {
    isScrollingRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;

    const step = () => {
      if (!isScrollingRef.current) return;
      const atBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 2;
      if (atBottom) {
        stopAutoScroll();
        return;
      }
      window.scrollBy(0, SCROLL_SPEED);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [stopAutoScroll]);

  const resetIdleTimer = useCallback(() => {
    stopAutoScroll();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(startAutoScroll, IDLE_DELAY);
  }, [stopAutoScroll, startAutoScroll]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "touchstart", "touchmove", "keydown", "wheel", "scroll"];
    events.forEach(ev => window.addEventListener(ev, resetIdleTimer, { passive: true }));

    // Start idle timer on mount
    idleTimerRef.current = setTimeout(startAutoScroll, IDLE_DELAY);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetIdleTimer));
      stopAutoScroll();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer, startAutoScroll, stopAutoScroll]);



  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_featured", true).eq("is_active", true).limit(8);
      return (data || []) as any[];
    },
  });

  return (
    <main>
      <MetaSEO />
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
            {(() => {
              const tagline = t("hero.tagline");
              const parts = tagline.split(". 📦");
              return (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 flex w-fit flex-wrap items-center justify-center gap-x-2 gap-y-2 rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md text-center"
                >
                  <span className="opacity-90">{parts[0]}</span>
                  {parts[1] && (
                    <span className="whitespace-nowrap text-secondary font-black bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                      📦 {parts[1]}
                    </span>
                  )}
                </motion.span>
              );
            })()}
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
              {featuredProducts.map((product: any, i: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ProductCard product={product} showAllVariants={true} />
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

      {/* Reviews */}
      <ReviewCarousel />

      {/* Farm Preview */}
      <section id="farm-to-table" className="py-20 bg-background overflow-hidden relative">
        <div className="container mx-auto px-4">
          <div className="relative h-[400px] w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl group border border-primary/10">
            <img
              src={farmJourney}
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
                <Leaf className="h-3 w-3" /> {t("index.farm_journey.badge")}
              </motion.span>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-display font-bold text-white mb-2"
              >
                {t("index.farm_journey.title")}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-white/80 max-w-lg leading-relaxed text-sm md:text-base font-medium"
              >
                {t("index.farm_journey.desc")}
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
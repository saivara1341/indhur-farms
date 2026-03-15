import { motion } from "framer-motion";
import { Star, Quote, Instagram, MessageCircle, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const ReviewCarousel = () => {
  const { t } = useTranslation();
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  if (isLoading || !reviews || reviews.length === 0) return null;

  // Duplicate for seamless loop
  const displayReviews = [...reviews, ...reviews, ...reviews];

  return (
    <section className="py-20 overflow-hidden bg-muted/20">
      <div className="container mx-auto px-4 mb-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl font-black tracking-tight sm:text-5xl mb-4"
        >
          {t("reviews.title", "Customer Stories")}
        </motion.h2>
        <div className="h-1.5 w-24 rounded-full bg-primary mx-auto mb-6" />
        <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
          {t("reviews.subtitle", "Real feedback from our farm family on Website, Instagram, and WhatsApp.")}
        </p>
      </div>

      <div className="relative flex overflow-hidden group">
        <motion.div
          animate={{
            x: ["0%", "-33.33%"],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear",
            },
          }}
          className="flex gap-6 whitespace-nowrap py-4 px-3"
        >
          {displayReviews.map((review, idx) => (
            <div
              key={`${review.id}-${idx}`}
              className="inline-block w-[350px] shrink-0 whitespace-normal"
            >
              <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group/card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "fill-primary text-primary" : "text-muted/30"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground group-hover/card:bg-primary/10 group-hover/card:text-primary transition-colors">
                    {review.source === 'instagram' ? <Instagram className="h-4 w-4" /> : 
                     review.source === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : 
                     <Globe className="h-4 w-4" />}
                  </div>
                </div>

                <div className="relative mb-6">
                  <Quote className="absolute -top-2 -left-3 h-8 w-8 text-primary/10 -z-10" />
                  <p className="text-foreground/80 leading-relaxed font-medium italic">
                    "{review.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm uppercase">
                    {review.user_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{review.user_name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black"> {t("reviews.verified", "Verified")} {review.source}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewCarousel;

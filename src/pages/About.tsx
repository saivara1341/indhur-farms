import { Leaf, Heart, Sun, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import FounderSlideshow from "@/components/FounderSlideshow";

const About = () => {
  const { t } = useTranslation();

  return (
    <main>
      {/* Founder Section */}
      <section className="relative overflow-hidden bg-primary/5 py-24">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
              <div className="relative h-[400px] sm:h-[500px] w-full overflow-hidden rounded-3xl shadow-2xl border border-primary/10 -rotate-1 hover:rotate-0 transition-all duration-700">
                <FounderSlideshow className="h-full w-full" interval={5000} />
              </div>
              <div className="space-y-6">
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl relative inline-block">
                  Sanjana Reddy
                  <span className="block text-sm font-medium text-primary uppercase tracking-[0.2em] mt-1">Founder</span>
                  <span className="absolute -bottom-2 left-0 h-1.5 w-1/3 rounded-full bg-primary" />
                </h2>
                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                  <p>
                    Our farm is started with a simple goal — to connect farmers directly with consumers. I am a recent B.Tech graduate who believes in bringing farm products straight from the field to your home without mediators.
                  </p>
                  <p>
                    Through our farm, we grow and share products like turmeric and other crops, and we also welcome visitors who want to learn about farming and experience the journey of food from soil to table.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Leaf className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">{t("about.chemical_free")}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{t("about.chemical_free_desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary/10">
              <Heart className="h-7 w-7 text-secondary" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">{t("about.farm_to_table")}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{t("about.farm_to_table_desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Sun className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">{t("about.sustainable")}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{t("about.sustainable_desc")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold">{t("about.get_in_touch")}</h2>
          <p className="mt-3 text-muted-foreground">{t("about.get_in_touch_desc")}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.instagram.com/indhur.farms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              @indhur.farms
            </a>
            <a
              href="https://wa.me/919030854213"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              <Phone className="h-4 w-4" /> WhatsApp: 9030854213
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("about.worldwide_delivery")}</p>
        </div>
      </section>
    </main>
  );
};

export default About;
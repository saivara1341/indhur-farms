import { Leaf, Heart, Sun, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  return (
    <main>
      <section className="bg-gradient-hero py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold lg:text-5xl">{t("about.title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            {t("about.subtitle")}
          </p>
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
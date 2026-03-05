import { Leaf, Heart, Sun, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  return (
    <main>
      <section className="relative overflow-hidden bg-primary/5 py-24">
        <div className="container mx-auto px-4 text-center relative z-10 flex flex-col items-center">
          <img src="/favicon.png" alt="Indhur Farms Logo" className="h-32 w-32 object-contain mb-6 drop-shadow-md rounded-full bg-white p-2 border border-primary/10" />
          <h1 className="font-display text-5xl font-black text-foreground lg:text-6xl tracking-tight">Indhur Farms</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t("about.subtitle")}
          </p>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
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
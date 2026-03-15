import { Link } from "react-router-dom";
import { Instagram, Phone, MapPin, Mail, ArrowUpRight } from "lucide-react";
import indhurLogo from "@/assets/indhur-logo.png";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4 sm:grid-cols-2">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="mb-6 flex items-center gap-3">
              <img src={indhurLogo} alt="Indhur Farms" className="h-12 w-12 rounded-2xl object-cover shadow-sm ring-2 ring-primary/10" />
              <span className="font-display text-2xl font-black tracking-tight text-primary">Indhur Farms</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground font-medium">
              {t('footer.tagline')}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a href="https://www.instagram.com/indhur.farms" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="rounded-full hover:bg-primary hover:text-white transition-all">
                  <Instagram className="h-5 w-5" />
                </Button>
              </a>
              <a href="https://wa.me/919030854213" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="rounded-full hover:bg-primary hover:text-white transition-all">
                  <Phone className="h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-display text-lg font-bold uppercase tracking-wider text-foreground/80">{t('footer.quick_links')}</h4>
            <nav className="flex flex-col gap-3 font-medium text-muted-foreground">
              <Link to="/products" className="group flex items-center gap-1 hover:text-primary transition-colors">
                {t('footer.shop_all')} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-y-1 transition-all" />
              </Link>
              <Link to="/about" className="group flex items-center gap-1 hover:text-primary transition-colors">
                {t('footer.about_us')} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-y-1 transition-all" />
              </Link>
              <Link to="/profile" className="group flex items-center gap-1 hover:text-primary transition-colors">
                {t('footer.track_orders')} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-y-1 transition-all" />
              </Link>
              <Link to="/admin" className="group flex items-center gap-1 hover:text-primary transition-colors">
                {t('nav.manage_store')} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-y-1 transition-all" />
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="mb-6 font-display text-lg font-bold uppercase tracking-wider text-foreground/80">{t('footer.contact')}</h4>
            <div className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
              <a href="https://wa.me/919030854213" className="flex items-center gap-3 hover:text-primary transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                +91 9030854213
              </a>
              <a href="mailto:contact@indhurfarms.com" className="flex items-center gap-3 hover:text-primary transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                contact@indhurfarms.com
              </a>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                India
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-display text-lg font-bold uppercase tracking-wider text-foreground/80">{t('footer.follow_us')}</h4>
            <p className="mb-4 text-sm text-muted-foreground font-medium">{t('footer.follow_us_desc', 'Stay updated with our latest harvests and farming tips.')}</p>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">Instagram</p>
              <a href="https://www.instagram.com/indhur.farms" target="_blank" rel="noopener noreferrer" className="font-display text-lg font-black hover:underline hover:text-primary transition-all">
                @indhur.farms
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {t('footer.built_with', 'Built with ❤️')} <a href="https://siddhidynamics.in" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors">Siddhi Dynamics LLP</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
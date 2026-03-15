import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, ShoppingCart, Info, Package, User, ChevronRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useCallback } from "react";

const MobileBottomNav = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const isHome = location.pathname === "/";
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [manualExpand, setManualExpand] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!isHome) {
      if (isCollapsed) setIsCollapsed(false);
      return;
    }

    const section = document.getElementById("farm-to-table");
    if (!section) return;

    const sectionTop = section.offsetTop;
    const triggerPoint = sectionTop - 100; // Trigger slightly before the section

    const previous = scrollY.getPrevious();
    const diff = latest - (previous || 0);

    // Collapse only when reaching the Farm to Table section or below
    if (latest >= triggerPoint && diff > 5) {
      if (!isCollapsed && !manualExpand) setIsCollapsed(true);
    } 
    // Expand when scrolling up PAST the Farm to Table section
    else if (latest < triggerPoint || diff < -5) {
      if (isCollapsed || manualExpand) {
        setIsCollapsed(false);
        if (latest < triggerPoint) setManualExpand(false);
      }
    }
  });

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/products", label: "Shop", icon: ShoppingBag },
    { to: "/orders", label: "Orders", icon: Package },
    { to: "/cart", label: "Cart", icon: ShoppingCart, badge: cartCount },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe flex px-6",
      isCollapsed ? "justify-start" : "justify-center"
    )}>
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.8 }}
            className="mb-8 flex items-center gap-2 rounded-full border border-white/20 bg-white/70 px-2 py-2 shadow-2xl backdrop-blur-xl dark:bg-black/70"
          >
            <Link
              to="/"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setIsCollapsed(false);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30"
            >
              <Home className="h-6 w-6" />
            </Link>
            <button
              onClick={() => {
                setManualExpand(true);
                setIsCollapsed(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-primary hover:bg-white"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-4 mb-4 overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-2xl backdrop-blur-xl dark:bg-black/70 w-full"
          >
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="relative flex flex-col items-center gap-1 p-2 transition-all duration-300 active:scale-95"
                  >
                    <div className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                      isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}>
                      <Icon className={cn("h-5 w-5", isActive ? "scale-110" : "scale-100")} />
                      
                      {item.badge !== undefined && item.badge > 0 && (
                        <AnimatePresence>
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[8px] font-black text-secondary-foreground shadow-sm"
                          >
                            {item.badge}
                          </motion.span>
                        </AnimatePresence>
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                      isActive ? "text-primary opacity-100" : "text-muted-foreground opacity-70"
                    )}>
                      {item.label}
                    </span>

                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-1 h-0.5 w-4 rounded-full bg-primary"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default MobileBottomNav;

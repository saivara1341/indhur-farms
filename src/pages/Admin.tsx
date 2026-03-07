import { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import i18n from "@/i18n";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Package, ShoppingBag, ShoppingCart, Truck, Plus, Pencil, Trash2, CreditCard, Search, ExternalLink, ListTree, LayoutDashboard, Settings, ChevronRight, BarChart3, Users, Shield, ImagePlus, X, UploadCloud, Loader2, AlertTriangle, TrendingUp, Zap, Tag, TrendingDown, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { seedSampleData } from "@/lib/seedData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { getSmartFallback } from "@/lib/imageUtils";

// ─── Error Boundary for Admin Console ───
class AdminErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin Console Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 font-display text-xl font-bold text-foreground">{i18n.t('admin.unexpected_error')}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{i18n.t('admin.rendering_error_desc')}</p>
          <div className="mb-6 rounded-lg bg-black/5 p-4 text-left font-mono text-xs text-destructive dark:bg-white/5">
            {this.state.error?.message}
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">{i18n.t('admin.reload_console')}</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Utility for Safe Formatting ───
const safeFormat = (val: any, decimals = 0) => {
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const Admin = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const action = searchParams.get("action");
  const { toast } = useToast();

  useEffect(() => {
    if (!user && !adminLoading) {
      navigate("/auth");
    }
  }, [user, adminLoading, navigate]);

  const { data: lowStockCount } = useQuery({
    queryKey: ["low-stock-count"],
    queryFn: async () => {
      const { count } = await (supabase.from("products" as any).select("*", { count: "exact", head: true }) as any).lte("stock", 10).eq("is_active", true);
      return count || 0;
    },
    enabled: !!user && isAdmin,
    refetchInterval: 60000,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ["pending-orders-count"],
    queryFn: async () => {
      const { count } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000,
  });

  if (!user || adminLoading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium animate-pulse">{t('admin.authenticating')}</p>
    </div>
  );

  if (!isAdmin) return (
    <main className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 rounded-full bg-destructive/10 p-4">
        <Shield className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mb-2 font-display text-2xl font-bold">{t('admin.access_denied')}</h1>
      <p className="max-w-md text-muted-foreground">{t('admin.access_denied_desc')}</p>
      <Button onClick={() => navigate("/")} variant="outline" className="mt-6">{t('admin.return_to_store')}</Button>
    </main>
  );

  const menuItems = [
    { id: "dashboard", label: t('admin.dashboard'), icon: LayoutDashboard },
    { id: "products", label: t('admin.catalogue'), icon: Package, badge: (lowStockCount || 0) > 0 ? lowStockCount : null, badgeColor: "bg-orange-500" },
    { id: "categories", label: t('admin.categories'), icon: ListTree },
    { id: "orders", label: t('admin.orders'), icon: ShoppingBag, badge: (pendingCount || 0) > 0 ? pendingCount : null, badgeColor: "bg-red-500" },
    { id: "offers", label: "Offers & Discounts", icon: Tag },
    { id: "delivery", label: t('admin.logistics'), icon: Truck },
    { id: "settings", label: t('admin.settings'), icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-muted/20">
      {/* Sidebar Navigation */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <span className="font-display text-lg font-bold text-primary">{t('admin.console')}</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSearchParams({ tab: item.id })}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
              {(item as any).badge && (
                <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${(item as any).badgeColor}`}>
                  {(item as any).badge}
                </span>
              )}
              {activeTab === item.id && !(item as any).badge && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Top Navigation - Visible only on small screens */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-2 py-1 md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-none px-1 gap-2">
          {menuItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setSearchParams({ tab: item.id })}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 transition-colors",
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn("text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap transition-all", activeTab === item.id ? "block" : "hidden sm:block")}>
                {item.id === 'dashboard' ? 'Home' : item.label.split(' ')[0]}
              </span>
              {(item as any).badge && (
                <span className={`absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${(item as any).badgeColor}`}>
                  {(item as any).badge}
                </span>
              )}
              {activeTab === item.id && <motion.div layoutId="activeTabMobile" className="absolute -bottom-1 h-0.5 w-8 bg-primary rounded-full" />}
            </button>
          ))}
          {/* Settings icon as the last one if space allows or just settings */}
          <button
            onClick={() => setSearchParams({ tab: 'settings' })}
            className={cn(
              "relative flex flex-col items-center gap-1 p-2 transition-colors",
              activeTab === 'settings' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className={cn("text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap transition-all", activeTab === 'settings' ? "block" : "hidden sm:block")}>
              Settings
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-4 p-4 lg:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold capitalize">
              {activeTab === 'products' ? t('admin.catalogue') :
                activeTab === 'delivery' ? t('admin.logistics') :
                  t(`admin.${activeTab}`)}
            </h1>
          </div>

          <div className="min-h-[60vh]">
            <AdminErrorBoundary>
              {activeTab === "dashboard" && <DashboardHome />}
              {activeTab === "products" && <ProductsTab defaultOpen={action === "new"} />}
              {activeTab === "categories" && <CategoriesTab defaultOpen={action === "new"} />}
              {activeTab === "orders" && <OrdersTab />}
              {activeTab === "offers" && <OffersTab />}
              {activeTab === "delivery" && <DeliveryTab />}
              {activeTab === "settings" && <SettingsTab />}
              {!["dashboard", "products", "categories", "orders", "offers", "delivery", "settings"].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-muted-foreground">{t('admin.tab_not_found')}: {activeTab}</p>
                  <Button variant="link" onClick={() => setSearchParams({ tab: "dashboard" })}>{t('admin.return_to_dashboard')}</Button>
                </div>
              )}
            </AdminErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
};

const DashboardHome = () => {
  const { t } = useTranslation();
  const { data: revenueData } = useQuery({
    queryKey: ["revenue-summary"],
    queryFn: async () => {
      const { data } = await supabase.from("revenue_summary" as any).select("*").limit(14);
      return (data || []).map((r: any) => ({
        day: r.day ? new Date(r.day).toLocaleDateString(i18n.language, { day: "numeric", month: "short" }) : '...',
        revenue: Number(r.revenue || 0),
        orders: Number(r.order_count || 0),
      })).reverse();
    },
  });

  const { data: forecastData } = useQuery({
    queryKey: ["revenue-forecast"],
    queryFn: async () => {
      const { data } = await supabase.from("revenue_forecast" as any).select("*").maybeSingle();
      return data;
    },
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products" as any).select("id,name,stock,unit").lte("stock", 10).order("stock", { ascending: true });
      return data || [];
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ["top-products"],
    queryFn: async () => {
      const { data } = await supabase.from("top_products" as any).select("*").gt("units_sold", 0).limit(5);
      return data || [];
    },
  });

  return (
    <div className="space-y-8">
      <StatsGrid lowStockItems={lowStockItems} />

      {/* Revenue Chart */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> {t('admin.revenue_14_days')}</CardTitle>
            <CardDescription>
              {t('admin.daily_revenue')}
              {forecastData && (forecastData as any).predicted_weekly_revenue != null && (
                <span className="ml-1 text-primary font-semibold">
                  {t('admin.predicted_weekly')}: ₹{safeFormat((forecastData as any).predicted_weekly_revenue)}
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v: any) => [`₹${v}`, t('admin.total_revenue')]} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground italic text-sm">
              <BarChart3 className="mr-3 h-8 w-8 opacity-20" /> {t('admin.revenue_chart_empty')}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <Card className={`shadow-sm ${lowStockItems && lowStockItems.length > 0 ? "border-orange-300 bg-orange-50/30 dark:bg-orange-950/10" : "border-border/60"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${lowStockItems && lowStockItems.length > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              {t('admin.low_stock_alerts')}
            </CardTitle>
            <CardDescription>{t('admin.low_stock_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems && lowStockItems.length > 0 ? (
              <div className="space-y-2">
                {lowStockItems.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 px-4 py-2">
                    <span className="font-medium text-sm">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {p.estimated_days_left < 30 ? `~${p.estimated_days_left} days left` : "Stable"}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.stock === 0 ? "bg-red-500 text-white" :
                        p.stock <= 5 ? "bg-orange-500 text-white" :
                          "bg-amber-400 text-white"
                        }`}>
                        {p.stock === 0 ? "OUT" : `${p.stock} ${p.unit || "left"}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t('admin.all_well_stocked')}</p>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> {t('admin.top_products')}</CardTitle>
            <CardDescription>{t('admin.top_products_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts && (topProducts as any[]).length > 0 ? (
              <div className="space-y-2">
                {(topProducts as any[]).map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-muted-foreground">#{i + 1}</span>
                    {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                    <span className="flex-1 text-sm font-medium truncate">{p.name || "Unknown Product"}</span>
                    <span className="text-xs text-muted-foreground">{p.units_sold || 0} sold</span>
                    <span className="text-xs font-semibold text-primary">₹{safeFormat(p.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t('admin.top_sales_empty')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─── Stats Grid ───
const StatsGrid = ({ lowStockItems }: { lowStockItems: any[] | undefined }) => {
  const { t } = useTranslation();
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data: orders } = await supabase.from("orders" as any).select("total, status");
      const { count: productsCount } = await supabase.from("products" as any).select("*", { count: 'exact', head: true });
      const { count: categoryCount } = await supabase.from("categories" as any).select("*", { count: 'exact', head: true });

      const totalRevenue = (orders as any[])?.reduce((acc, curr) => acc + Number(curr.total), 0) || 0;
      const totalOrders = (orders as any[])?.length || 0;
      const pendingOrders = (orders as any[])?.filter(o => o.status === 'pending').length || 0;

      return { totalRevenue, totalOrders, pendingOrders, productsCount, categoryCount };
    }
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{t('admin.total_revenue')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{safeFormat(stats?.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">{t('admin.confirmed_orders', { count: stats?.totalOrders || 0 })}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{t('admin.total_products')}</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.productsCount || 0}</div>
          <p className="text-xs text-muted-foreground">{t('admin.across_categories')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{t('admin.low_stock_items')}</CardTitle>
          <Zap className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{lowStockItems?.length || 0}</div>
          <p className="text-xs text-muted-foreground">{t('admin.items_needing_attention')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{t('admin.active_categories')}</CardTitle>
          <ListTree className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.categoryCount || 0}</div>
          <p className="text-xs text-muted-foreground">{t('admin.product_groupings')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Products Tab ───
const ProductsTab = ({ defaultOpen }: { defaultOpen?: boolean }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(defaultOpen || false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products" as any).select("*, categories(name, slug)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filteredProducts = (products as any[])?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories" as any).select("*");
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: t('products.deleted') });
    },
    onError: (e: any) => toast({ title: t('common.error'), description: e.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('products.loading')}</p>
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold">{t('admin.products_title', { count: filteredProducts?.length })}</h2>
          <p className="text-sm text-muted-foreground">{t('admin.manage_inventory')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('admin.search_products')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-11 sm:h-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1 sm:w-[160px] h-11 sm:h-10">
                <SelectValue placeholder={t('products.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('products.all')}</SelectItem>
                {(categories as any[])?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => { setEditProduct(null); setShowForm(true); }} className="gap-2 bg-primary h-11 sm:h-10 px-4">
              <Plus className="h-5 w-5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">{t('admin.add_product')}</span><span className="xs:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={editProduct}
          categories={categories || []}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditProduct(null);
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
          }}
        />
      )}

      {filteredProducts && filteredProducts.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">{t('admin.image')}</TableHead>
                <TableHead>{t('admin.name')}</TableHead>
                <TableHead>{t('admin.price')}</TableHead>
                <TableHead>{t('admin.stock')}</TableHead>
                <TableHead>{t('admin.active')}</TableHead>
                <TableHead className="text-right">{t('admin.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filteredProducts as any[]).map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <img src={p.image_url || getSmartFallback(p.name, p.slug)} alt={p.name} className="h-12 w-12 rounded-lg object-cover ring-1 ring-border shadow-sm" />
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{p.name}</TableCell>
                  <TableCell className="whitespace-nowrap font-semibold">
                    ₹{Number(p.price)}
                    {p.compare_at_price ? <span className="ml-1.5 text-xs text-muted-foreground line-through opacity-70">₹{Number(p.compare_at_price)}</span> : null}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${Number(p.stock) < 10 ? "text-orange-600 font-bold" : "text-foreground"}`}>
                      {p.stock} {p.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${p.is_active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>
                      {p.is_active ? t('admin.status_active') : t('admin.status_inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild title={t('admin.view_on_site')} className="hover:text-primary transition-colors">
                        <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditProduct(p); setShowForm(true); }} title={t('admin.edit')} className="hover:text-amber-600 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => {
                        if (confirm(t('admin.delete_confirm'))) deleteMutation.mutate(p.id);
                      }} title={t('admin.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-12 text-center bg-muted/5">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Package className="h-10 w-10 text-primary opacity-60" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold">{t('admin.no_products_found')}</h3>
          <p className="mb-6 max-w-sm text-muted-foreground">
            {search || categoryFilter !== "all"
              ? t('admin.no_products_match')
              : t('admin.no_products_yet')}
          </p>
          <div className="flex gap-4">
            {(search || categoryFilter !== "all") ? (
              <Button variant="outline" onClick={() => { setSearch(""); setCategoryFilter("all"); }}>
                {t('admin.clear_filters')}
              </Button>
            ) : (
              <Button onClick={() => setShowForm(true)} className="gap-2 px-8">
                <Plus className="h-4 w-4" /> {t('admin.add_first_product')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Product Form ───
const ProductForm = ({ product, categories, onClose, onSaved }: { product: any; categories: any[]; onClose: () => void; onSaved: () => void }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    price: product?.price?.toString() || "",
    compare_at_price: product?.compare_at_price?.toString() || "",
    description: product?.description || "",
    image_url: product?.image_url || "",
    gallery: product?.gallery || [] as string[],
    stock: product?.stock?.toString() || "100",
    unit: product?.unit || "kg",
    category_id: product?.category_id || "",
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
  });

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      try {
        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      } catch (error: any) {
        console.error("Upload error details:", error);

        // Specific handling for "Bucket not found"
        if (error.message?.includes("bucket not found") || error.error === "Bucket not found") {
          toast({
            title: "Infrastructure Error: Bucket Missing",
            description: "The 'product-images' storage bucket does not exist. Please create it in your Supabase Dashboard -> Storage.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Upload Error",
            description: error.message || "Failed to upload image. Check console for details.",
            variant: "destructive"
          });
        }
      }
    }

    setForm(prev => ({
      ...prev,
      gallery: [...prev.gallery, ...newUrls],
      image_url: prev.image_url || newUrls[0]
    }));
    setUploading(false);
  };

  const removeImage = (url: string) => {
    setForm(prev => {
      const newGallery = prev.gallery.filter(u => u !== url);
      return {
        ...prev,
        gallery: newGallery,
        image_url: prev.image_url === url ? (newGallery[0] || "") : prev.image_url
      };
    });
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      description: form.description || null,
      image_url: form.image_url || form.gallery[0] || null,
      gallery: form.gallery,
      stock: parseInt(form.stock) || 0,
      unit: form.unit || null,
      category_id: form.category_id || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
    } as any;

    try {
      if (product) {
        const { error } = await (supabase.from("products" as any).update(payload as any) as any).eq("id", product.id);
        if (error) throw error;
        toast({ title: t('products.updated') });
      } else {
        const { error } = await (supabase.from("products" as any).insert(payload as any) as any);
        if (error) throw error;
        toast({ title: t('products.created') });
      }
      onSaved();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="font-display text-xl font-bold">{product ? t('admin.form.edit_product') : t('admin.form.add_new_product')}</h3>
          <p className="text-sm text-muted-foreground">{t('admin.form.form_desc')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">{t('admin.form.cancel')}</Button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{t('admin.form.product_details')}</Label></div>
          <div className="grid gap-3">
            <div><Label>{t('admin.form.name')}</Label><Input required value={form.name} placeholder={t('admin.form.name_placeholder')} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>{t('admin.form.price')}</Label><Input type="number" step="0.01" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>{t('admin.form.stock')}</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{t('admin.form.unit')}</Label>
                <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg, g, piece" />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {["250g", "500g", "1kg", "1 unit", "5kg"].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, unit: u }))}
                      className={cn(
                        "rounded bg-secondary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase hover:bg-secondary/40 transition-colors",
                        form.unit === u && "bg-primary text-white"
                      )}
                    >{u}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>{t('admin.form.category')}</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder={t('admin.form.select_category')} /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{t('admin.form.images')}</Label></div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t('admin.form.images')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {form.gallery.map((url, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted shadow-sm">
                    <img src={url} alt="Gallery" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, image_url: url }))}
                        className={`p-1.5 rounded-full ${form.image_url === url ? 'bg-primary text-white' : 'bg-white/20 text-white'}`}
                        title="Set as Main Image"
                      >
                        <Shield className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="p-1.5 rounded-full bg-destructive/80 text-white hover:bg-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {form.image_url === url && (
                      <div className="absolute top-1 left-1 bg-primary text-[8px] font-bold text-white px-1.5 rounded-sm uppercase tracking-tighter">Main</div>
                    )}
                  </div>
                ))}

                <label className="relative flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-tight">{uploading ? t('admin.form.uploading') : t('admin.form.upload')}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Main Image URL (Legacy)</Label>
              <Input value={form.image_url} placeholder="Primary URL..." onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="text-xs" />
            </div>

            <div><Label>{t('admin.form.slug')}</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="bg-muted/50 font-mono text-xs" /></div>
          </div>
        </div>

        <div className="sm:col-span-2 space-y-2 mt-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{t('admin.form.description')}</Label>
          <Textarea value={form.description} placeholder={t('admin.form.desc_placeholder')} className="min-h-[100px]" onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> {t('admin.form.active')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} /> {t('admin.form.featured')}</label>
        </div>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={saving}>{saving ? t('admin.form.saving') : t('admin.form.save')}</Button>
        </div>
      </form>
    </div>
  );
};

// ─── Orders Tab ───
const STATUS_PIPELINE = ["pending", "confirmed", "shipped", "delivered"] as const;
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-50  dark:bg-amber-950/20", text: "text-amber-700  dark:text-amber-300", dot: "bg-amber-500" },
  confirmed: { bg: "bg-blue-50   dark:bg-blue-950/20", text: "text-blue-700   dark:text-blue-300", dot: "bg-blue-500" },
  shipped: { bg: "bg-violet-50 dark:bg-violet-950/20", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  delivered: { bg: "bg-green-50  dark:bg-green-950/20", text: "text-green-700  dark:text-green-300", dot: "bg-green-500" },
  cancelled: { bg: "bg-red-50    dark:bg-red-950/20", text: "text-red-700    dark:text-red-300", dot: "bg-red-500" },
};

const OrdersTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders" as any)
        .select("*, order_items(*, products(name, image_url, slug))")
        .order("created_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await (supabase.from("orders" as any).update({ status } as any) as any).eq("id", orderId);
    if (error) { toast({ title: t('admin.error'), description: error.message, variant: "destructive" }); return; }
    toast({ title: t('admin.order_moved', { status: t(`admin.pipeline.${status}`) }) });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["pending-orders-count"] });
  };

  const updatePayment = async (orderId: string, paymentStatus: string) => {
    const { error } = await (supabase.from("orders" as any).update({ payment_status: paymentStatus } as any) as any).eq("id", orderId);
    if (error) { toast({ title: t('admin.error'), description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast({ title: paymentStatus === "verified" ? `💰 ${t('admin.payment_verified')}` : t('admin.payment_status_updated') });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('admin.loading')}</p>
    </div>
  );

  const filtered = filter === "all" ? (orders as any[]) : (orders as any[])?.filter(o => o.status === filter);
  const counts = STATUS_PIPELINE.reduce((acc, s) => ({ ...acc, [s]: (orders as any[])?.filter(o => o.status === s).length || 0 }), {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Pipeline Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all",
            filter === "all" ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >{t('admin.all')} ({(orders as any[])?.length})</button>
        {STATUS_PIPELINE.map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap capitalize transition-all",
              filter === s ? `${STATUS_STYLES[s].bg} ${STATUS_STYLES[s].text} ring-1 ring-current` : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >{t(`admin.pipeline.${s}`)} {counts[s] > 0 && `(${counts[s]})`}</button>
        ))}
      </div>

      {/* Order Cards */}
      {filtered?.map((order: any) => {
        const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
        const orderNum = (order as any).order_number || `#${order.id.slice(0, 8)}`;
        const payStatus = (order as any).payment_status || "pending";
        return (
          <div key={order.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className={cn("flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b", style.bg)}>
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", style.dot)} />
                <span className={cn("font-bold text-sm", style.text)}>{orderNum}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", style.bg, style.text)}>{t(`admin.pipeline.${order.status}`)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold border",
                  payStatus === "verified" ? "bg-green-100 text-green-700 border-green-300" :
                    payStatus === "failed" ? "bg-red-100 text-red-700 border-red-300" :
                      "bg-amber-100 text-amber-700 border-amber-300"
                )}>💰 {t(`admin.payment_status.${payStatus}`)}</span>
                <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString(i18n.language, { day: "numeric", month: "short" })}</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="font-semibold">{(order as any).customer_name || t('admin.customer')}</p>
                <p className="text-xs text-muted-foreground">📍 {order.shipping_address}</p>
                {order.phone && <p className="text-xs text-muted-foreground">📞 {order.phone}</p>}
                {(order as any).payment_txn_id && (
                  <p className="text-xs font-mono bg-muted px-2 py-0.5 rounded inline-block">Txn: {(order as any).payment_txn_id}</p>
                )}
                {(order as any).payment_screenshot_url && (
                  <div className="mt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
                          <ExternalLink className="h-3 w-3" /> {t('admin.view_payment_screenshot') || "View Receipt Screenshot"}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{t('admin.payment_receipt') || "Payment Receipt"} - {orderNum}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-4">
                          <img
                            src={(order as any).payment_screenshot_url}
                            alt="Payment Screenshot"
                            className="max-h-[70vh] w-full rounded-lg object-contain shadow-premium"
                          />
                          <a
                            href={(order as any).payment_screenshot_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 flex items-center gap-2 text-sm text-primary underline"
                          >
                            <ExternalLink className="h-4 w-4" /> {t('admin.open_full_image') || "Open full image in new tab"}
                          </a>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                <p className="font-bold text-lg text-primary">₹{safeFormat(order.total)}</p>
              </div>

              {/* Items */}
              <div className="flex flex-wrap gap-1.5">
                {(order.order_items as any[])?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs">
                    <img src={item.products?.image_url || getSmartFallback(item.products?.name, item.products?.slug)} alt="" className="h-7 w-7 rounded object-cover" />
                    <span className="font-medium">{item.products?.name} ×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 border-t bg-muted/30 px-5 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t('admin.status')}:</span>
                <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">🕐 {t('admin.pipeline.pending')}</SelectItem>
                    <SelectItem value="confirmed">✅ {t('admin.pipeline.confirmed')}</SelectItem>
                    <SelectItem value="shipped">🚚 {t('admin.pipeline.shipped')}</SelectItem>
                    <SelectItem value="delivered">🎉 {t('admin.pipeline.delivered')}</SelectItem>
                    <SelectItem value="cancelled">❌ {t('admin.pipeline.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t('admin.payment')}:</span>
                <Select value={payStatus} onValueChange={v => updatePayment(order.id, v)}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('admin.payment_status.pending')}</SelectItem>
                    <SelectItem value="verified">✅ {t('admin.payment_status.verified')}</SelectItem>
                    <SelectItem value="failed">❌ {t('admin.payment_status.failed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Quick next-step button */}
              {order.status === "pending" && (
                <button onClick={() => updateStatus(order.id, "confirmed")}
                  className="ml-auto rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors">
                  ✅ {t('admin.confirm_order')}
                </button>
              )}
              {order.status === "confirmed" && (
                <button onClick={() => updateStatus(order.id, "shipped")}
                  className="ml-auto rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors">
                  🚚 {t('admin.mark_shipped')}
                </button>
              )}
              {order.status === "shipped" && (
                <button onClick={() => updateStatus(order.id, "delivered")}
                  className="ml-auto rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition-colors">
                  🎉 {t('admin.mark_delivered')}
                </button>
              )}
            </div>
          </div>
        );
      })}
      {filtered?.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p>{t('admin.no_orders', { filter: filter === "all" ? "" : t(`admin.pipeline.${filter}`) })}</p>
        </div>
      )}
    </div>
  );
};

// ─── Delivery Tab ───
const DeliveryTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ order_id: "", tracking_number: "", courier_name: "", notes: "" });
  const [customCourier, setCustomCourier] = useState("");

  const { data: orders } = useQuery({
    queryKey: ["admin-orders-for-delivery"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, status, shipping_address").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: receipts, isLoading } = useQuery({
    queryKey: ["admin-delivery-receipts"],
    queryFn: async () => {
      const { data } = await supabase.from("delivery_receipts").select("*, orders(id, shipping_address, phone, total, status)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCourierName = form.courier_name === "Other" ? customCourier : form.courier_name;
    const { error } = await (supabase.from("delivery_receipts" as any).insert({
      order_id: form.order_id,
      tracking_number: form.tracking_number || null,
      courier_name: finalCourierName || null,
      notes: form.notes || null,
    } as any) as any);
    if (error) { toast({ title: t('admin.error'), description: error.message, variant: "destructive" }); return; }
    await (supabase.from("orders" as any).update({ status: "shipped" } as any) as any).eq("id", form.order_id);
    toast({ title: t('admin.delivery.receipt_created') });
    setShowForm(false);
    setForm({ order_id: "", tracking_number: "", courier_name: "", notes: "" });
    setCustomCourier("");
    queryClient.invalidateQueries({ queryKey: ["admin-delivery-receipts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const updateDeliveryStatus = async (id: string, status: string, orderId: string) => {
    const { error } = await (supabase.from("delivery_receipts" as any).update({
      status,
      ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
    } as any) as any).eq("id", id);

    if (error) { toast({ title: t('admin.error'), description: error.message, variant: "destructive" }); return; }

    if (status === "delivered") {
      await (supabase.from("orders" as any).update({ status: "delivered" } as any) as any).eq("id", orderId);
    }
    toast({ title: t('admin.delivery.status_updated', { status: t(`admin.delivery.${status}`) }) });
    queryClient.invalidateQueries({ queryKey: ["admin-delivery-receipts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('admin.delivery.loading')}</p>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">{t('admin.delivery.title')} ({receipts?.length})</h2>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-1 h-4 w-4" /> {t('admin.delivery.new_receipt')}</Button>
      </div>

      {showForm && (
        <form onSubmit={createReceipt} className="mb-6 rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-semibold">{t('admin.delivery.new_receipt_title')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('admin.delivery.order')}</Label>
              <Select value={form.order_id} onValueChange={v => setForm(f => ({ ...f, order_id: v }))}>
                <SelectTrigger><SelectValue placeholder={t('admin.delivery.select_order')} /></SelectTrigger>
                <SelectContent>
                  {(orders as any[])?.map(o => (
                    <SelectItem key={o.id} value={o.id}>#{o.id.slice(0, 8)} — {t(`admin.pipeline.${o.status}`)} — {o.shipping_address?.slice(0, 30)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t('admin.delivery.tracking_id')}</Label><Input value={form.tracking_number} onChange={e => setForm(f => ({ ...f, tracking_number: e.target.value }))} /></div>
            <div>
              <Label>{t('admin.delivery.courier_name')}</Label>
              <Select value={form.courier_name} onValueChange={v => setForm(f => ({ ...f, courier_name: v }))}>
                <SelectTrigger><SelectValue placeholder={t('admin.delivery.select_courier')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BlueKart">BlueKart</SelectItem>
                  <SelectItem value="DFDC">DFDC</SelectItem>
                  <SelectItem value="Indian Post">Indian Post</SelectItem>
                  <SelectItem value="Other">{t('admin.delivery.other_custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.courier_name === "Other" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden"
              >
                <Label>{t('admin.delivery.custom_courier')}</Label>
                <Input
                  required={form.courier_name === "Other"}
                  value={customCourier}
                  onChange={e => setCustomCourier(e.target.value)}
                  placeholder={t('admin.delivery.enter_courier')}
                />
              </motion.div>
            )}
            <div><Label>{t('admin.delivery.notes')}</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>{t('profile.cancel')}</Button>
            <Button type="submit" disabled={!form.order_id}>{t('admin.delivery.create_receipt')}</Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {receipts?.map((r: any) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">#{r.order_id?.slice(0, 8)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.status === "delivered" ? "bg-emerald-500/10 text-emerald-600" :
                    r.status === "shipped" || r.status === "in_transit" || r.status === "out_for_delivery" ? "bg-blue-500/10 text-blue-600" :
                      "bg-muted text-muted-foreground"
                    }`}>{r.status ? t(`admin.delivery.${r.status}`) : t('admin.loading')}</span>
                </div>
                {r.tracking_number && <p className="text-sm font-bold">🔢 {r.tracking_number}</p>}
                {r.courier_name && <p className="text-xs text-muted-foreground font-medium">📦 {r.courier_name}</p>}
                {r.orders?.phone && <p className="text-xs text-muted-foreground">📞 {r.orders.phone}</p>}
                {r.orders?.shipping_address && <p className="text-xs text-muted-foreground line-clamp-2">📍 {r.orders.shipping_address}</p>}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-border/50">
                <Select value={r.status || "shipped"} onValueChange={v => updateDeliveryStatus(r.id, v, r.order_id)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipped">{t('admin.delivery.shipped')}</SelectItem>
                    <SelectItem value="in_transit">{t('admin.delivery.in_transit')}</SelectItem>
                    <SelectItem value="out_for_delivery">{t('admin.delivery.out_for_delivery')}</SelectItem>
                    <SelectItem value="delivered">{t('admin.delivery.delivered')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('admin.delivery.created_at')} {r.shipped_at ? new Date(r.shipped_at).toLocaleDateString(i18n.language) : new Date(r.created_at).toLocaleDateString(i18n.language)}
              {r.delivered_at && ` | ${t('admin.delivery.delivered_at')} ${new Date(r.delivered_at).toLocaleDateString(i18n.language)}`}
            </p>
          </div>
        ))}
        {receipts?.length === 0 && <p className="py-10 text-center text-muted-foreground">{t('admin.delivery.no_receipts')}</p>}
      </div>
    </div>
  );
};

// ─── Settings Tab ───
const SettingsTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { settings, loading: settingsLoading } = useSettings();

  const [form, setForm] = useState({
    upi_id: "indhurfarms@upi",
    qr_code_url: "",
    shop_name: "Indhur Farms",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        upi_id: settings.upi_id || "indhurfarms@upi",
        qr_code_url: settings.qr_code_url || "",
        shop_name: settings.shop_name || "Indhur Farms",
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("site_settings" as any).upsert({
        id: settings?.id || 1, // Using ID 1 as the single settings row
        ...form
      } as any);
      if (error) throw error;
      toast({ title: t('admin.settings_config.updated') });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (err: any) {
      toast({ title: t('admin.error'), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const [uploadingQR, setUploadingQR] = useState(false);

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQR(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `qr-code-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `settings/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images') // Reusing the same bucket for now, or could use a new one
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, qr_code_url: publicUrl }));
      toast({ title: t('admin.settings_config.qr_uploaded'), description: t('admin.settings_config.qr_uploaded_desc') });
    } catch (error: any) {
      toast({ title: t('admin.settings_config.upload_failed'), description: error.message, variant: "destructive" });
    } finally {
      setUploadingQR(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="mb-4 font-display text-xl font-semibold">{t('admin.settings_config.title')}</h2>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label>{t('admin.settings_config.upi_id')}</Label>
                <Input value={form.upi_id} onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))} />
                <p className="mt-1 text-[10px] text-muted-foreground uppercase">{t('admin.settings_config.upi_hint') || "Used for QR generation and direct links"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.settings_config.qr_label')}</Label>
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-4">
                {form.qr_code_url ? (
                  <>
                    <img src={form.qr_code_url} alt="QR Code" className="h-full w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, qr_code_url: "" }))}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 text-destructive hover:bg-white shadow-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <label className="flex h-full w-full flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors gap-2">
                    {uploadingQR ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <UploadCloud className="h-8 w-8 text-primary" />}
                    <div className="text-center">
                      <p className="text-sm font-bold text-primary uppercase tracking-tight">{t('admin.settings_config.qr_upload_title')}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{t('admin.settings_config.qr_upload_hint')}</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleQRUpload} disabled={uploadingQR} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={loading}>{loading ? t('admin.saving') : t('admin.settings_config.save_settings')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Categories Tab ───
const CategoriesTab = ({ defaultOpen }: { defaultOpen?: boolean }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editCategory, setEditCategory] = useState<any>(null);
  const [showForm, setShowForm] = useState(defaultOpen || false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories" as any).select("*").order("name");
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: t('admin.category_deleted') });
    },
    onError: (e: any) => toast({ title: t('admin.error'), description: t('admin.category_delete_error'), variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('admin.loading_categories')}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">{t('admin.categories')} ({categories?.length})</h2>
          <p className="text-sm text-muted-foreground text-primary/80">{t('admin.category_desc')}</p>
        </div>
        <Button onClick={() => { setEditCategory(null); setShowForm(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> {t('admin.add_category')}
        </Button>
      </div>

      {showForm && (
        <CategoryForm
          category={editCategory}
          onClose={() => { setShowForm(false); setEditCategory(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditCategory(null);
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
          }}
        />
      )}

      {categories && categories.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="whitespace-nowrap">{t('admin.name') || "Name"}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('admin.slug') || "Slug"}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('admin.description') || "Description"}</TableHead>
                <TableHead className="text-right">{t('admin.actions') || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories as any[]).map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-primary whitespace-nowrap">{c.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                      {c.slug}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[120px] sm:max-w-xs truncate text-muted-foreground text-xs sm:text-sm">
                    {c.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditCategory(c); setShowForm(true); }} title="Edit" className="hover:text-amber-600 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => {
                        if (confirm(t('admin.delete_category_confirm'))) deleteMutation.mutate(c.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-12 text-center bg-muted/5">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <ListTree className="h-10 w-10 text-primary opacity-60" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold">{t('admin.no_categories_yet')}</h3>
          <p className="mb-6 max-w-sm text-muted-foreground">
            {t('admin.categories_help')}
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2 px-8">
            <Plus className="h-4 w-4" /> {t('admin.create_first_category')}
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Category Form ───
const CategoryForm = ({ category, onClose, onSaved }: { category: any; onClose: () => void; onSaved: () => void }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      description: form.description || null,
    } as any;

    try {
      if (category) {
        const { error } = await (supabase.from("categories" as any).update(payload as any) as any).eq("id", category.id);
        if (error) throw error;
        toast({ title: t('admin.category_updated') });
      } else {
        const { error } = await (supabase.from("categories" as any).insert(payload as any) as any);
        if (error) throw error;
        toast({ title: t('admin.category_created') });
      }
      onSaved();
    } catch (err: any) {
      toast({ title: t('admin.error'), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{category ? t('admin.edit_category') : t('admin.new_category')}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>{t('profile.cancel')}</Button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t('admin.form.name')}</Label>
          <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} />
        </div>
        <div>
          <Label>{t('admin.form.slug')}</Label>
          <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
        </div>
        <div className="sm:col-span-2">
          <Label>{t('admin.form.description')}</Label>
          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={saving}>{saving ? t('admin.saving') : category ? t('admin.form.save') : t('admin.add_category')}</Button>
        </div>
      </form>
    </div>
  );
};

// ─── Offers Tab ───
const OffersTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editOffer, setEditOffer] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [analyserProductId, setAnalyserProductId] = useState("");
  const [analyserCostPrice, setAnalyserCostPrice] = useState("");
  const [analyserDiscount, setAnalyserDiscount] = useState("");
  const [analyserDiscountType, setAnalyserDiscountType] = useState<"percentage" | "fixed">("percentage");

  const [form, setForm] = useState({
    title: "",
    product_id: "",   // empty means "all products"
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    is_active: true,
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products-for-offers"],
    queryFn: async () => {
      const { data } = await supabase.from("products" as any).select("id, name, price, unit").eq("is_active", true).order("name");
      return (data || []) as any[];
    },
  });

  const { data: offers, isLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const { data } = await (supabase.from("product_offers" as any).select("*, products(name, price)") as any).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const resetForm = () => {
    setForm({ title: "", product_id: "", discount_type: "percentage", discount_value: "", is_active: true });
    setEditOffer(null);
    setShowForm(false);
  };

  const openEdit = (offer: any) => {
    setEditOffer(offer);
    setForm({
      title: offer.title,
      product_id: offer.product_id || "",
      discount_type: offer.discount_type,
      discount_value: String(offer.discount_value),
      is_active: offer.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.discount_value) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      product_id: form.product_id || null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      is_active: form.is_active,
    };
    try {
      if (editOffer) {
        const { error } = await (supabase.from("product_offers" as any).update(payload as any) as any).eq("id", editOffer.id);
        if (error) throw error;
        toast({ title: "✅ Offer updated" });
      } else {
        const { error } = await (supabase.from("product_offers" as any).insert(payload as any) as any);
        if (error) throw error;
        toast({ title: "✅ Offer created" });
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    const { error } = await (supabase.from("product_offers" as any).delete() as any).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Offer deleted" });
    queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase.from("product_offers" as any).update({ is_active: !current } as any) as any).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
  };

  // ── Analyser calculation ──
  const analyserProduct = products?.find((p: any) => p.id === analyserProductId);
  const sellingPrice = analyserProduct ? Number(analyserProduct.price) : 0;
  const costPrice = parseFloat(analyserCostPrice) || 0;
  const discountVal = parseFloat(analyserDiscount) || 0;
  const discountedPrice = analyserDiscountType === "percentage"
    ? sellingPrice * (1 - discountVal / 100)
    : sellingPrice - discountVal;
  const profitPerUnit = discountedPrice - costPrice;
  const profitMargin = discountedPrice > 0 ? (profitPerUnit / discountedPrice) * 100 : 0;
  const isProfitable = profitPerUnit >= 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Offers &amp; Discounts</h2>
          <p className="text-sm text-muted-foreground">Create discounts for specific products or all products.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Offer
        </Button>
      </div>

      {/* SQL setup notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm">
        <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> First-time setup required</p>
        <p className="text-amber-600 dark:text-amber-500 mt-1 text-xs">If offers don't save, run this SQL once in your Supabase SQL editor:</p>
        <pre className="mt-2 rounded bg-black/10 p-3 text-xs font-mono overflow-x-auto text-amber-800 dark:text-amber-300 whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS product_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage offers" ON product_offers FOR ALL USING (true);`}</pre>
      </div>

      {/* Offer Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">{editOffer ? "Edit Offer" : "New Offer"}</h3>
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
          </div>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Offer Title *</Label>
              <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Sale 10% Off" />
            </div>
            <div>
              <Label>Apply To</Label>
              <Select value={form.product_id || "all"} onValueChange={v => setForm(f => ({ ...f, product_id: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌿 All Products</SelectItem>
                  {products?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Discount Type</Label>
              <Select value={form.discount_type} onValueChange={(v: any) => setForm(f => ({ ...f, discount_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Discount Value *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  {form.discount_type === "percentage" ? "%" : "₹"}
                </span>
                <Input required type="number" step="0.01" min="0" value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                  className="pl-8" placeholder={form.discount_type === "percentage" ? "10" : "50"} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                Active (visible to customers)
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{saving ? "Saving..." : editOffer ? "Update Offer" : "Create Offer"}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Offers List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (offers as any[])?.length > 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Offer</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(offers as any[]).map((offer: any) => (
                <TableRow key={offer.id} className="hover:bg-muted/30">
                  <TableCell className="font-semibold">{offer.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {offer.products ? offer.products.name : <span className="text-primary font-medium">All Products</span>}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    {offer.discount_type === "percentage" ? `${offer.discount_value}%` : `₹${offer.discount_value}`} OFF
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleActive(offer.id, offer.is_active)}
                      className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase transition-colors ${offer.is_active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {offer.is_active ? "Active" : "Inactive"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(offer)} className="hover:text-amber-600">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive" onClick={() => deleteOffer(offer.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted p-12 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4"><Tag className="h-10 w-10 text-primary opacity-60" /></div>
          <h3 className="mb-2 font-display text-xl font-bold">No offers yet</h3>
          <p className="mb-6 text-muted-foreground text-sm">Create your first discount offer above.</p>
        </div>
      )}

      {/* ── Profit / Loss Analyser ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Profit / Loss Analyser</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">Enter your cost price and a planned discount to see whether the offer is profitable before activating it.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs">Product</Label>
            <Select value={analyserProductId} onValueChange={setAnalyserProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} (₹{p.price})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Your Cost Price (₹)</Label>
            <Input type="number" min="0" step="0.01" value={analyserCostPrice}
              onChange={e => setAnalyserCostPrice(e.target.value)} placeholder="e.g. 80" />
          </div>
          <div>
            <Label className="text-xs">Planned Discount Type</Label>
            <Select value={analyserDiscountType} onValueChange={(v: any) => setAnalyserDiscountType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Discount Value</Label>
            <Input type="number" min="0" step="0.01" value={analyserDiscount}
              onChange={e => setAnalyserDiscount(e.target.value)} placeholder={analyserDiscountType === "percentage" ? "10" : "20"} />
          </div>
        </div>

        {analyserProductId && costPrice > 0 && discountVal > 0 && (
          <div className={`mt-6 rounded-xl p-5 border-2 ${isProfitable ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20" : "border-red-300 bg-red-50 dark:bg-red-950/20"}`}>
            <div className="flex items-center gap-2 mb-4">
              {isProfitable ? (
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <h4 className={`font-bold text-sm ${isProfitable ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                {isProfitable ? "✅ This offer is profitable" : "❌ This offer results in a loss"}
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-black/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Original Price</p>
                <p className="text-xl font-black">₹{sellingPrice.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/60 dark:bg-black/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Discounted Price</p>
                <p className="text-xl font-black text-primary">₹{Math.max(0, discountedPrice).toFixed(2)}</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${isProfitable ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Profit / Unit</p>
                <p className={`text-xl font-black ${isProfitable ? "text-emerald-700" : "text-red-600"}`}>
                  {isProfitable ? "+" : ""}₹{profitPerUnit.toFixed(2)}
                </p>
              </div>
              <div className={`text-center p-3 rounded-lg ${isProfitable ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Margin</p>
                <p className={`text-xl font-black ${isProfitable ? "text-emerald-700" : "text-red-600"}`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
            {!isProfitable && (
              <p className="mt-4 text-xs font-semibold text-red-600 dark:text-red-400 text-center">
                ⚠️ You are selling below your cost price. Reduce the discount or increase the selling price.
              </p>
            )}
          </div>
        )}
        {analyserProductId && costPrice === 0 && (
          <p className="mt-4 text-xs text-muted-foreground text-center">Enter your cost price to see the analysis.</p>
        )}
      </div>
    </div>
  );
};

export default Admin;

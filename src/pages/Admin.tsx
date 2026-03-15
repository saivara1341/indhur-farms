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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Package, ShoppingBag, ShoppingCart, Truck, Plus, Pencil, Trash2, CreditCard, Search, ExternalLink, ListTree, LayoutDashboard, Settings, ChevronRight, ChevronDown, ChevronUp, BarChart3, Users, Shield, ImagePlus, X, UploadCloud, Loader2, AlertTriangle, TrendingUp, Zap, Tag, TrendingDown, DollarSign, ClipboardList, Star, MessageSquare, Check, Ban, Info, History, StickyNote, FileText, CheckCircle, Smartphone, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { seedSampleData } from "@/lib/seedData";
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
    { id: "delivery", label: t('admin.logistics'), icon: Truck },
    { id: "reviews", label: "User Reviews", icon: MessageSquare },
    { id: "records", label: t('admin.records'), icon: ClipboardList },
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
              {activeTab === "delivery" && <DeliveryTab />}
              {activeTab === "reviews" && <ReviewsTab />}
              {activeTab === "records" && <RecordsTab />}
              {activeTab === "settings" && <SettingsTab />}
              {!["dashboard", "products", "categories", "orders", "delivery", "reviews", "records", "settings"].includes(activeTab) && (
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
    variants: (product?.variants as any[]) || [] as any[],
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
      category_id: form.category_id || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      variants: form.variants,
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
                  {["250g", "500g", "1kg", "2kg", "3kg", "4kg", "5kg"].map(u => (
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


            <div><Label>{t('admin.form.slug')}</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="bg-muted/50 font-mono text-xs" /></div>
          </div>
        </div>

        <div className="sm:col-span-2 space-y-4 rounded-xl border border-dashed border-border bg-muted/5 p-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Product Variants (Optional)</Label>
              <p className="text-[10px] text-muted-foreground">Add multiple quantities/weights like 250g, 500g etc.</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const basePrice = Number(form.price);
                  const isPowder = form.name.toLowerCase().includes("powder");
                  const isFingers = form.name.toLowerCase().includes("fingers") || form.name.toLowerCase().includes("కొమ్ములు");
                  
                  let standardWeights;
                  
                  if (isFingers) {
                    standardWeights = [
                      { unit: "250g", price: 80 },
                      { unit: "500g", price: 140 },
                      { unit: "1kg", price: 270 },
                      { unit: "2kg", price: 510 },
                      { unit: "3kg", price: 775 },
                      { unit: "4kg", price: 999 },
                      { unit: "5kg", price: 1250 }
                    ];
                  } else if (isPowder) {
                    standardWeights = [
                      { unit: "250g", price: 100 },
                      { unit: "500g", price: 150 },
                      { unit: "1kg", price: 290 },
                      { unit: "2kg", price: 550 },
                      { unit: "3kg", price: 825 },
                      { unit: "4kg", price: 1095 },
                      { unit: "5kg", price: 1350 }
                    ];
                  } else {
                    standardWeights = [
                      { unit: "250g", price: basePrice },
                      { unit: "500g", price: basePrice * 2 },
                      { unit: "1kg", price: basePrice * 4 },
                      { unit: "2kg", price: basePrice * 8 },
                      { unit: "3kg", price: basePrice * 12 },
                      { unit: "4kg", price: basePrice * 16 },
                      { unit: "5kg", price: basePrice * 20 }
                    ];
                  }

                  setForm(f => ({
                    ...f,
                    variants: [
                      ...f.variants,
                      ...standardWeights.map(w => ({
                        id: crypto.randomUUID(),
                        name: `${f.name} ${w.unit}`,
                        price: w.price,
                        stock: f.stock,
                        unit: w.unit
                      }))
                    ]
                  }));
                }}
                className="h-8 gap-1.5 text-[10px] font-bold border-primary/20 hover:bg-primary/5"
              >
                <Zap className="h-3 w-3 text-primary" /> Quick Weights
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm(f => ({
                  ...f,
                  variants: [...f.variants, { id: crypto.randomUUID(), name: "", price: f.price, stock: f.stock, unit: "" }]
                }))}
                className="h-8 gap-1.5 text-xs font-bold"
              >
                <Plus className="h-3 w-3" /> Add Variant
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {form.variants.map((v, i) => (
              <div key={v.id || i} className="grid grid-cols-12 gap-2 items-end bg-card p-3 rounded-lg border shadow-sm">
                <div className="col-span-3">
                  <Label className="text-[10px]">Unit (e.g. 500g)</Label>
                  <Input
                    required
                    value={v.unit}
                    onChange={e => {
                      const newVariants = [...form.variants];
                      newVariants[i] = { ...v, unit: e.target.value, name: `${form.name} ${e.target.value}`.trim() };
                      setForm(f => ({ ...f, variants: newVariants }));
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-[10px]">Price (₹)</Label>
                  <Input
                    required
                    type="number"
                    value={v.price}
                    onChange={e => {
                      const newVariants = [...form.variants];
                      newVariants[i] = { ...v, price: e.target.value };
                      setForm(f => ({ ...f, variants: newVariants }));
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-[10px]">Stock</Label>
                  <Input
                    type="number"
                    value={v.stock}
                    onChange={e => {
                      const newVariants = [...form.variants];
                      newVariants[i] = { ...v, stock: e.target.value };
                      setForm(f => ({ ...f, variants: newVariants }));
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2 flex justify-end pb-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {form.variants.length === 0 && (
              <p className="text-center py-4 text-xs text-muted-foreground italic">No variants added. Default price/stock will be used.</p>
            )}
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
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders" as any)
        .select("*, order_items(*, products(name, image_url, slug))")
        .order("created_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 30000,
  });

  const toggleOrder = (id: string) => {
    const next = new Set(expandedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedOrders(next);
  };

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
    <div className="space-y-4">
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
      <div className="grid gap-3">
        {filtered?.map((order: any) => {
          const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
          const orderNum = (order as any).order_number || `#${order.id.slice(0, 8)}`;
          const payStatus = (order as any).payment_status || "pending";
          const isExpanded = expandedOrders.has(order.id);

          return (
            <div key={order.id} className="group rounded-xl border border-border bg-card shadow-premium hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Header - Always Visible */}
              <div className={cn("p-1 transition-colors", isExpanded ? style.bg : "bg-card")}>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex flex-1 items-center gap-3 min-w-0" onClick={() => toggleOrder(order.id)} role="button">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-all", style.bg, style.text)}>
                      {order.status === "delivered" ? <CheckCircle className="h-5 w-5" /> : 
                       order.status === "shipped" ? <Truck className="h-5 w-5" /> :
                       <ShoppingBag className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-tight truncate">{orderNum}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border",
                          payStatus === "verified" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          payStatus === "failed" ? "bg-rose-50 text-rose-700 border-rose-100" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {payStatus === "verified" ? "Verified" : payStatus}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        {new Date(order.created_at).toLocaleDateString(i18n.language, { day: "numeric", month: "short", hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Price & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="font-black text-primary leading-none">₹{safeFormat(order.total)}</span>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">{order.order_items?.length} Items</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {order.status === "shipped" && !isExpanded && (
                        <Button 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); updateStatus(order.id, "delivered"); }}
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold gap-1 shadow-lg shadow-emerald-600/20"
                        >
                          🎉 Delivered
                        </Button>
                      )}
                      <button 
                        onClick={() => toggleOrder(order.id)}
                        className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-all hover:bg-muted", isExpanded && "rotate-180 bg-muted")}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible Details */}
              <motion.div 
                initial={false}
                animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden bg-muted/20"
              >
                <div className="p-5 border-t border-border/50">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Customer Info */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                          <Users className="h-3 w-3" /> Customer Details
                        </h4>
                        <div className="p-3 rounded-xl bg-card border shadow-sm space-y-2">
                          <p className="font-bold text-sm">{(order as any).customer_name || t('admin.customer')}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Truck className="h-3 w-3" />
                            <span className="whitespace-pre-wrap">{order.shipping_address}</span>
                          </div>
                          {order.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Smartphone className="h-3 w-3" />
                              <a href={`tel:${order.phone}`} className="hover:text-primary transition-colors">{order.phone}</a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> Transaction
                          </h4>
                          <div className="p-3 rounded-xl bg-card border shadow-sm">
                            <p className="text-[10px] font-mono leading-relaxed truncate">{(order as any).payment_txn_id || 'N/A'}</p>
                            {(order as any).payment_screenshot_url && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 py-2 text-[10px] font-bold text-primary hover:bg-primary/10 transition-colors">
                                    <ExternalLink className="h-3 w-3" /> View Screenshot
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>{t('admin.payment_receipt')} - {orderNum}</DialogTitle>
                                  </DialogHeader>
                                  <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-4">
                                    <img src={(order as any).payment_screenshot_url} alt="Payment" className="max-h-[70vh] w-full rounded-lg object-contain shadow-premium" />
                                    <a href={(order as any).payment_screenshot_url} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-1 text-xs text-primary underline">
                                      <ExternalLink className="h-3 w-3" /> {t('admin.open_full_image')}
                                    </a>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                            <Package className="h-3 w-3" /> Order Items
                          </h4>
                          <div className="p-3 rounded-xl bg-card border shadow-sm space-y-2">
                            {(order.order_items as any[])?.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-2 text-[10px]">
                                <img src={item.products?.image_url || getSmartFallback(item.products?.name, item.products?.slug)} className="h-6 w-6 rounded border object-cover" />
                                <div className="min-w-0">
                                  <p className="font-bold truncate">{item.products?.name}</p>
                                  <p className="text-muted-foreground">{item.variant_name} × {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Management */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                        <Settings className="h-3 w-3" /> Quick Manager
                      </h4>
                      <div className="grid gap-3 p-4 rounded-xl bg-card border shadow-sm">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase">{t('admin.status')}</Label>
                          <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
                            <SelectTrigger className="h-10 text-xs font-bold ring-offset-background focus:ring-2 focus:ring-primary"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">🕐 {t('admin.pipeline.pending')}</SelectItem>
                              <SelectItem value="confirmed">✅ {t('admin.pipeline.confirmed')}</SelectItem>
                              <SelectItem value="shipped">🚚 {t('admin.pipeline.shipped')}</SelectItem>
                              <SelectItem value="delivered">🎉 {t('admin.pipeline.delivered')}</SelectItem>
                              <SelectItem value="cancelled">❌ {t('admin.pipeline.cancelled')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase">{t('admin.payment')}</Label>
                          <Select value={payStatus} onValueChange={v => updatePayment(order.id, v)}>
                            <SelectTrigger className="h-10 text-xs font-bold ring-offset-background focus:ring-2 focus:ring-primary"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">🕐 {t('admin.payment_status.pending')}</SelectItem>
                              <SelectItem value="verified">✅ {t('admin.payment_status.verified')}</SelectItem>
                              <SelectItem value="failed">❌ {t('admin.payment_status.failed')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="pt-2 border-t">
                          {order.status === "pending" && (
                            <Button onClick={() => updateStatus(order.id, "confirmed")} className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs uppercase tracking-tighter shadow-lg shadow-blue-500/20">
                              ✅ {t('admin.confirm_order')}
                            </Button>
                          )}
                          {order.status === "confirmed" && (
                            <Button onClick={() => updateStatus(order.id, "shipped")} className="w-full bg-violet-600 hover:bg-violet-700 font-bold text-xs uppercase tracking-tighter shadow-lg shadow-violet-500/20">
                              🚚 {t('admin.mark_shipped')}
                            </Button>
                          )}
                          {order.status === "shipped" && (
                            <Button onClick={() => updateStatus(order.id, "delivered")} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-tighter shadow-lg shadow-emerald-500/20">
                              🎉 {t('admin.mark_delivered')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {filtered?.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
          <ShoppingBag className="mb-4 h-12 w-12 opacity-10 animate-bounce" />
          <p className="font-bold text-sm">{t('admin.no_orders', { filter: filter === "all" ? "" : t(`admin.pipeline.${filter}`) })}</p>
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
  const { user } = useAuth();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("profile");
  
  const { data: profile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
      return data;
    },
    enabled: !!user?.id
  });

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    avatar_url: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    upi_id: "indhurfarms@upi",
    qr_code_url: "",
    phone_number: "",
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setPaymentForm({
        upi_id: settings.upi_id || "indhurfarms@upi",
        qr_code_url: settings.qr_code_url || "",
        phone_number: (settings as any).phone_number || "",
      });
    }
  }, [settings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: profileForm.full_name,
        avatar_url: profileForm.avatar_url,
      }).eq("id", user?.id);
      if (error) throw error;
      toast({ title: t('admin.settings_config.updated') });
      queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayments = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("site_settings" as any).upsert({
        id: settings?.id || 1,
        upi_id: paymentForm.upi_id,
        qr_code_url: paymentForm.qr_code_url,
        phone_number: paymentForm.phone_number,
      } as any);
      if (error) throw error;
      toast({ title: t('admin.settings_config.updated') });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
    const fileName = `qr-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `settings/${fileName}`;
    try {
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setPaymentForm(prev => ({ ...prev, qr_code_url: publicUrl }));
      toast({ title: t('admin.settings_config.qr_uploaded') });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingQR(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b">
        <button 
          onClick={() => setActiveSubTab("profile")}
          className={cn("px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2", 
            activeSubTab === "profile" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          {t('admin.settings_config.profile_settings')}
        </button>
        <button 
          onClick={() => setActiveSubTab("payments")}
          className={cn("px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2", 
            activeSubTab === "payments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          {t('admin.settings_config.payment_settings')}
        </button>
      </div>

      <div className="max-w-2xl">
        {activeSubTab === "profile" ? (
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl">{t('admin.settings_config.profile_settings')}</CardTitle>
              <CardDescription>Update your public profile information</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('admin.name')}</Label>
                  <Input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Avatar URL</Label>
                  <Input value={profileForm.avatar_url} onChange={e => setProfileForm(f => ({ ...f, avatar_url: e.target.value }))} />
                </div>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t('profile.save_changes')}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl">{t('admin.settings_config.payment_settings')}</CardTitle>
              <CardDescription>Configure payment details and QR codes</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSavePayments} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>UPI ID</Label>
                      <Input value={paymentForm.upi_id} onChange={e => setPaymentForm(f => ({ ...f, upi_id: e.target.value }))} placeholder="indhurfarms@upi" />
                      <p className="text-[10px] text-muted-foreground uppercase">{t('admin.settings_config.upi_hint')}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.settings_config.phone_number')}</Label>
                      <Input value={paymentForm.phone_number} onChange={e => setPaymentForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+91 12345 67890" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment QR Code</Label>
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-4">
                      {paymentForm.qr_code_url ? (
                        <>
                          <img src={paymentForm.qr_code_url} alt="QR Code" className="h-full w-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setPaymentForm(f => ({ ...f, qr_code_url: "" }))}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 text-destructive shadow-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <label className="flex h-full w-full flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors gap-2">
                          {uploadingQR ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <UploadCloud className="h-8 w-8 text-primary" />}
                          <div className="text-center">
                            <p className="text-xs font-bold text-primary uppercase">Upload QR Code</p>
                            <p className="text-[9px] text-muted-foreground uppercase">PNG, JPG up to 5MB</p>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleQRUpload} disabled={uploadingQR} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t('admin.settings_config.save_settings_phone')}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
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
                <TableHead className="hidden sm:table-cell">{t('admin.form.slug')}</TableHead>
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

// Offers removed

const RecordsTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [form, setForm] = useState({ 
    title: "", 
    type: "note", 
    content: "",
    customer_name: "",
    total_amount: "",
    items: "",
    tracking_id: "",
    courier_name: "",
    delivery_status: "pending",
    custom_type: "",
    order_items: [{ productId: "", name: "", price: 0, quantity: 1, custom: false }]
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ["admin-records"],
    queryFn: async () => {
      const { data } = await (supabase.from("admin_records" as any).select("*") as any).order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      // Prepare metadata if it's an order or delivery
      let finalContent = form.content;
      if (form.type === 'order') {
        finalContent = JSON.stringify({
          customer: form.customer_name,
          amount: form.total_amount || form.order_items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
          items: form.order_items,
          notes: form.content
        });
      } else if (form.type === 'delivery') {
        finalContent = JSON.stringify({
          tracking: form.tracking_id,
          courier: form.courier_name,
          status: form.delivery_status,
          notes: form.content
        });
      }

      const submission = {
        title: form.title,
        type: form.type === 'other' ? (form.custom_type || 'other') : form.type,
        content: finalContent
      };

      const { error } = await (supabase.from("admin_records" as any).insert([submission] as any) as any);
      if (error) throw error;
      
      toast({ title: "✅ Record added successfully" });
      setForm({ 
        title: "", type: "note", content: "", 
        customer_name: "", total_amount: "", items: "",
        tracking_id: "", courier_name: "", delivery_status: "pending",
        custom_type: "",
        order_items: [{ productId: "", name: "", price: 0, quantity: 1, custom: false }]
      });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-records"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const { error } = await (supabase.from("admin_records" as any).delete() as any).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Record deleted" });
    queryClient.invalidateQueries({ queryKey: ["admin-records"] });
  };

  const getParsedContent = (record: any) => {
    try {
      if (record.content.startsWith('{')) {
        return JSON.parse(record.content);
      }
    } catch (e) {}
    return null;
  };

  const filteredRecords = records?.filter(r => filterType === 'all' || r.type === filterType)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'delivery': return <Truck className="h-4 w-4 text-green-500" />;
      default: return <StickyNote className="h-4 w-4 text-amber-500" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'delivery': return 'bg-green-50 text-green-600 border-green-200';
      default: return 'bg-amber-50 text-amber-600 border-amber-200';
    }
  };

  const availableTypes = Array.from(new Set(records?.map(r => r.type) || []));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> {t('admin.records_title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('admin.records_desc')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? t('common.cancel') : t('admin.add_record')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-xl border border-dashed border-primary/20">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('admin.filter_by')}:</span>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.all')}</SelectItem>
            <SelectItem value="note">📝 {t('admin.notes')}</SelectItem>
            <SelectItem value="order">📦 {t('admin.manual_order')}</SelectItem>
            <SelectItem value="delivery">🚚 {t('admin.logistics')}</SelectItem>
            {availableTypes.filter(t => !['note', 'order', 'delivery'].includes(t)).map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-display">
                <Plus className="h-5 w-5 text-primary" /> {t('admin.add_record')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">{t('admin.record_title')} *</Label>
                    <Input 
                      required 
                      value={form.title} 
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                      placeholder="e.g. Bulk Order - Indhur Farms"
                      className="bg-muted/30 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">{t('admin.record_type')}</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger className="bg-muted/30 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">📝 {t('admin.notes')}</SelectItem>
                        <SelectItem value="order">📦 {t('admin.manual_order')}</SelectItem>
                        <SelectItem value="delivery">🚚 {t('admin.logistics')}</SelectItem>
                        <SelectItem value="other">➕ {t('admin.delivery.other_custom')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.type === 'other' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                    <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">{t('admin.record_custom_type')}</Label>
                    <Input 
                      required 
                      value={form.custom_type} 
                      onChange={e => setForm(f => ({ ...f, custom_type: e.target.value }))} 
                      placeholder={t('admin.type_placeholder')}
                      className="bg-primary/5 border-primary/20"
                    />
                  </motion.div>
                )}

                {form.type === 'order' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-blue-700">{t('admin.record_customer')}</Label>
                        <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-blue-700">{t('admin.record_amount')} (Manual Overide)</Label>
                        <Input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} className="bg-white" placeholder="Auto-calc if empty" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-blue-700">🛒 {t('admin.record_items')}</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setForm(f => ({ ...f, order_items: [...f.order_items, { productId: "", name: "", price: 0, quantity: 1, custom: false }] }))}
                          className="h-7 text-[10px] uppercase font-bold"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Product
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {form.order_items.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-start bg-white p-2 rounded-lg border shadow-sm">
                            <div className="flex-1 space-y-1">
                              {item.custom ? (
                                <Input 
                                  value={item.name} 
                                  onChange={e => {
                                    const newItems = [...form.order_items];
                                    newItems[idx].name = e.target.value;
                                    setForm(f => ({ ...f, order_items: newItems }));
                                  }}
                                  placeholder="Custom Item Name"
                                  className="h-8 text-xs"
                                />
                              ) : (
                                <Select 
                                  value={item.productId} 
                                  onValueChange={val => {
                                    if (val === 'custom') {
                                      const newItems = [...form.order_items];
                                      newItems[idx].custom = true;
                                      newItems[idx].productId = "";
                                      setForm(f => ({ ...f, order_items: newItems }));
                                      return;
                                    }
                                    const prod = (queryClient.getQueryData(['products']) as any[])?.find(p => p.id === val);
                                    const newItems = [...form.order_items];
                                    newItems[idx].productId = val;
                                    newItems[idx].name = prod?.name || "";
                                    newItems[idx].price = Number(prod?.price || 0);
                                    setForm(f => ({ ...f, order_items: newItems }));
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs bg-muted/20">
                                    <SelectValue placeholder="Select Product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="custom">➕ {t('admin.delivery.other_custom')}</SelectItem>
                                    {((queryClient.getQueryData(['admin-products']) as any[]) || []).map(p => (
                                      <SelectItem key={p.id} value={p.id}>{p.name} (₹{p.price})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                            
                            <div className="w-20">
                              <Input 
                                type="number" 
                                value={item.price} 
                                onChange={e => {
                                  const newItems = [...form.order_items];
                                  newItems[idx].price = Number(e.target.value);
                                  setForm(f => ({ ...f, order_items: newItems }));
                                }}
                                placeholder="Price"
                                className="h-8 text-xs"
                              />
                            </div>
                            
                            <div className="w-16">
                              <Input 
                                type="number" 
                                value={item.quantity} 
                                onChange={e => {
                                  const newItems = [...form.order_items];
                                  newItems[idx].quantity = Number(e.target.value);
                                  setForm(f => ({ ...f, order_items: newItems }));
                                }}
                                placeholder="Qty"
                                className="h-8 text-xs"
                              />
                            </div>
                            
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                const newItems = form.order_items.filter((_, i) => i !== idx);
                                setForm(f => ({ ...f, order_items: newItems.length ? newItems : [{ productId: "", name: "", price: 0, quantity: 1, custom: false }] }));
                              }}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {form.type === 'delivery' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-2 bg-green-50/50 p-4 rounded-xl border border-green-100">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-green-700">{t('admin.record_tracking')}</Label>
                      <Input value={form.tracking_id} onChange={e => setForm(f => ({ ...f, tracking_id: e.target.value }))} className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-green-700">{t('admin.record_courier')}</Label>
                      <Input value={form.courier_name} onChange={e => setForm(f => ({ ...f, courier_name: e.target.value }))} className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-green-700">{t('admin.record_delivery_status')}</Label>
                      <Select value={form.delivery_status} onValueChange={v => setForm(f => ({ ...f, delivery_status: v }))}>
                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t('admin.pipeline.pending')}</SelectItem>
                          <SelectItem value="shipped">{t('admin.pipeline.shipped')}</SelectItem>
                          <SelectItem value="delivered">{t('admin.pipeline.delivered')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    {form.type === 'note' ? t('admin.record_content') : t('admin.delivery.notes')}
                  </Label>
                  <Textarea 
                    rows={form.type === 'note' ? 5 : 3} 
                    value={form.content} 
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))} 
                    placeholder="Enter additional details here..."
                    className="bg-muted/30 focus-visible:ring-primary resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={saving} className="min-w-[120px] shadow-lg shadow-primary/20">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {saving ? t('admin.saving') : t('admin.add_record')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading Ledger...</p>
        </div>
      ) : filteredRecords?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <StickyNote className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">{t('admin.records_empty')}</p>
          <Button variant="link" onClick={() => setShowForm(true)} className="mt-2">{t('admin.add_record')}</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRecords?.map((record: any) => {
            const data = getParsedContent(record);
            return (
              <motion.div 
                key={record.id} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full border-muted-foreground/10 hover:border-primary/30 transition-all hover:shadow-lg group overflow-hidden">
                  <div className={cn("h-1 w-full", 
                    record.type === 'order' ? 'bg-blue-500' : 
                    record.type === 'delivery' ? 'bg-green-500' : 'bg-amber-500'
                  )} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", getBadgeColor(record.type))}>
                            {getIcon(record.type)}
                            {['note', 'order', 'delivery'].includes(record.type) ? 
                              t(`admin.${record.type === 'note' ? 'notes' : record.type === 'order' ? 'manual_order' : 'logistics'}`) : 
                              record.type
                            }
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                            <History className="h-3 w-3" />
                            {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <CardTitle className="text-lg leading-tight truncate group-hover:text-primary transition-colors">{record.title}</CardTitle>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteRecord(record.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data ? (
                      <div className="space-y-3">
                        {record.type === 'order' && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                              <p className="text-blue-700 font-bold uppercase text-[9px] mb-1">{t('admin.record_customer')}</p>
                              <p className="font-medium truncate">{data.customer || 'N/A'}</p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                              <p className="text-blue-700 font-bold uppercase text-[9px] mb-1">{t('admin.record_amount')}</p>
                              <p className="font-bold text-blue-800">₹{data.amount || '0'}</p>
                            </div>
                            {data.items && Array.isArray(data.items) && (
                              <div className="col-span-2 bg-muted/30 p-2 rounded-lg border divide-y divide-border/50">
                                <p className="text-muted-foreground font-bold uppercase text-[9px] mb-1">{t('admin.record_items')}</p>
                                {data.items.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between py-1 first:pt-0">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-muted-foreground">x{item.quantity} (₹{item.price})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {data.items && typeof data.items === 'string' && (
                              <div className="col-span-2 bg-muted/30 p-2 rounded-lg border">
                                <p className="text-muted-foreground font-bold uppercase text-[9px] mb-1">{t('admin.record_items')}</p>
                                <p className="line-clamp-2 italic">{data.items}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {record.type === 'delivery' && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                              <p className="text-green-700 font-bold uppercase text-[9px] mb-1">{t('admin.record_tracking')}</p>
                              <p className="font-mono truncate">{data.tracking || 'N/A'}</p>
                            </div>
                            <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                              <p className="text-green-700 font-bold uppercase text-[9px] mb-1">{t('admin.record_courier')}</p>
                              <p className="font-medium truncate">{data.courier || 'N/A'}</p>
                            </div>
                            <div className="col-span-2 flex items-center justify-between bg-white p-2 rounded-lg border shadow-sm">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('admin.record_delivery_status')}</span>
                              <Badge variant="outline" className="text-[10px] h-5 bg-green-500 text-white border-none">
                                {data.status}
                              </Badge>
                            </div>
                          </div>
                        )}
                        {data.notes && (
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/10 p-4 rounded-xl border border-muted-foreground/5 italic leading-relaxed">
                            {data.notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6 bg-muted/20 p-4 rounded-xl border border-muted-foreground/5 italic leading-relaxed">
                        {record.content}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Reviews Tab ───
const ReviewsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    user_name: "",
    rating: "5",
    comment: "",
    source: "web" as "web" | "instagram" | "whatsapp",
    is_approved: true
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_name || !form.comment) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("reviews").insert([
        { ...form, rating: parseInt(form.rating) }
      ]);
      if (error) throw error;
      toast({ title: "✅ Review added successfully" });
      setForm({ user_name: "", rating: "5", comment: "", source: "web", is_approved: true });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Review deleted" });
    queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  const toggleApproval = async (id: string, current: boolean) => {
    await supabase.from("reviews").update({ is_approved: !current }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">User Reviews</h2>
          <p className="text-sm text-muted-foreground">Manage customer feedback and add manual reviews from social media.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Manual Review
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Add Manual Review</CardTitle>
            <CardDescription>Enter reviews manually from Instagram, WhatsApp, or other sources.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input required value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={(v: any) => setForm(f => ({ ...f, source: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">🌐 Website</SelectItem>
                      <SelectItem value="instagram">📸 Instagram</SelectItem>
                      <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rating (1-5)</Label>
                  <Select value={form.rating} onValueChange={v => setForm(f => ({ ...f, rating: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} Stars</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.is_approved} onChange={e => setForm(f => ({ ...f, is_approved: e.target.checked }))} className="rounded" />
                    Approve immediately
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Review Content *</Label>
                <Textarea required rows={3} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="Paste the review content here..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Review"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : reviews && reviews.length > 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r: any) => (
                <TableRow key={r.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-bold">{r.user_name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{new Date(r.created_at).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter ${
                      r.source === 'instagram' ? 'bg-pink-100 text-pink-700' :
                      r.source === 'whatsapp' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {r.source}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-primary text-primary" : "text-muted"}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs line-clamp-2 italic text-muted-foreground">"{r.comment}"</p>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleApproval(r.id, r.is_approved)}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase transition-all ${
                        r.is_approved ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}
                    >
                      {r.is_approved ? <Check className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                      {r.is_approved ? "Approved" : "Pending"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive" onClick={() => deleteReview(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-muted p-12 text-center bg-muted/5">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-xl font-bold">No reviews found</h3>
          <p className="text-muted-foreground text-sm mt-2">Start by adding a manual review or wait for customers to leave feedback.</p>
        </div>
      )}
    </div>
  );
};

export default Admin;

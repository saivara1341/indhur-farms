import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Package, LogOut, Mail, FileText, Printer, Loader2, 
  User, Phone, MapPin, Plus, Trash2, Camera, ChevronRight,
  ShoppingBag, Pencil, X, CheckCircle2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Invoice from "@/components/Invoice";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, saveProfile } = useProfile();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddressIdx, setEditingAddressIdx] = useState<number | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    addresses: [] as any[]
  });

  const [addressForm, setAddressForm] = useState({
    label: "Home",
    street: "",
    city: "",
    state: "",
    zip: ""
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        addresses: profile.addresses || []
      });
    }
  }, [profile]);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const handleUpdateProfile = async () => {
    const success = await saveProfile({
      ...profile!,
      full_name: form.full_name,
      phone: form.phone,
      addresses: form.addresses
    });

    if (success) {
      toast({ title: t('profile.saved_success', "Profile updated successfully!") });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } else {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const path = `avatars/${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      
      const success = await saveProfile({
        ...profile!,
        avatar_url: data.publicUrl
      });

      if (success) {
        toast({ title: "Profile picture updated!" });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleAddOrUpdateAddress = () => {
    const newAddresses = [...form.addresses];
    if (editingAddressIdx !== null) {
      newAddresses[editingAddressIdx] = addressForm;
    } else {
      newAddresses.push(addressForm);
    }

    setForm(f => ({ ...f, addresses: newAddresses }));
    setShowAddressDialog(false);
    setAddressForm({ label: "Home", street: "", city: "", state: "", zip: "" });
    setEditingAddressIdx(null);
  };

  const removeAddress = (idx: number) => {
    const newAddresses = form.addresses.filter((_, i) => i !== idx);
    setForm(f => ({ ...f, addresses: newAddresses }));
  };

  if (authLoading || profileLoading || !user) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('profile.loading')}</p>
    </div>
  );

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-primary/10 shadow-xl bg-primary/5 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-primary">{avatarLetter}</span>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all border-4 border-card disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
              </div>

              <div className="w-full pt-4 border-t border-border mt-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => { signOut(); navigate("/"); }}
                >
                  <LogOut className="h-4 w-4" /> {t('profile.sign_out')}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-2 shadow-card">
            <nav className="flex flex-col">
              <button 
                onClick={() => setActiveTab("personal")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                  activeTab === "personal" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <User className="h-4 w-4" /> Personal Details
              </button>
              <button 
                onClick={() => setActiveTab("addresses")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                  activeTab === "addresses" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <MapPin className="h-4 w-4" /> Saved Addresses
              </button>
              <button 
                onClick={() => setActiveTab("orders")}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                  activeTab === "orders" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <ShoppingBag className="h-4 w-4" /> Order History
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-border bg-card p-1 shadow-card min-h-[500px]">
            {activeTab === 'personal' && (
              <div className="p-6 space-y-8">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Personal Information</h3>
                    <p className="text-sm text-muted-foreground">Manage your display name and contact details</p>
                  </div>
                  <Button 
                    variant={isEditing ? "outline" : "primary" as any} 
                    size="sm" 
                    onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                    className="gap-2"
                  >
                    {isEditing ? <CheckCircle2 className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </Button>
                </div>

                <div className="grid gap-6 max-w-xl">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <div className="relative group">
                       <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                       <Input 
                        disabled={!isEditing}
                        value={form.full_name} 
                        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                        className="pl-10 h-11 bg-muted/30 focus:bg-white transition-all rounded-xl"
                        placeholder="Your full name"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                    <div className="relative group">
                       <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input 
                        disabled
                        value={user.email} 
                        className="pl-10 h-11 bg-muted/10 opacity-70 cursor-not-allowed rounded-xl"
                       />
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1 italic">* Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                    <div className="relative group">
                       <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                       <Input 
                        disabled={!isEditing}
                        value={form.phone} 
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="pl-10 h-11 bg-muted/30 focus:bg-white transition-all rounded-xl"
                        placeholder="Mobile number with country code"
                       />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Shipping Addresses</h3>
                    <p className="text-sm text-muted-foreground">Your saved locations for faster checkout</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingAddressIdx(null);
                      setAddressForm({ label: "Home", street: "", city: "", state: "", zip: "" });
                      setShowAddressDialog(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Address
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {form.addresses.length > 0 ? (
                    form.addresses.map((addr, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-border bg-muted/10 hover:border-primary/50 transition-all flex flex-col justify-between group">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-primary/10 text-primary rounded-full">
                              {addr.label}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingAddressIdx(idx);
                                  setAddressForm(addr);
                                  setShowAddressDialog(true);
                                }}
                                className="h-7 w-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => removeAddress(idx)}
                                className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-medium leading-relaxed">
                            {addr.street}<br />
                            {addr.city}, {addr.state} - {addr.zip}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-12 text-center space-y-4">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                        <MapPin className="h-8 w-8" />
                      </div>
                      <p className="text-sm text-muted-foreground">You haven't saved any addresses yet.</p>
                    </div>
                  )}
                </div>

                {/* Save all changes button for address removals */}
                {profile?.addresses?.length !== form.addresses.length && (
                  <div className="pt-6 animate-in slide-in-from-bottom-2">
                    <Button onClick={handleUpdateProfile} className="w-full sm:w-auto">Save Address Changes</Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">My Orders</h3>
                    <p className="text-sm text-muted-foreground">Track and manage your past purchases</p>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-lg font-bold">₹{Number(order.total)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase py-0.5 px-3 rounded-full border",
                              order.status === 'delivered' ? "bg-green-50 text-green-700 border-green-200" :
                              order.status === 'cancelled' ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {order.status}
                            </span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><FileText className="h-4 w-4 text-muted-foreground" /></Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
                                <Invoice order={order} profile={profile} />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                          {(order.order_items as any[])?.map((item: any) => (
                            <div key={item.id} className="flex-shrink-0 flex items-center gap-2 bg-muted/40 p-2 rounded-lg border border-border/50 max-w-[180px]">
                              <img src={item.products?.image_url || "/placeholder.svg"} className="h-8 w-8 rounded object-cover shadow-sm" />
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium truncate">{item.products?.name}</p>
                                <p className="text-[8px] text-muted-foreground">{item.quantity} units</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <p className="text-sm text-muted-foreground">No orders found.</p>
                    <Button variant="outline" asChild><Link to="/products">Start Shopping</Link></Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingAddressIdx !== null ? "Edit Address" : "Add New Address"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Label (e.g. Home, Office)</Label>
              <Input value={addressForm.label} onChange={e => setAddressForm(a => ({ ...a, label: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input value={addressForm.street} onChange={e => setAddressForm(a => ({ ...a, street: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={addressForm.city} onChange={e => setAddressForm(a => ({ ...a, city: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={addressForm.state} onChange={e => setAddressForm(a => ({ ...a, state: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ZIP / Postcode</Label>
              <Input value={addressForm.zip} onChange={e => setAddressForm(a => ({ ...a, zip: e.target.value }))} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressDialog(false)}>Cancel</Button>
            <Button onClick={handleAddOrUpdateAddress} className="rounded-xl px-8">Save Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Profile;
file;
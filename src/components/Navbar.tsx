import { Link } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Shield, Instagram, LogOut, Phone, Mail, Plus, Trash2, Camera, Check, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useAdmin } from "@/hooks/useAdmin";
import { useProfile } from "@/hooks/useProfile";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ── Editable list of handles ─────────────────────────────────
const HandleList = ({
  icon: Icon,
  iconClass,
  placeholder,
  items,
  onChange,
}: {
  icon: React.ElementType;
  iconClass: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) => {
  const { t } = useTranslation();
  const add = () => onChange([...items, ""]);
  const update = (i: number, v: string) => { const n = [...items]; n[i] = v; onChange(n); };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-1.5">
      {items.map((val, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white text-xs ${iconClass}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <Input value={val} onChange={e => update(i, e.target.value)} placeholder={placeholder} className="h-7 text-xs" />
          <button onClick={() => remove(i)} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
        <Plus className="h-3 w-3" /> {t('common.add')}
      </button>
    </div>
  );
};

// ── Navbar ───────────────────────────────────────────────────
const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const { isAdmin } = useAdmin();
  const { settings } = useSettings();
  const { profile, saving, saveProfile } = useProfile();
  const { toast } = useToast();

  const [draft, setDraft] = useState({
    avatar_url: "",
    instagram_handles: [] as string[],
    whatsapp_numbers: [] as string[],
    gmail_addresses: [] as string[],
  });

  useEffect(() => {
    if (profile && editMode) {
      setDraft({
        avatar_url: profile.avatar_url || "",
        instagram_handles: [...(profile.instagram_handles || [])],
        whatsapp_numbers: [...(profile.whatsapp_numbers || [])],
        gmail_addresses: [...(profile.gmail_addresses || [])],
      });
    }
  }, [profile, editMode]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setEditMode(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const avatarSrc = (editMode ? draft.avatar_url : profile?.avatar_url) || user?.user_metadata?.avatar_url || "";

  // ── Upload profile photo to Supabase storage ──────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `profiles/${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setDraft(d => ({ ...d, avatar_url: data.publicUrl }));
      toast({ title: "Photo uploaded!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    const ok = await saveProfile({ ...profile, ...draft });
    if (ok) {
      toast({ title: "Profile saved!" });
      setEditMode(false);
    } else {
      toast({
        title: "Save failed",
        description: "Run the user_profiles SQL in Supabase first (see last message).",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-primary/10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <img src={logo} alt={settings?.shop_name || "Indhur Farms"} className="h-10 w-10 rounded-full object-cover shadow-premium group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse -z-10 blur-sm scale-110" />
          </div>
          <span className="font-display text-xl font-black tracking-tight text-primary transition-colors group-hover:text-primary/80">
            {settings?.shop_name || "Indhur Farms"}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {[
            { to: "/", label: t('nav.home') },
            { to: "/products", label: t('nav.shop') },
            { to: "/about", label: t('nav.about') },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="relative text-sm font-bold text-foreground/70 transition-all hover:text-primary group py-2"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full rounded-full shadow-[0_0_8px_rgba(49,134,22,0.6)]" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {/* Cart */}
          <Link to="/cart" className="relative group">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-colors">
              <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-black text-secondary-foreground shadow-lift animate-bounce">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 border-dashed">
                    <Shield className="mr-1.5 h-4 w-4" /> {t('nav.manage_store')}
                  </Button>
                </Link>
              )}

              {/* Profile avatar */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => { setProfileOpen(v => !v); setEditMode(false); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary/40 transition-all focus:outline-none"
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {avatarLetter}
                    </div>
                  )}
                </button>

                {/* ── DROPDOWN ── */}
                {profileOpen && (
                  <div className="absolute right-0 top-11 w-80 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-primary/10 via-amber-50/60 to-transparent px-5 pt-5 pb-4 border-b border-border">
                      <button
                        onClick={() => setEditMode(v => !v)}
                        className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        {editMode ? t('common.cancel') : t('common.edit')}
                      </button>

                      <div className="flex items-center gap-3">
                        {/* Avatar with upload button */}
                        <div className="relative">
                          {avatarSrc ? (
                            <img src={avatarSrc} alt="Profile" className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20 shadow" />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white text-xl font-bold shadow">
                              {avatarLetter}
                            </div>
                          )}
                          {editMode && (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow hover:bg-primary/80 disabled:opacity-60"
                              title={t('profile.upload_photo')}
                            >
                              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                            </button>
                          )}
                          {/* Hidden file input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Social handles */}
                    <div className="px-4 py-3 space-y-3 border-b border-border max-h-60 overflow-y-auto">

                      {editMode ? (
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1 font-medium">{t('profile.instagram')}</p>
                            <HandleList icon={Instagram} iconClass="bg-gradient-to-br from-purple-500 to-pink-500" placeholder={t('profile.instagram_placeholder')} items={draft.instagram_handles} onChange={v => setDraft(d => ({ ...d, instagram_handles: v }))} />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1 font-medium">{t('profile.whatsapp')}</p>
                            <HandleList icon={Phone} iconClass="bg-[#25D366]" placeholder={t('profile.whatsapp_placeholder')} items={draft.whatsapp_numbers} onChange={v => setDraft(d => ({ ...d, whatsapp_numbers: v }))} />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1 font-medium">{t('profile.gmail')}</p>
                            <HandleList icon={Mail} iconClass="bg-red-500" placeholder={t('profile.gmail_placeholder')} items={draft.gmail_addresses} onChange={v => setDraft(d => ({ ...d, gmail_addresses: v }))} />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {profile?.instagram_handles?.filter(Boolean).map((h, i) => (
                            <a key={i} href={`https://instagram.com/${h.replace("@", "")}`} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-pink-50 hover:text-pink-600 transition-colors group">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white group-hover:scale-105 transition-transform">
                                <Instagram className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium truncate">{h.startsWith("@") ? h : `@${h}`}</span>
                            </a>
                          ))}
                          {profile?.whatsapp_numbers?.filter(Boolean).map((n, i) => (
                            <a key={i} href={`https://wa.me/${n.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-green-50 hover:text-green-600 transition-colors group">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366] text-white group-hover:scale-105 transition-transform">
                                <Phone className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium truncate">{n}</span>
                            </a>
                          ))}
                          {profile?.gmail_addresses?.filter(Boolean).map((g, i) => (
                            <a key={i} href={`mailto:${g}`}
                              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600 transition-colors group">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white group-hover:scale-105 transition-transform">
                                <Mail className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium truncate">{g}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2 px-4 py-3">
                      {editMode ? (
                        <Button size="sm" className="flex-1 gap-1.5" onClick={handleSave} disabled={saving || uploading}>
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          {saving ? t('profile.saving') : t('profile.save_changes')}
                        </Button>
                      ) : (
                        <button
                          onClick={() => { signOut(); setProfileOpen(false); }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> {t('profile.sign_out')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/auth" className="hidden md:block">
              <Button variant="default" size="sm">
                <User className="mr-1 h-4 w-4" /> {t('nav.login')}
              </Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link to="/" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>{t('nav.home')}</Link>
            <Link to="/products" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>{t('nav.shop')}</Link>
            <Link to="/about" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>{t('nav.about')}</Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-bold text-primary" onClick={() => setMobileOpen(false)}>
                    <Shield className="h-4 w-4" /> {t('nav.manage_store')}
                  </Link>
                )}
                <div className="rounded-xl border border-border p-3 space-y-1">
                  <p className="text-xs font-bold">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {profile?.instagram_handles?.filter(Boolean).map((h, i) => (
                    <a key={i} href={`https://instagram.com/${h.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-pink-500 font-medium">
                      <Instagram className="h-4 w-4" /> {h.startsWith("@") ? h : `@${h}`}
                    </a>
                  ))}
                  {profile?.whatsapp_numbers?.filter(Boolean).map((n, i) => (
                    <a key={i} href={`https://wa.me/${n.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-green-500 font-medium">
                      <Phone className="h-4 w-4" /> {n}
                    </a>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => { signOut(); setMobileOpen(false); }}>
                  <LogOut className="mr-1.5 h-4 w-4" /> {t('profile.sign_out')}
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button variant="default" size="sm" className="w-full">{t('nav.login')}</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

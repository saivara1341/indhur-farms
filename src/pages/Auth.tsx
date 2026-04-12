import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from "@react-oauth/google";

const Auth = () => {
  const [authMode, setAuthMode] = useState<"login" | "signup" | "reset" | "update">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Handle password recovery redirection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("update");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !adminLoading && authMode !== "update") {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/products");
      }
    }
  }, [user, isAdmin, adminLoading, navigate, authMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: t('auth.welcome_back') + "!" });
      } else if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin + import.meta.env.BASE_URL + "auth",
          },
        });
        if (error) throw error;
        toast({ title: t('auth.signup_btn') + "!", description: t('auth.verify_email') });
      } else if (authMode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + import.meta.env.BASE_URL + "auth",
        });
        if (error) throw error;
        toast({ title: t('auth.reset_link_sent') });
        setAuthMode("login");
      } else if (authMode === "update") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast({ title: t('auth.password_updated') });
        setAuthMode("login");
        navigate("/auth");
      }
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credentialResponse.credential,
      });
      if (error) throw error;
      toast({ title: t('auth.welcome_back') + "!" });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-soft">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            {authMode === "login" ? t('auth.welcome_back') :
              authMode === "signup" ? t('auth.join') :
                authMode === "reset" ? t('auth.reset_password') : t('auth.update_password')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {authMode === "login" ? t('auth.login_desc') :
              authMode === "signup" ? t('auth.signup_desc') :
                authMode === "reset" ? t('auth.send_reset_link') : t('auth.new_password')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === "signup" && (
            <div><Label htmlFor="name">{t('auth.full_name')}</Label><Input id="name" required value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          )}
          {authMode !== "update" && (
            <div><Label htmlFor="email">{t('auth.email')}</Label><Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          )}

          {authMode !== "reset" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{authMode === "update" ? t('auth.new_password') : t('auth.password')}</Label>
                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("reset")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {t('auth.forgot_password')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('auth.loading')}
              </span>
            ) : (
              (authMode === "login" || authMode === "signup") ? t('auth.submit_btn') :
                authMode === "reset" ? t('auth.send_reset_link') : t('auth.update_password')
            )}
          </Button>
        </form>

        {(authMode === "login" || authMode === "signup") && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('auth.or_continue_with')}</span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast({
                    title: t('common.error'),
                    description: "Google Login Failed",
                    variant: "destructive",
                  });
                }}
                useOneTap
                theme="outline"
                size="large"
                width="100%"
                shape="pill"
              />
            </div>
          </>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {authMode === "login" ? (
            <>
              {t('auth.no_account')}{" "}
              <button onClick={() => setAuthMode("signup")} className="font-semibold text-primary hover:underline" type="button">
                {t('auth.signup_link')}
              </button>
            </>
          ) : authMode === "signup" ? (
            <>
              {t('auth.have_account')}{" "}
              <button onClick={() => setAuthMode("login")} className="font-semibold text-primary hover:underline" type="button">
                {t('auth.login_link')}
              </button>
            </>
          ) : (
            <button onClick={() => setAuthMode("login")} className="font-semibold text-primary hover:underline" type="button">
              {t('auth.back_to_login')}
            </button>
          )}
        </p>


      </div>
    </main>
  );
};

export default Auth;
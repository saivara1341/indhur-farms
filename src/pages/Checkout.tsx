import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  ShoppingBag, CreditCard, Truck, CheckCircle,
  Smartphone, ArrowRight, Loader2, Copy, QrCode, Info, X, UploadCloud, ArrowLeft
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

// ── Delivery charge table ─────────────────────────────────────
// Weight thresholds in grams
const DELIVERY_TIERS: { maxGrams: number; hyd: number; apTs: number }[] = [
  { maxGrams: 500, hyd: 80, apTs: 120 },
  { maxGrams: 1000, hyd: 100, apTs: 120 },
  { maxGrams: 2000, hyd: 160, apTs: 200 },
  { maxGrams: 3000, hyd: 200, apTs: 220 },
  { maxGrams: 4000, hyd: 230, apTs: 250 },
  { maxGrams: 5000, hyd: 250, apTs: 270 },
];

const DELIVERY_TABLE = [
  { label: "250g / 500g", hyd: 80, apTs: 120 },
  { label: "1 kg", hyd: 100, apTs: 120 },
  { label: "2 kg", hyd: 160, apTs: 200 },
  { label: "3 kg", hyd: 200, apTs: 220 },
  { label: "4 kg", hyd: 230, apTs: 250 },
  { label: "5 kg", hyd: 250, apTs: 270 },
];

// Parse a unit string like "250g", "1kg", "2 kg", "500 grams" → grams
const parseUnitToGrams = (unit: string | null): number => {
  if (!unit) return 1000; // default 1kg if unknown
  const lower = unit.toLowerCase().replace(/\s+/g, "");
  const kgMatch = lower.match(/^([0-9.]+)kg/);
  const gMatch = lower.match(/^([0-9.]+)g/);
  if (kgMatch) return parseFloat(kgMatch[1]) * 1000;
  if (gMatch) return parseFloat(gMatch[1]);
  return 1000;
};

const getDeliveryCharge = (totalGrams: number, region: string): number => {
  if (!region) return 0;
  for (const tier of DELIVERY_TIERS) {
    if (totalGrams <= tier.maxGrams) {
      return region === "hyderabad" ? tier.hyd : tier.apTs;
    }
  }
  // If more than 5kg, use the last tier's charge
  const last = DELIVERY_TIERS[DELIVERY_TIERS.length - 1];
  return region === "hyderabad" ? last.hyd : last.apTs;
};

const Checkout = () => {
  const { t } = useTranslation();
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "pay">("details");
  const [loading, setLoading] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [form, setForm] = useState({ name: "", address: "", notes: "", region: "" });
  const [paymentMode, setPaymentMode] = useState<"app" | "qr" | "id">("app");
  const [txnId, setTxnId] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  // Calculate total weight from cart items
  const totalGrams = items.reduce((acc, item) => {
    return acc + parseUnitToGrams(item.product.unit) * item.quantity;
  }, 0);

  const deliveryCharge = getDeliveryCharge(totalGrams, form.region);
  const total = cartTotal + deliveryCharge;

  const upiId = "6303602743@upi";
  const merchantName = "Sarugu Sai Vara Prasad";
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR`;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !phoneNumber || !form.address) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    // Phone validation: Indian numbers must be 10 digits starting 6–9
    const isIndian = phonePrefix === "+91";
    if (isIndian) {
      const stripped = phoneNumber.replace(/\s+/g, "");
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(stripped)) {
        toast({
          title: "Invalid Mobile Number",
          description: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.",
          variant: "destructive"
        });
        return;
      }
    } else {
      // For international: just ensure at least 6 digits
      if (phoneNumber.replace(/\D/g, "").length < 6) {
        toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number.", variant: "destructive" });
        return;
      }
    }

    setStep("pay");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmOrder = async () => {
    if (!user || items.length === 0) return;
    if (!txnId) {
      toast({ title: "Transaction ID Required", description: "Please enter the UPI transaction ID after payment.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const fullPhone = `${phonePrefix} ${phoneNumber}`;
    try {
      const { data: order, error: orderError } = await (supabase
        .from("orders") as any)
        .insert({
          user_id: user.id,
          total,
          shipping_address: `${form.name}\n${form.address}`,
          phone: fullPhone,
          notes: form.notes,
          status: "pending",
          payment_txn_id: txnId,
          payment_screenshot_url: screenshotUrl || null,
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: Number(item.product.price),
      }));

      const { error: itemsError } = await (supabase.from("order_items") as any).insert(orderItems);
      if (itemsError) throw itemsError;

      await clearCart();
      toast({ title: "✅ Order placed!", description: "Order received. It will be confirmed after payment verification." });
      navigate("/order-success");
    } catch (err: any) {
      console.error("Order creation error:", err);
      toast({ title: t("checkout.order_failed"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    toast({ title: "UPI ID Copied", description: "You can now paste it in your payment app." });
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Screenshot must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploadingScreenshot(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `receipt-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `payments/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setScreenshotUrl(publicUrl);
      toast({ title: "✅ Screenshot Uploaded", description: "Payment receipt attached to order." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingScreenshot(false);
    }
  };

  if (!user) { navigate("/auth"); return null; }
  if (items.length === 0) { navigate("/cart"); return null; }

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Step Indicator */}
      <div className="mb-6 flex items-center gap-3">
        {[
          { key: "details", label: "1. Delivery" },
          { key: "pay", label: "2. Payment" },
        ].map((s, i, arr) => (
          <div key={s.key} className="flex items-center gap-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${step === s.key
              ? "bg-primary text-primary-foreground"
              : step === "pay" && i === 0
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
              }`}>
              {step === "pay" && i === 0
                ? <CheckCircle className="h-4 w-4" />
                : i + 1
              }
            </span>
            <span className={`text-sm font-medium ${step === s.key ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Back navigation bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => step === "pay" ? setStep("details") : navigate("/cart")}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-primary/5"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === "pay" ? t("checkout.change_delivery_details") : t("checkout.back_to_cart")}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">

        {/* ── STEP 1: Delivery Details ── */}
        {step === "details" && (
          <form onSubmit={handleProceedToPayment} className="space-y-5 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-semibold">{t("checkout.delivery_details")}</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">{t("checkout.full_name")} *</Label>
                  <Input id="name" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name" />
                </div>

                {/* Phone with country prefix */}
                <div>
                  <Label htmlFor="phone">{t("checkout.phone")} *</Label>
                  <div className="flex gap-2">
                    {/* Editable prefix */}
                    <Input
                      value={phonePrefix}
                      onChange={e => setPhonePrefix(e.target.value)}
                      className="w-20 font-mono text-sm text-center shrink-0"
                      title="Country code (e.g. +91 for India)"
                      maxLength={6}
                    />
                    <Input
                      id="phone"
                      required
                      type="tel"
                      value={phoneNumber}
                      onChange={e => {
                        // If user pastes full number with 91, strip it
                        let v = e.target.value.replace(/\D/g, "");
                        if (phonePrefix === "+91" && v.startsWith("91") && v.length > 10) {
                          v = v.slice(2);
                        }
                        setPhoneNumber(v);
                      }}
                      placeholder={phonePrefix === "+91" ? "10-digit mobile number" : "Phone number"}
                      maxLength={phonePrefix === "+91" ? 10 : 15}
                      className="flex-1"
                    />
                  </div>
                  {phonePrefix === "+91" && (
                    <p className="mt-1 text-xs text-muted-foreground">Enter 10-digit number (starts with 6–9)</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="address">{t("checkout.address")} *</Label>
                  <Textarea id="address" required rows={3} value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="House No., Street, City, State, PIN" />
                </div>
                <div>
                  <Label htmlFor="region">Delivery Region *</Label>
                  <select
                    id="region"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={form.region}
                    onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  >
                    <option value="">Select Region</option>
                    <option value="hyderabad">Hyderabad</option>
                    <option value="ap-ts">Andhra Pradesh &amp; Telangana</option>
                  </select>

                  {/* Delivery charge info table */}
                  {form.region && (
                    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs font-bold text-primary mb-2">Delivery Charges — {form.region === "hyderabad" ? "Hyderabad" : "AP / TS"}</p>
                      <div className="space-y-1">
                        {DELIVERY_TABLE.map(row => (
                          <div key={row.label} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{row.label}</span>
                            <span className="font-semibold">₹{form.region === "hyderabad" ? row.hyd : row.apTs}</span>
                          </div>
                        ))}
                      </div>
                      {deliveryCharge > 0 && (
                        <div className="mt-2 pt-2 border-t border-primary/20 flex justify-between text-xs font-bold text-primary">
                          <span>Your delivery charge</span>
                          <span>₹{deliveryCharge}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">{t("checkout.notes")}</Label>
                <Textarea id="notes" rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special delivery instructions?" />
              </div>
            </div>
            <Button variant="hero" size="lg" className="w-full" type="submit">
              Proceed to Payment — ₹{total} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        )}

        {/* ── STEP 2: UPI Payment ── */}
        {step === "pay" && (
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold">Choose Payment Method</h3>
                <p className="text-muted-foreground text-sm">Pay <strong>₹{total}</strong> to complete your order</p>
              </div>

              {/* Toggle Options */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
                {[
                  { id: "app", label: "App Link", icon: Smartphone },
                  { id: "qr", label: "Scan QR", icon: QrCode },
                  { id: "id", label: "UPI ID", icon: Copy },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setPaymentMode(mode.id as any)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-md transition-all ${paymentMode === mode.id
                      ? "bg-background shadow-sm text-primary"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <mode.icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{mode.label}</span>
                  </button>
                ))}
              </div>

              <div className="min-h-[220px] flex flex-col items-center justify-center">
                {paymentMode === "app" && (
                  <div className="text-center space-y-6 w-full max-w-sm">
                    <p className="text-sm text-muted-foreground">Tap to pay with your favorite UPI app</p>
                    <div className="grid gap-3">
                      <a href={upiLink} className="block">
                        <Button variant="hero" size="lg" className="w-full py-6 text-base shadow-lg shadow-primary/10 hover:scale-[1.01] active:scale-[0.99] transition-transform flex items-center justify-center gap-3">
                          <Smartphone className="h-5 w-5" /> Open UPI App
                        </Button>
                      </a>
                      <div className="flex gap-3">
                        <a href={`phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR`} className="flex-1">
                          <Button variant="outline" className="w-full py-6 border-2 border-purple-100 hover:border-purple-200 hover:bg-purple-50 text-purple-700 font-bold transition-all">
                            PhonePe
                          </Button>
                        </a>
                        <a href={`googlepay://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR`} className="flex-1">
                          <Button variant="outline" className="w-full py-6 border-2 border-blue-100 hover:border-blue-200 hover:bg-blue-50 text-blue-700 font-bold transition-all">
                            GPay
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMode === "qr" && (
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-white rounded-2xl shadow-inner border border-border inline-block">
                      <QRCodeCanvas value={upiLink} size={180} level="H" includeMargin />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Scan with any UPI App</p>
                      <p className="text-xs text-muted-foreground mt-1">GPay, PhonePe, Paytm, etc.</p>
                    </div>
                  </div>
                )}

                {paymentMode === "id" && (
                  <div className="text-center space-y-5 w-full max-w-sm">
                    <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-bold">UPI ID</p>
                      <p className="text-lg font-mono font-bold tracking-tight">{upiId}</p>
                    </div>
                    <Button variant="outline" onClick={copyUpiId} className="rounded-full px-6">
                      <Copy className="mr-2 h-4 w-4" /> Copy UPI ID
                    </Button>
                  </div>
                )}
              </div>

              {/* Transaction Verification Form */}
              <div className="pt-8 border-t border-border space-y-4">
                <div className="text-center">
                  <h4 className="font-bold text-sm flex items-center justify-center gap-2">
                    Confirm Your Payment
                    <div className="group relative">
                      <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-xl border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-left leading-relaxed">
                        <p className="font-bold mb-1">Where to find Transaction ID?</p>
                        <ul className="list-disc list-inside space-y-1 text-[10px]">
                          <li><strong>GPay:</strong> Open transaction details &gt; "UPI transaction ID"</li>
                          <li><strong>PhonePe:</strong> History &gt; Select payment &gt; "UTR"</li>
                          <li><strong>Paytm:</strong> Balance &amp; History &gt; "UPI Ref No"</li>
                        </ul>
                      </div>
                    </div>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">Enter the transaction ID after successful payment</p>
                </div>
                <div className="space-y-3 max-w-md mx-auto">
                  <Input
                    placeholder="Enter Transaction ID (Ref No.)"
                    className="text-center text-lg font-mono h-14 tracking-widest"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                  />

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Upload Payment Screenshot (Optional but Recommended)
                    </Label>
                    <div className="relative">
                      {screenshotUrl ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
                          <img src={screenshotUrl} alt="Receipt" className="h-full w-full object-contain" />
                          <button
                            onClick={() => setScreenshotUrl("")}
                            className="absolute top-2 right-2 rounded-full bg-white/80 p-1.5 text-destructive shadow-sm hover:bg-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingScreenshot ? (
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : (
                              <UploadCloud className="h-8 w-8 text-primary mb-2" />
                            )}
                            <p className="text-xs font-bold text-primary uppercase tracking-tight">
                              {uploadingScreenshot ? "Uploading..." : "Click to Upload Screenshot"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG or JPEG (Max 5MB)</p>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} disabled={uploadingScreenshot} />
                        </label>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    className="w-full h-14 text-lg shadow-lg"
                    onClick={() => handleConfirmOrder()}
                    disabled={loading || !txnId}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                      <><CheckCircle className="mr-2 h-5 w-5" /> I Have Paid — Place Order</>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/20 animate-pulse">
                    <Info className="h-3 w-3 inline-block mr-1" /> Payment will be verified by the admin before confirmation.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-primary" /> 100% Safe
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-primary" /> Direct Settlement
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Right: Order Summary (always visible) ── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card h-fit sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">{t("checkout.order_summary")}</h3>
          </div>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm gap-2">
                <span className="text-muted-foreground">
                  {item.product.name} <span className="font-semibold text-foreground">× {item.quantity}</span>
                </span>
                <span className="font-semibold">₹{item.quantity * Number(item.product.price)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("checkout.subtotal")}</span>
                <span>₹{cartTotal}</span>
              </div>
              {form.region && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery ({form.region === "hyderabad" ? "Hyd" : "AP/TS"})</span>
                  <span className="font-semibold text-primary">₹{deliveryCharge}</span>
                </div>
              )}
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
              <span>{t("checkout.total")}</span>
              <span className="text-primary">₹{total}</span>
            </div>
            {!form.region && (
              <p className="text-xs text-muted-foreground">Select delivery region to see final total.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;

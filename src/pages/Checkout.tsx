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
  Smartphone, ArrowRight, Loader2, Copy, QrCode, Info, X, UploadCloud, ArrowLeft,
  MapPin, Check
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";
import { INDIA_STATES } from "@/lib/indiaStates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// ── Delivery charge table ─────────────────────────────────────
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

const parseUnitToGrams = (unit: string | null): number => {
  if (!unit) return 1000;
  const lower = unit.toLowerCase().replace(/\s+/g, "");
  const kgMatch = lower.match(/^([0-9.]+)kg/);
  const gMatch = lower.match(/^([0-9.]+)g/);
  if (kgMatch) return parseFloat(kgMatch[1]) * 1000;
  if (gMatch) return parseFloat(gMatch[1]);
  return 1000;
};

const getDeliveryCharge = (totalGrams: number, state: string, district: string): number => {
  if (!state) return 0;
  
  const lowerState = state.toLowerCase();
  const lowerDistrict = (district || "").toLowerCase().trim();
  
  // Detect Region
  let region = "ap-ts"; // Default to regional/domestic
  
  const isAPorTS = lowerState.includes("andhra") || lowerState.includes("telangana");
  const isHyderabadLocal = ["hyderabad", "rangareddy", "vicarabad", "medchal", "malkajgiri"].some(d => lowerDistrict.includes(d));
  
  if (isAPorTS && isHyderabadLocal) {
    region = "hyderabad";
  }

  for (const tier of DELIVERY_TIERS) {
    if (totalGrams <= tier.maxGrams) {
      return region === "hyderabad" ? tier.hyd : tier.apTs;
    }
  }
  const last = DELIVERY_TIERS[DELIVERY_TIERS.length - 1];
  return region === "hyderabad" ? last.hyd : last.apTs;
};

const Checkout = () => {
  const { t } = useTranslation();
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "pay">("details");
  const [loading, setLoading] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [form, setForm] = useState({ 
    name: "", 
    houseNo: "", 
    streetName: "", 
    mandal: "", 
    district: "", 
    pincode: "",
    state: "Andhra Pradesh",
    otherState: "",
    country: "India",
    notes: "", 
    region: "" 
  });
  const [paymentMode, setPaymentMode] = useState<"app" | "qr" | "id">("app");
  const [txnId, setTxnId] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const { saveProfile } = useProfile();

  const handleSelectAddress = (addr: any, idx: number) => {
    if (selectedAddressIdx === idx) {
      // Toggle off: Unselect and clear
      setSelectedAddressIdx(null);
      setForm({
        ...form,
        houseNo: "",
        streetName: "",
        mandal: "",
        district: "",
        pincode: "",
        state: "Andhra Pradesh",
        otherState: "",
        country: "India",
      });
      setSaveAddress(true);
      toast({ title: "Cleared selected address" });
    } else {
      // Toggle on: Select and fill
      setSelectedAddressIdx(idx);
      setForm({
        ...form,
        houseNo: addr.street?.split(',')[0] || addr.street || "",
        streetName: addr.street?.split(',').slice(1).join(',').trim() || addr.street || "",
        mandal: addr.city || "",
        district: addr.city || "",
        pincode: addr.zip || "",
        state: addr.state || "Andhra Pradesh",
        otherState: addr.otherState || "",
        country: addr.country || "India",
      });
      setSaveAddress(false); 
      toast({ title: `Selected "${addr.label}" address` });
    }
  };

  const totalGrams = items.reduce((acc, item) => {
    const unitToParse = item.variant_name || item.product.unit || "";
    return acc + parseUnitToGrams(unitToParse) * item.quantity;
  }, 0);

  const deliveryCharge = getDeliveryCharge(totalGrams, form.state === "Other" ? form.otherState : form.state, form.district);
  const total = cartTotal + deliveryCharge;

  const upiId = "6303602743@upi";
  const merchantName = "Sarugu Sai Vara Prasad";
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR`;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !phoneNumber || !form.houseNo || !form.streetName || !form.mandal || !form.district || !form.pincode) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const isIndian = phonePrefix === "+91";
    if (isIndian) {
      const stripped = phoneNumber.replace(/\s+/g, "");
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(stripped)) {
        toast({ title: "Invalid Mobile Number", description: "Please enter a valid 10-digit Indian mobile number.", variant: "destructive" });
        return;
      }
    } else if (phoneNumber.replace(/\D/g, "").length < 6) {
      toast({ title: "Invalid Phone Number", variant: "destructive" });
      return;
    }
    setStep("pay");
    window.scrollTo({ top: 0 });
  };

  const handleConfirmOrder = async () => {
    if (!user || items.length === 0) return;
    if (!txnId) {
      toast({ title: "Transaction ID Required", variant: "destructive" });
      return;
    }
    setLoading(true);
    const fullPhone = `${phonePrefix} ${phoneNumber}`;
    // Fetch fresh user to ensure session is valid and ID matches for RLS
    const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !freshUser) {
      toast({ title: "Session Expired", description: "Please log in again to place an order.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    const orderPayload = {
      user_id: freshUser.id,
      total,
      shipping_address: `${form.name}\n${form.houseNo}, ${form.streetName}\n${form.mandal}, ${form.district}\n${form.state === "Other" ? form.otherState : form.state}, ${form.country}\nPIN: ${form.pincode}`,
      phone: fullPhone,
      notes: form.notes,
      status: "pending",
      payment_txn_id: txnId,
      payment_screenshot_url: screenshotUrl || null,
      payment_status: "pending",
    };

    console.log("Creating order with payload:", orderPayload);

    try {
      // Step 1: Create Order
      const { data: orders, error: orderError } = await (supabase.from("orders") as any)
        .insert(orderPayload)
        .select();

      if (orderError) {
        console.error("DEBUG: Order Insert Error Details:", orderError);
        throw new Error(`Database Error: ${orderError.message}`);
      }

      if (!orders || orders.length === 0) {
        console.error("DEBUG: No order returned after insert. Payload was:", orderPayload);
        throw new Error("Order was not created successfully (RLS check failed on return). Please ensure you ran the SQL fix.");
      }

      const order = orders[0];
      console.log("Order created successfully:", order);

      // Step 2: Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: Number(item.price),
        variant_name: item.variant_name || null,
      }));

      console.log("Inserting order items:", orderItems);

      const { error: itemsError } = await (supabase.from("order_items") as any).insert(orderItems);
      
      if (itemsError) {
        console.error("DEBUG: Order Items Insert Error Details:", itemsError);
        // If items fail, we have a dangling order. In a real system we'd use transactions 
        // but for now we just report it clearly.
        throw new Error(`Order created (${order.id}) but items failed: ${itemsError.message}`);
      }

      console.log("Order items inserted successfully");

      // Step 3: Optional Address Save
      if (saveAddress && user && profile) {
        const currentAddress = {
          label: "Checkout Address",
          street: `${form.houseNo}, ${form.streetName}`,
          city: form.mandal,
          state: form.state,
          otherState: form.otherState,
          zip: form.pincode,
          country: form.country,
        };

        const isDuplicate = profile.addresses?.some((a: any) => 
          a.street === currentAddress.street && 
          a.city === currentAddress.city && 
          a.zip === currentAddress.zip
        );

        if (!isDuplicate) {
          const newAddresses = [...(profile.addresses || []), currentAddress];
          await saveProfile({
            ...profile,
            addresses: newAddresses
          });
        }
      }

      await clearCart();
      toast({ title: t("checkout.order_placed", "Order placed successfully!") });
      navigate("/order-success");
    } catch (err: any) {
      console.error("CRITICAL: Order placement failed:", err);
      
      let errorDescription = err.message || "Unknown error occurred";
      
      // Database Expert: Detect common schema mismatch signatures
      if (errorDescription.toLowerCase().includes("column") || errorDescription.toLowerCase().includes("schema cache")) {
        errorDescription = "Database schema mismatch detected. Please run the 'Database Schema Auditor' script in your Supabase SQL Editor to fix missing columns (like payment_screenshot_url).";
      }

      toast({ 
        title: t("checkout.order_failed"), 
        description: errorDescription, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingScreenshot(true);
    const fileName = `receipt-${Date.now()}.${file.name.split('.').pop()}`;
    try {
      const { error } = await supabase.storage.from('product-images').upload(`payments/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(`payments/${fileName}`);
      setScreenshotUrl(publicUrl);
      toast({ title: "✅ Screenshot Uploaded" });
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
      <div className="mb-6 flex items-center gap-3">
        {[
          { key: "details", label: "1. Delivery" },
          { key: "pay", label: "2. Payment" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === s.key ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
            <span className={`text-sm font-medium ${step === s.key ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            {i === 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <button onClick={() => step === "pay" ? setStep("details") : navigate("/cart")} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" /> {step === "pay" ? "Back to Details" : "Back to Cart"}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {step === "details" ? (
          <form onSubmit={handleProceedToPayment} className="space-y-6 lg:col-span-2">
            {/* Saved Addresses Section */}
            {profile?.addresses && profile.addresses.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">Use Saved Address</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.addresses.map((addr: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectAddress(addr, idx)}
                      className={cn(
                        "text-left p-4 rounded-2xl border transition-all duration-300 relative group",
                        selectedAddressIdx === idx 
                          ? "bg-primary/5 border-primary shadow-sm" 
                          : "bg-white border-border hover:border-primary/50 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                          selectedAddressIdx === idx ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {addr.label}
                        </span>
                        {selectedAddressIdx === idx && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold truncate leading-tight">{addr.street}</p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1">
                        {addr.city}, {addr.zip}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border bg-card p-6 shadow-card space-y-4">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Delivery Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="flex gap-2">
                    <Input value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)} className="w-16" />
                    <Input id="phone" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ""))} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="houseNo">House No / Flat No *</Label>
                  <Input id="houseNo" required value={form.houseNo} onChange={e => setForm(f => ({ ...f, houseNo: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="streetName">Street / Area Name *</Label>
                  <Input id="streetName" required value={form.streetName} onChange={e => setForm(f => ({ ...f, streetName: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="mandal">Mandal / Town *</Label>
                  <Input id="mandal" required value={form.mandal} onChange={e => setForm(f => ({ ...f, mandal: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="district">District *</Label>
                  <Input id="district" required value={form.district} onChange={e => {
                    const v = e.target.value;
                    setForm(f => ({ 
                      ...f, 
                      district: v
                    }));
                  }} />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input id="pincode" required maxLength={6} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select 
                    value={form.state} 
                    onValueChange={(val) => setForm(f => ({ 
                      ...f, 
                      state: val, 
                      country: val === "Other" ? f.country : "India" 
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[280px]">
                      {INDIA_STATES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.state === "Other" && (
                    <Input 
                      placeholder="Enter State Name" 
                      value={form.otherState} 
                      onChange={e => setForm(f => ({ ...f, otherState: e.target.value }))}
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                </div>
              </div>
              
              {form.state && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Shipping to <span className="capitalize font-bold">{form.state === "Other" ? form.otherState : form.state}</span>
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">₹{deliveryCharge} Delivery Fee</span>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {selectedAddressIdx === null && (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="saveAddress" 
                    checked={saveAddress} 
                    onCheckedChange={(checked) => setSaveAddress(checked as boolean)} 
                  />
                  <label htmlFor="saveAddress" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Save this address to my profile
                  </label>
                </div>
              )}
            </div>
            <Button variant="hero" size="lg" className="w-full" type="submit">Pay ₹{total} <ArrowRight className="ml-2 h-5 w-5" /></Button>
          </form>
        ) : (
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-xl border bg-card p-6 shadow-card space-y-8">
              <div className="text-center space-y-2">
                <h3 className="font-display text-2xl font-bold">UPI Payment</h3>
                <p className="text-muted-foreground">Pay <strong>₹{total}</strong></p>
              </div>
              <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
                {["app", "qr", "id"].map(m => (
                  <button key={m} onClick={() => setPaymentMode(m as any)} className={`py-3 rounded-md text-xs font-bold uppercase ${paymentMode === m ? "bg-background text-primary" : "text-muted-foreground"}`}>{m}</button>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                {paymentMode === "app" && <a href={upiLink}><Button variant="hero" className="gap-2"><Smartphone className="h-5 w-5" /> Open UPI App</Button></a>}
                {paymentMode === "qr" && <div className="p-4 bg-white rounded-xl border"><QRCodeCanvas value={upiLink} size={150} /></div>}
                {paymentMode === "id" && <div className="text-center space-y-2"><div className="p-4 bg-muted rounded-lg font-mono font-bold">{upiId}</div><Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(upiId); toast({ title: "Copied" }); }}><Copy className="h-4 w-4 mr-2" /> Copy ID</Button></div>}
              </div>
              <div className="pt-8 border-t space-y-4">
                <div className="space-y-3">
                  <Label>Transaction ID *</Label>
                  <Input placeholder="Enter Transaction ID" value={txnId} onChange={e => setTxnId(e.target.value)} />
                  <Label>Screenshot (Optional)</Label>
                  <Input type="file" onChange={handleScreenshotUpload} />
                  {uploadingScreenshot && <Loader2 className="animate-spin" />}
                  <Button variant="hero" className="w-full" onClick={handleConfirmOrder} disabled={loading || !txnId}>Confirm Payment & Place Order</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card p-6 shadow-card h-fit sticky top-4">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4"><ShoppingBag className="h-5 w-5 text-primary" /> Order Summary</h3>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product.name} × {item.quantity}</span>
                <span className="font-bold">₹{item.quantity * Number(item.price)}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">₹{total}</span>
            </div>
            {deliveryCharge > 0 && <p className="text-xs text-primary font-bold">Includes ₹{deliveryCharge} delivery fee</p>}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;

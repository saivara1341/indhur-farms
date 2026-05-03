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
  MapPin, Check, Zap
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
import { SearchableSelect } from "@/components/SearchableSelect";
import { COUNTRIES } from "@/lib/countryData";
import { getDistrictsForState } from "@/lib/districtData";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from "@/hooks/useSettings";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// ── Delivery charge table ─────────────────────────────────────
const DELIVERY_TIERS: { maxGrams: number; hyd: number; apTs: number; bangalore: number }[] = [
  { maxGrams: 500, hyd: 80, apTs: 120, bangalore: 190 },
  { maxGrams: 1000, hyd: 100, apTs: 120, bangalore: 190 },
  { maxGrams: 2000, hyd: 160, apTs: 200, bangalore: 250 }, // Extrapolated from other states, user only provided up to 1kg
  { maxGrams: 3000, hyd: 200, apTs: 220, bangalore: 280 }, // Will ask user to confirm
  { maxGrams: 4000, hyd: 230, apTs: 250, bangalore: 310 },
  { maxGrams: 5000, hyd: 250, apTs: 270, bangalore: 340 },
];

const DELIVERY_TABLE = [
  { label: "250g / 500g", hyd: 80, apTs: 120, bangalore: 190 },
  { label: "1 kg", hyd: 100, apTs: 120, bangalore: 190 },
  { label: "2 kg", hyd: 160, apTs: 200, bangalore: 250 },
  { label: "3 kg", hyd: 200, apTs: 220, bangalore: 280 },
  { label: "4 kg", hyd: 230, apTs: 250, bangalore: 310 },
  { label: "5 kg", hyd: 250, apTs: 270, bangalore: 340 },
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
  const isBangalore = lowerState.includes("karnataka") && (lowerDistrict.includes("bengaluru") || lowerDistrict.includes("bangalore"));
  
  if (isAPorTS && isHyderabadLocal) {
    region = "hyderabad";
  } else if (isBangalore) {
    region = "bangalore";
  }

  for (const tier of DELIVERY_TIERS) {
    if (totalGrams <= tier.maxGrams) {
      if (region === "hyderabad") return tier.hyd;
      if (region === "bangalore") return tier.bangalore;
      return tier.apTs;
    }
  }
  const last = DELIVERY_TIERS[DELIVERY_TIERS.length - 1];
  if (region === "hyderabad") return last.hyd;
  if (region === "bangalore") return last.bangalore;
  return last.apTs;
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
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const { saveProfile } = useProfile();
  const { settings } = useSettings();

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
      
      // Handle potential new and old formats
      let hNo = addr.houseNo || "";
      let sName = addr.streetName || "";
      
      // Fallback for old comma-separated street field
      if (!hNo && !sName && addr.street) {
        const streetFull = addr.street;
        const commaIdx = streetFull.indexOf(',');
        if (commaIdx !== -1) {
          hNo = streetFull.substring(0, commaIdx).trim();
          sName = streetFull.substring(commaIdx + 1).trim();
        } else {
          hNo = streetFull.trim();
          sName = streetFull.trim();
        }
      }

      setForm({
        ...form,
        name: profile?.full_name || form.name,
        houseNo: hNo,
        streetName: sName,
        mandal: addr.mandal || addr.city || "", // mandal field if exists, else city
        district: addr.district || addr.city || "", // district field if exists, else city
        pincode: addr.zip || "",
        state: addr.state || "Andhra Pradesh",
        otherState: addr.otherState || "",
        country: addr.country || "India",
      });

      if (profile?.phone) {
        // If profile phone has prefix, try to strip it to match Input's expectation
        const cleanPhone = profile.phone.replace(phonePrefix, "").replace(/\s+/g, "").trim();
        setPhoneNumber(cleanPhone);
      }

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

  const handleRazorpayPayment = async () => {
    const keyId = settings?.razorpay_key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;
    
    if (!keyId) {
      toast({ 
        title: "Payment Gateway Not Configured", 
        description: "Razorpay Key ID is missing. Please contact support.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Order in Razorpay via Edge Function
      const { data: rzpOrder, error: rzpError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { 
          amount: total,
          receipt: `receipt_${Date.now()}`
        }
      });

      if (rzpError || !rzpOrder) {
        console.error("Razorpay Init Error:", rzpError);
        throw new Error(rzpError?.message || "Step 1 Failed: Could not initialize Razorpay order. Check Edge Function logs.");
      }

      // Step 2: Create a PENDING order in our database
      const fullPhone = `${phonePrefix} ${phoneNumber}`;
      const { data: orders, error: orderError } = await (supabase.from("orders") as any)
        .insert({
          user_id: user.id,
          total,
          shipping_address: `${form.name}\n${form.houseNo}, ${form.streetName}\n${form.mandal}, ${form.district}\n${form.state === "Other" ? form.otherState : form.state}, ${form.country}\nPIN: ${form.pincode}`,
          phone: fullPhone,
          notes: form.notes,
          status: "pending",
          payment_status: "pending",
          razorpay_order_id: rzpOrder.id,
        })
        .select();

      if (orderError || !orders || orders.length === 0) {
        console.error("Internal Order Error:", orderError);
        throw new Error(orderError?.message || "Step 2 Failed: Could not create internal order in database.");
      }

      const order = orders[0];

      // Insert order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: Number(item.price),
        variant_name: item.variant_name || null,
      }));

      const { error: itemsError } = await (supabase.from("order_items") as any).insert(orderItems);
      if (itemsError) {
        console.error("Order Items Error:", itemsError);
        throw new Error(itemsError.message || "Step 2.5 Failed: Could not save order items.");
      }

      // Step 3: Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: settings.shop_name || "Indhur Farms",
        description: `Order for ${form.name}`,
        image: "/favicon.png",
        order_id: rzpOrder.id,
        handler: async (response: any) => {
          console.log("Razorpay Success:", response);
          
          setLoading(true);
          try {
            // Step 4: Verify Payment Signature on Backend
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });

            if (verifyError || (verifyData && verifyData.error)) {
              console.error("Verification Error:", verifyError || verifyData?.error);
              throw new Error(verifyError?.message || verifyData?.error || "Step 4 Failed: Payment verification failed.");
            }

            await clearCart();
            toast({ title: t("checkout.order_placed") });
            navigate("/order-success");
          } catch (err: any) {
            toast({ 
              title: "Verification Failed", 
              description: err.message || "Payment successful but verification failed. Please contact support.", 
              variant: "destructive" 
            });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: form.name,
          contact: phoneNumber,
          email: user?.email,
        },
        theme: {
          color: "#10b981", 
        },
        modal: {
          ondismiss: () => setLoading(false)
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({ 
        title: "Payment Failed", 
        description: err.message, 
        variant: "destructive" 
      });
      setLoading(false);
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
                        
                        {/* Radio-style indicator */}
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                          selectedAddressIdx === idx 
                            ? "bg-primary border-primary text-white scale-110 shadow-sm" 
                            : "bg-transparent border-muted-foreground/30 text-transparent"
                        )}>
                          <Check className="h-3 w-3" />
                        </div>
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
                    <SearchableSelect
                      options={COUNTRIES.map(c => ({ label: `${c.code} ${c.dialCode}`, value: c.dialCode }))}
                      value={phonePrefix}
                      onChange={setPhonePrefix}
                      className="w-[100px] px-2"
                      placeholder="Code"
                      searchPlaceholder="Code..."
                    />
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
                  {getDistrictsForState(form.state).length > 0 ? (
                    <SearchableSelect
                      options={getDistrictsForState(form.state).map(d => ({ label: d, value: d }))}
                      value={form.district}
                      onChange={(val) => setForm(f => ({ ...f, district: val }))}
                      placeholder="Select district"
                      searchPlaceholder="Search district..."
                    />
                  ) : (
                    <Input id="district" required value={form.district} onChange={e => {
                      const v = e.target.value;
                      setForm(f => ({ 
                        ...f, 
                        district: v
                      }));
                    }} placeholder="Enter District Name" />
                  )}
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input id="pincode" required maxLength={6} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <SearchableSelect
                    options={INDIA_STATES.map(s => ({ label: s, value: s }))}
                    value={form.state}
                    onChange={(val) => setForm(f => ({ 
                      ...f, 
                      state: val, 
                      district: "", // Reset district when state changes
                      country: val === "Other" ? f.country : "India" 
                    }))}
                    placeholder="Select state"
                    searchPlaceholder="Search state..."
                  />
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
                  <SearchableSelect
                    options={COUNTRIES.map(c => ({ label: c.name, value: c.name }))}
                    value={form.country}
                    onChange={(val) => setForm(f => ({ ...f, country: val }))}
                    placeholder="Select country"
                    searchPlaceholder="Search country..."
                  />
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
            <div className="rounded-2xl border bg-card shadow-premium overflow-hidden transition-all duration-500">
              <div className="p-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
              <div className="p-8 space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="font-display text-3xl font-bold tracking-tight">Complete Payment</h3>
                  <p className="text-muted-foreground flex items-center justify-center gap-2">
                    Pay <span className="text-2xl font-black text-primary">₹{total}</span> securely
                  </p>
                </div>

                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Click below to pay securely using UPI, Credit/Debit Cards, or Netbanking via Razorpay.</p>
                  </div>
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full h-16 text-lg font-bold shadow-xl shadow-primary/20"
                    onClick={handleRazorpayPayment}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Zap className="mr-2 h-6 w-6" />}
                    Pay ₹{total} Now
                  </Button>
                  <div className="flex items-center justify-center gap-6 opacity-40 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                  </div>
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

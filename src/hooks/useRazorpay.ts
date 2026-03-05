import { useEffect, useCallback } from "react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

export function useRazorpay() {
    useEffect(() => {
        if (document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`)) return;
        const script = document.createElement("script");
        script.src = RAZORPAY_SCRIPT;
        script.async = true;
        document.body.appendChild(script);
    }, []);

    const openPayment = useCallback(
        ({
            amount,       // in paise (₹1 = 100 paise)
            orderId,      // internal order id for reference
            name,
            phone,
            email,
            onSuccess,
            onFailure,
        }: {
            amount: number;
            orderId: string;
            name: string;
            phone: string;
            email: string;
            onSuccess: (paymentId: string) => void;
            onFailure: (error: string) => void;
        }) => {
            if (!window.Razorpay) {
                onFailure("Payment gateway not loaded. Please refresh and try again.");
                return;
            }

            const options = {
                // ⚠️ Replace with your actual Razorpay Key ID from https://dashboard.razorpay.com/
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_REPLACE_ME",
                amount: amount * 100, // convert to paise
                currency: "INR",
                name: "Indhur Farms",
                description: `Order #${orderId.slice(0, 8)}`,
                image: "/logo.png",
                prefill: {
                    name,
                    contact: phone,
                    email,
                },
                theme: {
                    color: "#1a7a2e",
                },
                handler: (response: { razorpay_payment_id: string }) => {
                    onSuccess(response.razorpay_payment_id);
                },
                modal: {
                    ondismiss: () => {
                        onFailure("Payment cancelled by user.");
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (response: any) => {
                onFailure(response.error?.description || "Payment failed.");
            });
            rzp.open();
        },
        []
    );

    return { openPayment };
}

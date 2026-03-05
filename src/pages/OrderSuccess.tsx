import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const OrderSuccess = () => {
    const { t } = useTranslation();

    return (
        <main className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
                <CheckCircle2 className="h-12 w-12" />
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <h1 className="mb-2 font-display text-4xl font-bold text-foreground">
                    {t('checkout.order_placed')}
                </h1>
                <p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
                    {t('checkout.order_success_desc') || "Thank you for your order! We've received your request and will start processing it right away. You'll receive a confirmation soon."}
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link to="/orders">
                        <Button variant="default" className="gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            {t('orders.view_orders') || "View My Orders"}
                        </Button>
                    </Link>
                    <Link to="/products">
                        <Button variant="outline" className="gap-2">
                            {t('cart.continue_shopping') || "Continue Shopping"}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </main>
    );
};

export default OrderSuccess;

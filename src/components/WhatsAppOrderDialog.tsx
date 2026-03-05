import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";

export function WhatsAppOrderDialog() {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [product, setProduct] = useState("");
    const [quantity, setQuantity] = useState("");
    const [address, setAddress] = useState("");

    const handleConfirm = () => {
        const phone = "919030854213";
        const text = `Hello Indhur Farms! I'd like to place an order.
    
*Name:* ${name}
*Product:* ${product}
*Quantity:* ${quantity}
*Address:* ${address || "N/A"}`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/${phone}?text=${encodedText}`, "_blank");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="xl" className="bg-transparent text-white border-2 border-white/40 hover:bg-white/10 rounded-full px-10 backdrop-blur-sm">
                    {t("cta.order_now")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" /> {t("cta.whatsapp_dialog_title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("cta.whatsapp_dialog_desc")}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t("cta.full_name_label")}</Label>
                        <Input
                            id="name"
                            placeholder={t("cta.full_name_placeholder")}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="product">{t("cta.product_label")}</Label>
                        <Input
                            id="product"
                            placeholder={t("cta.product_placeholder")}
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">{t("cta.quantity_label")}</Label>
                        <Input
                            id="quantity"
                            placeholder={t("cta.quantity_placeholder")}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">{t("cta.address_label")}</Label>
                        <Input
                            id="address"
                            placeholder={t("cta.address_placeholder")}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={handleConfirm} className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" /> {t("cta.confirm_btn")}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

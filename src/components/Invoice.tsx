import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/hooks/useSettings';
import logo from '@/assets/logo.png';

interface InvoiceProps {
    order: any;
    profile: any;
}

const Invoice: React.FC<InvoiceProps> = ({ order, profile }) => {
    const { t } = useTranslation();
    const { settings } = useSettings();

    // Calculate subtotal from items
    const subtotal = (order.order_items || []).reduce((acc: number, item: any) => acc + (Number(item.price) * item.quantity), 0);
    // Shipping is the difference between total and subtotal
    const shipping = Math.max(0, order.total - subtotal);

    return (
        <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg border border-border print:shadow-none print:border-none print:p-0" id="invoice-content">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-border pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <img src={logo} alt="Indhur Farms" className="h-16 w-16 rounded-xl object-cover" />
                    <div>
                        <h1 className="text-3xl font-display font-bold text-primary">{settings?.shop_name || "Indhur Farms"}</h1>
                        <p className="text-sm text-muted-foreground">{t('footer.tagline')}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase text-primary">{t('invoice.title')}</h2>
                    <p className="text-sm font-semibold">INV-{new Date(order.created_at).getFullYear()}-{order.id.slice(0, 4).toUpperCase()}</p>
                    <p className="text-sm">{t('invoice.date')}: {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-10">
                {/* Billing Info */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{t('invoice.bill_to')}</h3>
                    <p className="font-bold">{profile?.full_name || order.customer_name || t('profile.user')}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || order.customer_email || "Customer"}</p>
                    <p className="text-sm text-muted-foreground">{order.phone || profile?.phone}</p>
                </div>
                {/* Shipping Info */}
                <div className="text-right">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{t('invoice.ship_to')}</h3>
                    <p className="text-sm whitespace-pre-wrap">{order.shipping_address}</p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-10">
                <thead>
                    <tr className="border-b-2 border-primary text-left text-xs uppercase font-bold text-primary">
                        <th className="py-3 px-2">{t('invoice.item')}</th>
                        <th className="py-3 px-2 text-right">{t('invoice.price')}</th>
                        <th className="py-3 px-2 text-right">{t('invoice.quantity')}</th>
                        <th className="py-3 px-2 text-right">{t('invoice.total')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {(order.order_items || []).map((item: any, i: number) => (
                        <tr key={i} className="text-sm">
                            <td className="py-4 px-2 font-medium">{item.products?.name} <span className="text-xs text-muted-foreground block font-normal">{item.variant_name}</span></td>
                            <td className="py-4 px-2 text-right">₹{item.price}</td>
                            <td className="py-4 px-2 text-right">{item.quantity}</td>
                            <td className="py-4 px-2 text-right font-bold">₹{Number(item.price) * item.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{shipping > 0 ? `₹${shipping}` : t('checkout.free')}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border pt-3">
                        <span className="text-lg font-bold">{t('invoice.total')}</span>
                        <span className="text-2xl font-bold text-primary">₹{order.total}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Status */}
            <div className="flex justify-between items-center bg-muted/30 p-6 rounded-xl border border-border">
                <div>
                    <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Payment Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${order.payment_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {order.payment_status === 'verified' ? t('invoice.paid') : t('invoice.unpaid')}
                    </span>
                </div>
                <div className="text-right text-xs text-muted-foreground leading-relaxed">
                    <p>Thank you for shopping with {settings?.shop_name || "Indhur Farms"}.</p>
                    <p>For any queries, contact us at +91 9030854213</p>
                </div>
            </div>
        </div>
    );
};

export default Invoice;

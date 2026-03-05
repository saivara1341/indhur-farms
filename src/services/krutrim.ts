
import { supabase } from "@/integrations/supabase/client";

/**
 * Krutrim AI Service
 * 
 * Provides an interface to interact with Krutrim AI models (Krutrim-2, Dhwani-1)
 * for advanced multilingual intent extraction and task automation.
 */

export interface KrutrimIntent {
    intent: 'add_to_cart' | 'checkout' | 'clear_cart' | 'list_products' | 'unknown' | 'select_quantity' |
    'admin_list_products' | 'admin_add_product' | 'admin_bulk_tracking' | 'marketing_suggestion';
    product?: string;
    quantity?: string;
    payload?: any;
    originalText: string;
}

export const krutrimService = {
    /**
     * High-fidelity Indic speech recognition using Dhwani-1
     */
    async transcribeAudio(audioBlob: Blob): Promise<string> {
        const DHWANI_URL = "http://localhost:8000/transcribe";
        const formData = new FormData();
        formData.append("file", audioBlob, "voice_command.wav");
        formData.append("prompt", "Recognize the speech and give me the transcription.");

        try {
            console.log("[Krutrim] Requesting Dhwani transcription...");
            const response = await fetch(DHWANI_URL, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Dhwani Bridge unavailable");
            const data = await response.json();
            return data.text;
        } catch (error) {
            console.warn("[Krutrim] Dhwani transcription failed:", error);
            return "";
        }
    },

    /**
     * Parses raw voice input using Krutrim logic to extract semantic intent.
     * Handles mixed-language (code-switching) like "Add pasupu in the cart"
     */
    async parseIntent(text: string): Promise<KrutrimIntent> {
        const rawText = text.toLowerCase().trim();

        console.log("[Krutrim] Parsing intent for:", rawText);

        // Placeholder for actual Krutrim Cloud API call
        // In a production scenario, you would use:
        // const response = await fetch('https://api.krutrim.ai/v1/chat/completions', { ... })

        // Advanced Regex & Keyword Matching as fallback/logic base
        // Support for: Telugu, Hindi, English

        // 1. ADD TO CART Intent
        const addKeywords = ['add', 'joḍiñcu', 'జోడించు', 'jodinchu', 'rakho', 'daalo', 'dalen', 'రకో', 'jodo', 'put', 'కావాలి', 'kavali'];
        const findAdd = addKeywords.some(k => rawText.includes(k));

        // 2. CHECKOUT Intent
        const checkoutKeywords = ['checkout', 'billing', 'bill', 'payment', 'paisa', 'order', 'book', 'check out', 'కొనాలి', 'konali'];
        const findCheckout = checkoutKeywords.some(k => rawText.includes(k));

        // 3. CLEAR CART
        const clearKeywords = ['clear', 'khali', 'khaalii', 'tappisu', 'remove all', 'తొలగించు', 'teeyu'];
        const findClear = clearKeywords.some(k => rawText.includes(k));

        if (findClear) return { intent: 'clear_cart', originalText: text };
        if (findCheckout) return { intent: 'checkout', originalText: text };

        // 4. ADMIN Intents
        const adminKeywords = ['admin', 'management', 'tracking', 'bulk', 'add product', 'list products', 'AWB', 'awb'];
        const findAdmin = adminKeywords.some(k => rawText.includes(k));

        if (findAdmin) {
            if (rawText.includes('list') || rawText.includes('products')) return { intent: 'admin_list_products', originalText: text };
            if (rawText.includes('add') && rawText.includes('product')) return { intent: 'admin_add_product', originalText: text };
            if (rawText.includes('tracking') || rawText.includes('awb')) return { intent: 'admin_bulk_tracking', originalText: text };
        }

        // 5. MARKETING / GREETING Logic
        if (rawText.includes('hello') || rawText.includes('hi') || rawText.includes('hey') || rawText.includes('namaste')) {
            return { intent: 'marketing_suggestion', originalText: text };
        }

        if (findAdd || /turmeric|pasupu|haldi|chilli|mirchi|honey|tene|ghee|neyyi/i.test(rawText)) {
            // Extract product name
            const productsAliases = {
                'turmeric': ['turmeric', 'pasupu', 'haldi', 'పసుపు', 'హల్దీ', 'pasupu kommulu', 'pasupu powder'],
                'chilli': ['chilli', 'mirchi', 'kaaram', 'మిర్చి', 'కారం'],
                'honey': ['honey', 'tene', 'teene', 'తేనె', 'షహద్'],
                'ghee': ['ghee', 'neyyi', 'ney', 'నేయి', 'ఘీ']
            };

            let detectedProduct = '';
            for (const [id, aliases] of Object.entries(productsAliases)) {
                if (aliases.some(a => rawText.includes(a))) {
                    detectedProduct = id;
                    break;
                }
            }

            // Extract quantity (e.g. 250g, 500g, 1kg, 250 grams)
            const qtyRegex = /(\d+)\s*(g|kg|grams|kilograms|ml|packet|packets|గ్రాములు|కిలో)/i;
            const qtyMatch = rawText.match(qtyRegex);
            const quantity = qtyMatch ? qtyMatch[0] : undefined;

            return {
                intent: 'add_to_cart',
                product: detectedProduct || undefined,
                quantity: quantity,
                originalText: text
            };
        }

        return { intent: 'unknown', originalText: text };
    }
};

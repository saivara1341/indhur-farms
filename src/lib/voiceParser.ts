/**
 * Advanced Voice Command Parser for Indhur Farms Shop
 * Supports: English, Hindi, Telugu
 */

export interface ParsedCommand {
    action: 'add' | 'checkout' | 'show_cart' | 'clear_cart' | 'unknown';
    productQuery?: string;
    originalText: string;
}

const DICTIONARY = {
    add: {
        en: ["add", "put", "cart", "buy"],
        hi: ["जोड़ें", "डालो", "खरीदें", "जोड़ो", "एड", "दालो"],
        te: ["జోడించు", "కలిపి", "పెట్టుకో", "వేసుకో", "కొను", "జత చేయి", "కావలెను"]
    },
    checkout: {
        en: ["checkout", "order", "place", "pay", "done"],
        hi: ["चेकआउट", "ऑर्डर", "खरीदें", "भुगतान", "खत्म"],
        te: ["చెక్ అవుట్", "ఆర్డర్", "కొనుగోలు", "పూర్తి చేయి", "పేమెంట్"]
    },
    show_cart: {
        en: ["show", "cart", "view", "items"],
        hi: ["दिखाओ", "कार्ट", "बॉक्स", "आइटम"],
        te: ["చూపించు", "కార్ట్", "వస్తువులు", "చూడు", "చూపి"]
    },
    clear_cart: {
        en: ["clear", "empty", "remove", "delete"],
        hi: ["साफ", "खाली", "हटाओ", "मिटाओ"],
        te: ["క్లియర్", "ఖాళీ", "తొలగించు", "తీసివేయి", "తీయి"]
    }
};

const PRODUCT_NAMES = {
    turmeric: {
        en: ["turmeric", "powder", "haldi"],
        hi: ["हल्दी", "हल्दी पाउडर"],
        te: ["పసుపు", "పసుపు పొడి"]
    }
};

/**
 * Normalizes text by removing punctuation and extra spaces.
 */
const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
};

/**
 * Parses a voice command and extracts action and product info.
 */
export const parseVoiceCommand = (text: string): ParsedCommand => {
    const norm = normalizeText(text);

    // Specific match for "పసుపు జోడించు" (Turmeric add)
    if (norm.includes("పసుపు") && (norm.includes("జోడించు") || norm.includes("కలిపి") || norm.includes("వేసుకో"))) {
        return { action: 'add', productQuery: 'turmeric', originalText: text };
    }

    // Check for Action
    let detectedAction: ParsedCommand['action'] = 'unknown';

    // Order of check matters
    if (checkMatch(norm, DICTIONARY.checkout)) detectedAction = 'checkout';
    else if (checkMatch(norm, DICTIONARY.add)) detectedAction = 'add';
    else if (checkMatch(norm, DICTIONARY.clear_cart)) detectedAction = 'clear_cart';
    else if (checkMatch(norm, DICTIONARY.show_cart)) detectedAction = 'show_cart';

    // Extract product if action is 'add'
    let product: string | undefined;
    if (detectedAction === 'add') {
        if (checkMatch(norm, PRODUCT_NAMES.turmeric)) product = 'turmeric';
        // Fallback search: if no specific product found, use the whole string sans action verbs
        if (!product) {
            product = norm; // Simplified for now, in production this would be more complex
        }
    }

    return {
        action: detectedAction,
        productQuery: product,
        originalText: text
    };
};

const checkMatch = (text: string, langMap: Record<string, string[]>): boolean => {
    return Object.values(langMap).flat().some(keyword => text.includes(keyword.toLowerCase()));
};

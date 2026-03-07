import { TFunction } from "i18next";

/**
 * Mapping of database product base names to translation keys.
 */
export const productNameKeys: Record<string, string> = {
    "Pasupu Kommulu": "dry_turmeric_fingers",
    "Pasupu (Turmeric Powder)": "pure_turmeric_powder",
    "Chilli powder": "chilli_powder",
};

/**
 * Translates a product name based on its base name.
 * Fallback to the original name if no translation exists.
 */
export const getTranslatedProductName = (name: string, t: TFunction) => {
    const baseName = name.replace(/\s*(?:-\s*)?[0-9.]+\s*(g|kg|ml|l|grams|kgs)$/i, "").trim();
    const key = productNameKeys[baseName];

    if (key) {
        const translatedBase = t(`products.names.${key}`);
        // Re-attach unit if it was part of the original name (for full name translation)
        const unitMatch = name.match(/\s*(?:-\s*)?[0-9.]+\s*(g|kg|ml|l|grams|kgs)$/i);
        if (unitMatch) {
            return `${translatedBase} - ${unitMatch[0].replace(/^-?\s*/, "").trim()}`;
        }
        return translatedBase;
    }

    return name;
};

/**
 * Translates just the base name of a product.
 */
export const getTranslatedBaseName = (baseName: string, t: TFunction) => {
    const key = productNameKeys[baseName.trim()];
    return key ? t(`products.names.${key}`) : baseName;
};

-- Migration: Implement Product Variants
-- Description: Adds variants support to products, cart items, and order items.

-- Add variants JSONB column to products if not exists
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- Add variant_name to cart_items if not exists
ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS variant_name TEXT;

-- Safely update unique constraint on cart_items
DO $$
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_user_id_product_id_key') THEN
        ALTER TABLE public.cart_items DROP CONSTRAINT cart_items_user_id_product_id_key;
    END IF;

    -- Add new constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_user_id_product_id_variant_name_key') THEN
        ALTER TABLE public.cart_items
        ADD CONSTRAINT cart_items_user_id_product_id_variant_name_key
        UNIQUE (user_id, product_id, variant_name);
    END IF;
END $$;

-- Add variant_name to order_items if not exists
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS variant_name TEXT;

-- Update RLS if needed (usually columns are handled automatically if they don't change table-level access)
-- But ensuring types are correct for the variants column
COMMENT ON COLUMN public.products.variants IS 'Stores array of variant objects: {id, name, price, stock, unit}';
-- Set default values for existing items (assuming no variant)
UPDATE public.cart_items SET variant_name = '' WHERE variant_name IS NULL;
UPDATE public.order_items SET variant_name = '' WHERE variant_name IS NULL;

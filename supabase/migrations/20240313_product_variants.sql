-- Migration: Implement Product Variants
-- Description: Adds variants support to products, cart items, and order items.

-- 1. Update products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- 2. Update cart_items table
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS variant_name TEXT;

-- Update unique constraint for cart_items to allow multiple variants of the same product
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_id_product_id_variant_name_key UNIQUE (user_id, product_id, variant_name);

-- 3. Update order_items table
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_name TEXT;

-- 4. Set default values for existing items (assuming no variant)
UPDATE public.cart_items SET variant_name = '' WHERE variant_name IS NULL;
UPDATE public.order_items SET variant_name = '' WHERE variant_name IS NULL;

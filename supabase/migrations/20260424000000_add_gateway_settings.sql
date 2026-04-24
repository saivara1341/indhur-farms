ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS razorpay_key_id TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'manual'; -- manual, gateway, both
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

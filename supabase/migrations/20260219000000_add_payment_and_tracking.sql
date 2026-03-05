-- Create a table for site settings (key-value store)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default settings if not exist
INSERT INTO site_settings (key, value) VALUES
('upi_id', ''),
('qr_code_url', '')
ON CONFLICT (key) DO NOTHING;

-- Add payment fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_txn_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'; -- pending, verified, failed

-- Add RLS policies for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for site_settings"
ON site_settings FOR SELECT
USING (true);

CREATE POLICY "Admin write access for site_settings"
ON site_settings FOR ALL
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

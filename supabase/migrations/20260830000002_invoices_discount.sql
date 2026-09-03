-- Add discount, discount_reason, and note columns to invoices table if they don't already exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_reason TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';

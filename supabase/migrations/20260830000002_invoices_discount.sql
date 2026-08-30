-- Add discount and discount_reason columns to invoices table if they don't already exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_reason TEXT DEFAULT '';

-- ==============================================================================
-- Add receipt customization columns to settings table
-- ==============================================================================

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ',
ADD COLUMN IF NOT EXISTS service_description TEXT DEFAULT 'Dịch vụ chung (Rác, Wifi, ...)',
ADD COLUMN IF NOT EXISTS receipt_note TEXT DEFAULT '';

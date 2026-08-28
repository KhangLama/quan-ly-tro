-- ==============================================================================
-- Web App Quản Lý Nhà Trọ - Initial Database Schema Migration
-- ==============================================================================

-- 1. Table: settings (Singleton table for global utility rates, receipt customizations, and banking info)
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    electric_price NUMERIC NOT NULL DEFAULT 3500,
    water_price NUMERIC NOT NULL DEFAULT 25000,
    service_price NUMERIC NOT NULL DEFAULT 100000,
    bank_info TEXT NOT NULL DEFAULT 'MBBank - 0987654321 - NGUYEN VAN A',
    address TEXT DEFAULT '325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ',
    service_description TEXT DEFAULT 'Dịch vụ chung (Rác, Wifi, ...)',
    receipt_note TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT singleton_check CHECK (id = 1)
);

-- Seed default settings row if not exists
INSERT INTO settings (id, electric_price, water_price, service_price, bank_info, address, service_description, receipt_note, updated_at)
VALUES (1, 3500, 25000, 100000, 'MBBank - 0987654321 - NGUYEN VAN A', '325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ', 'Dịch vụ chung (Rác, Wifi, ...)', '', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Table: rooms (Rental rooms)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    base_price NUMERIC NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'empty' CHECK (status IN ('rented', 'empty')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: tenants (Tenants and roommates in rooms)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    cccd VARCHAR(50),
    is_lead BOOLEAN NOT NULL DEFAULT false,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    deposit_amount NUMERIC NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'moved_out')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by room_id and status
CREATE INDEX IF NOT EXISTS idx_tenants_room_id ON tenants(room_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- 4. Table: invoices (Monthly billing statements per room)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g. '2026-08')
    old_electric NUMERIC NOT NULL DEFAULT 0,
    new_electric NUMERIC NOT NULL DEFAULT 0,
    old_water NUMERIC NOT NULL DEFAULT 0,
    new_water NUMERIC NOT NULL DEFAULT 0,
    base_price NUMERIC NOT NULL DEFAULT 0,
    electric_price NUMERIC NOT NULL DEFAULT 3500,
    water_price NUMERIC NOT NULL DEFAULT 25000,
    service_price NUMERIC NOT NULL DEFAULT 100000,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_room_month UNIQUE (room_id, month)
);

-- Index for fast lookup by room_id and month
CREATE INDEX IF NOT EXISTS idx_invoices_room_id ON invoices(room_id);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON invoices(month);

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Baseline policies allowing CRUD access
CREATE POLICY "Allow all access to settings" ON settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all access to rooms" ON rooms
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all access to tenants" ON tenants
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all access to invoices" ON invoices
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Sample Initial Data (Phòng mẫu & Khách thuê)
INSERT INTO rooms (id, code, base_price, status)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'P101', 3200000, 'rented'),
    ('22222222-2222-2222-2222-222222222222', 'P102', 3500000, 'rented'),
    ('33333333-3333-3333-3333-333333333333', 'P103', 2800000, 'empty'),
    ('44444444-4444-4444-4444-444444444444', 'P201', 3000000, 'empty')
ON CONFLICT (code) DO NOTHING;

INSERT INTO tenants (id, room_id, name, phone, cccd, is_lead, start_date, deposit_amount, status)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Nguyễn Văn An', '0901234567', '001090001234', true, CURRENT_DATE - INTERVAL '60 days', 3200000, 'active'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Trần Thị Bình', '0912345678', '001090005678', true, CURRENT_DATE - INTERVAL '30 days', 3500000, 'active')
ON CONFLICT (id) DO NOTHING;


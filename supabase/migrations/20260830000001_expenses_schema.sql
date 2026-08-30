-- ==============================================================================
-- Migration: Expenses Management Schema
-- ==============================================================================

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g. '2026-08')
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    item_name TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Khác',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    unit_price NUMERIC NOT NULL DEFAULT 0,
    quantity NUMERIC NOT NULL DEFAULT 1,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by month and status
CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- Row Level Security (RLS) Policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on expenses" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on expenses" ON expenses FOR DELETE USING (true);

-- ==============================================================================
-- MIGRATION: Bổ sung custom_fees cho invoices và rooms
-- Hỗ trợ cấu hình chi phí khác (mục số 4) theo từng phòng với đơn giá, số lượng
-- ==============================================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS custom_fees JSONB DEFAULT '[]'::JSONB;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS custom_fees JSONB DEFAULT '[]'::JSONB;

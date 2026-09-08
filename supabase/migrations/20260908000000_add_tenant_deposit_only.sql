-- ==============================================================================
-- MIGRATION: THÊM CỘT ĐẶT CỌC GIỮ CHỖ KHÔNG Ở (DEPOSIT_ONLY) CHO BẢNG TENANTS
-- Chạy đoạn SQL này trong: Supabase Dashboard -> SQL Editor -> New query -> RUN
-- ==============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deposit_only BOOLEAN DEFAULT false;

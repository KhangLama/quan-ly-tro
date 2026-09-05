-- ==============================================================================
-- MIGRATION: THÊM CỘT GHI CHÚ (NOTE) CHO BẢNG ROOMS
-- Chạy đoạn SQL này trong: Supabase Dashboard -> SQL Editor -> New query -> RUN
-- ==============================================================================

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';

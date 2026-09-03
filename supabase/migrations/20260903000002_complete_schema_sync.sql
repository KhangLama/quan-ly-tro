-- ==============================================================================
-- MIGRATION: ĐỒNG BỘ TOÀN DIỆN CÁC CỘT CÒN THIẾU TRÊN SUPABASE DATABASE
-- Chạy đoạn SQL này trong: Supabase Dashboard -> SQL Editor -> New query -> RUN
-- ==============================================================================

-- 1. Bổ sung cột ghi chú hóa đơn (note) và giảm giá cho bảng invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_reason TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';

-- 2. Bổ sung cột danh sách nội thất (furniture) cho bảng rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS furniture TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 3. Bổ sung cột danh mục nội thất mẫu (furniture_catalog) cho bảng settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS furniture_catalog TEXT[] DEFAULT ARRAY[
  'Máy lạnh', 
  'Tủ lạnh', 
  'Máy nước nóng', 
  'Giường nệm', 
  'Tủ quần áo', 
  'Bàn ghế làm việc', 
  'Bếp từ', 
  'Kệ bếp', 
  'Máy giặt', 
  'Wifi riêng', 
  'Khoá vân tay', 
  'Gác lửng', 
  'Ban công / Cửa sổ'
]::TEXT[];

-- Kiểm tra kết quả
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('invoices', 'rooms', 'settings') 
  AND column_name IN ('note', 'discount', 'discount_reason', 'furniture', 'furniture_catalog');

-- Add furniture_catalog to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS furniture_catalog TEXT[] DEFAULT ARRAY['Máy lạnh', 'Tủ lạnh', 'Máy nước nóng', 'Giường nệm', 'Tủ quần áo', 'Bàn ghế làm việc', 'Bếp từ', 'Kệ bếp', 'Máy giặt', 'Wifi riêng', 'Khoá vân tay', 'Gác lửng', 'Ban công / Cửa sổ']::TEXT[];

-- Add furniture to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS furniture TEXT[] DEFAULT ARRAY[]::TEXT[];

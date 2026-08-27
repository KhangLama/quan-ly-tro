# Web App Quản Lý Nhà Trọ (Mobile-First)

Ứng dụng web quản lý phòng trọ (~10 phòng) tối ưu cho thiết bị di động (viewport 375px+), xây dựng bằng **Next.js 14+ (App Router)**, **Tailwind CSS**, và **Supabase (PostgreSQL)**. Giao diện hoàn toàn bằng tiếng Việt, hỗ trợ theo dõi khách thuê, tự động lấy chỉ số điện nước từ tháng trước, tính tiền realtime và xuất tin nhắn Zalo/SMS 1 chạm.

---

## 🌟 Tính Năng Nổi Bật

1. **Tổng Quan Dòng Tiền & Phòng Trọ (`/`)**:
   - 4 thẻ KPI tài chính: Tổng dự thu, Đã thu, Chưa thu, Tỷ lệ lấp đầy phòng.
   - Grid trạng thái trực quan với badge màu: **Đã thu** (xanh), **Chưa thu** (vàng), **Trống** (xám).
   - Bộ chọn tháng linh hoạt với điều hướng nhanh.

2. **Chốt Điện Nước & Tính Tiền Tự Động (`/invoices/new`)**:
   - **Tự động điền số cũ**: Tự động truy vấn chỉ số điện/nước mới từ hóa đơn tháng trước của phòng đã chọn để điền vào số cũ.
   - **Tính toán realtime**: Tiền điện = `(mới - cũ) × đơn giá điện`; Tiền nước = `(mới - cũ) × đơn giá nước`; Tổng = `Tiền phòng + Tiền điện + Tiền nước + Tiền dịch vụ`.
   - **1-Tap Copy Zalo**: Xuất chuỗi tin nhắn Zalo chuẩn tiếng Việt và copy trực tiếp vào clipboard.
   - Nút lưu hóa đơn và đổi trạng thái thanh toán (*Đã thu* / *Chưa thu*).

3. **Quản Lý Chi Tiết Phòng & Khách Thuê (`/rooms/[id]`)**:
   - Danh sách khách đang ở: Họ tên, Số điện thoại (bấm để gọi trực tiếp), CCCD, Ngày vào ở, Tiền cọc, Người đại diện hợp đồng (`is_lead`).
   - Thêm khách mới / ở ghép nhanh chóng với modal nhập liệu.
   - Thao tác trả phòng và chuyển vào **Lịch sử khách đã chuyển đi**.
   - **Tự động đồng bộ trạng thái phòng**: Tự động chuyển thành `rented` khi có khách và `empty` khi tất cả khách trả phòng.
   - Lịch sử tất cả hóa đơn của phòng.

4. **Cài Đặt Đơn Giá & Ngân Hàng (`/settings`)**:
   - Cấu hình đơn giá điện (VNĐ/kWh), nước (VNĐ/m³), dịch vụ chung (VNĐ/phòng/tháng).
   - Cấu hình số tài khoản ngân hàng nhận chuyển khoản.

5. **Bảo Mật Đơn Giản (`/login`)**:
   - Xác thực một mật khẩu quản trị viên cố định qua biến môi trường `ADMIN_PASSWORD`.
   - Cookie phiên bảo mật ký HMAC-SHA256 chuẩn Web Crypto API, bảo vệ toàn bộ routes qua Next.js Middleware.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình biến môi trường
Tạo file `.env.local` từ `.env.example`:
```bash
cp .env.example .env.local
```

Điền các thông số vào `.env.local`:
```env
# Mật khẩu đăng nhập quản trị viên (mặc định: tro123456)
ADMIN_PASSWORD=tro123456

# Thông tin kết nối Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

*(Lưu ý: Nếu chưa cấu hình Supabase URL thật, hệ thống sẽ tự động sử dụng In-Memory Mock Database để chạy thử nghiệm ngay lập tức mà không cần cài đặt thêm gì).*

### 3. Chạy SQL Migration trên Supabase (Khởi tạo Database)
Mở **Supabase SQL Editor** trong dashboard Supabase của bạn và chạy toàn bộ nội dung file:
```
supabase/migrations/20260826000000_init_schema.sql
```
File này sẽ tạo 4 bảng (`settings`, `rooms`, `tenants`, `invoices`), thiết lập khóa ngoại, ràng buộc duy nhất, Row Level Security (RLS) và 1 dòng cấu hình mặc định trong bảng `settings`.

### 4. Chạy Development Server
```bash
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000). Đăng nhập bằng mật khẩu `tro123456`.

### 5. Build ứng dụng cho Production
```bash
npm run build
npm run start
```

---

## 🧪 Kiểm Thử Tự Động (Automated Testing)

Chạy toàn bộ bộ test kiểm thử chất lượng và tính đúng đắn (198+ test cases qua 4 Tiers):
```bash
npm test
```

- **Tier 1 (Core Features)**: Kiểm tra 7 tính năng chính.
- **Tier 2 (Boundaries & Edge Cases)**: Kiểm tra các trường hợp biên, số âm, ký tự đặc biệt, token hết hạn.
- **Tier 3 (Pairwise Workflows)**: Kiểm tra tương tác chéo giữa Cài đặt -> Hóa đơn -> Phòng -> Dashboard.
- **Tier 4 (Quarterly Lifecycle)**: Mô phỏng vận hành thực tế 10 phòng qua 3 tháng liên tiếp.

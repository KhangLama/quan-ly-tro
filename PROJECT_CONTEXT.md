# TÀI LIỆU TOÀN DIỆN DỰ ÁN QUẢN LÝ NHÀ TRỌ (PROJECT CONTEXT & HANDOVER)

> **Dành cho các AI Agents & Đội ngũ Kỹ sư tiếp quản phát triển**  
> Tài liệu này đóng vai trò là **Single Source of Truth** (Nguồn thông tin duy nhất) tổng hợp toàn bộ kiến trúc, dữ liệu, logic nghiệp vụ, các tình huống biên (edge cases) và quy ước phát triển của dự án. Đọc kỹ tài liệu này trước khi thực hiện bất kỳ chỉnh sửa code nào.

---

## 1. TỔNG QUAN DỰ ÁN (EXECUTIVE SUMMARY)

- **Tên dự án:** Web App Quản Lý Nhà Trọ (`quan-ly-tro`)
- **Mục tiêu:** Hệ thống web quản lý vận hành nhà trọ toàn diện, tối ưu hoá trải nghiệm di động (Mobile-first, 375px+), giúp chủ trọ thực hiện mọi thao tác hàng ngày: chốt điện nước, tính tiền tự động, tạo biên lai hình ảnh có mã VietQR gửi qua Zalo, theo dõi doanh thu & chi phí thực tế, quản lý khách thuê/khách cọc và soạn thảo hợp đồng thuê trọ.
- **Môi trường Live:** `https://quan-ly-tro.vercel.app`
- **Môi trường lưu trữ mã nguồn:** GitHub repository (`KhangLama/quan-ly-tro`), triển khai tự động qua Vercel (CI/CD khi push vào nhánh `main`).

---

## 2. KIẾN TRÚC & CÔNG NGHỆ (TECH STACK)

| Thành phần | Công nghệ / Thư viện | Ghi chú |
|---|---|---|
| **Framework** | Next.js 14.2+ (App Router) | Server Components kết hợp Client Components (`"use client"`), Server Actions (`src/actions/*`), API Routes |
| **Ngôn ngữ** | TypeScript 5.7+ | Strict mode, toàn bộ type đồng bộ với Database schema |
| **Giao diện (UI/UX)** | Tailwind CSS 3.4+, Lucide React | Thiết kế Mobile-first responsive, Glassmorphism nhẹ, tone màu Slate/Blue/Emerald, font sans chuẩn tiếng Việt |
| **Cơ sở dữ liệu** | Supabase (PostgreSQL 15+) | 6 bảng chính, Row Level Security (RLS), Cascade constraints |
| **Supabase Client** | `@supabase/ssr`, `@supabase/supabase-js` | Kết nối Server-side và Client-side an toàn qua cookies |
| **Xử lý đồ hoạ / Ảnh** | `html-to-image` | Render thẻ biên lai thanh toán chất lượng cao (Retina 2x, không vỡ nét khi zoom) |
| **Thanh toán** | VietQR API (Napas 247) + Internal Proxy | Tạo mã QR động chuẩn Napas, hỗ trợ tách 2 tài khoản (Phòng & Điện nước), cơ chế `/api/qr` chặn lỗi CORS |
| **Xác thực (Auth)** | Single Admin Password + HMAC-SHA256 | Đăng nhập mật khẩu quản trị duy nhất, session mã hóa trong `httpOnly` secure cookie, bảo vệ qua Next.js Middleware |

---

## 3. CẤU TRÚC THƯ MỤC CODEBASE

```tree
quan-ly-tro/
├── src/
│   ├── actions/                   # Next.js Server Actions (xử lý CRUD nghiệp vụ)
│   │   ├── auth.ts                # Đăng nhập / đăng xuất admin
│   │   ├── contracts.ts           # Quản lý lưu trữ & lịch sử hợp đồng
│   │   ├── dashboard.ts           # Thống kê KPI doanh thu, dòng tiền theo tháng
│   │   ├── expenses.ts            # Quản lý các khoản chi phí vận hành
│   │   ├── invoices.ts            # Tạo, sửa, chuyển trạng thái hóa đơn
│   │   ├── rooms.ts               # Quản lý danh sách phòng, nội thất, ghi chú
│   │   ├── settings.ts            # Cài đặt giá điện/nước/dịch vụ, tài khoản ngân hàng
│   │   └── tenants.ts             # Quản lý khách thuê, khách cọc, chuyển đi
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/login/          # Trang đăng nhập quản trị
│   │   ├── (main)/                # Nhóm route được bảo vệ bởi middleware
│   │   │   ├── page.tsx           # Trang chủ (Dashboard KPI, danh sách phòng)
│   │   │   ├── rooms/             # Danh sách & chi tiết phòng (/rooms/[id])
│   │   │   ├── invoices/new/      # Màn hình chốt số & tính tiền phòng
│   │   │   ├── expenses/          # Màn hình quản lý chi phí vận hành
│   │   │   └── settings/          # Cài đặt đơn giá & tài khoản thanh toán
│   │   ├── api/
│   │   │   ├── auth/              # API đăng nhập/đăng xuất
│   │   │   └── qr/route.ts        # Same-origin proxy tải mã VietQR chống CORS
│   │   ├── globals.css            # Styles toàn cục Tailwind & fonts
│   │   ├── layout.tsx             # Root layout
│   │   └── middleware.ts          # Edge middleware kiểm tra auth session
│   ├── components/                # UI Components chia theo chức năng
│   │   ├── dashboard/             # MonthSelector, RevenueSummary, RoomStatusGrid
│   │   ├── expenses/              # ExpenseList, AddExpenseModal, EditExpenseModal
│   │   ├── invoices/              # InvoiceCalculator, ReceiptCanvas, ReceiptModal
│   │   ├── layout/                # Header, BottomNav (điều hướng di động)
│   │   ├── rooms/                 # RoomContractModal, TenantCard, RoomNoteCard...
│   │   ├── settings/              # SettingsForm
│   │   └── ui/                    # Button, Input, Modal, Toast, Badge, Card...
│   ├── lib/                       # Helpers & Utilities
│   │   ├── auth/                  # HMAC session hashing & cookies
│   │   ├── calculations/          # Logic tính hóa đơn, số điện/nước lũy tiến
│   │   ├── constants/             # Danh sách ngân hàng Việt Nam, danh mục nội thất
│   │   ├── supabase/              # Client & Server Supabase factory
│   │   ├── utils.ts               # Định dạng tiền tệ VND, ngày tháng tiếng Việt
│   │   ├── vietqr.ts              # Xử lý URL VietQR, cấu hình 1 hoặc 2 tài khoản
│   │   └── zalo/template.ts       # Định dạng tin nhắn gửi Zalo/SMS cho khách
│   └── types/                     # TypeScript definitions
│       ├── database.ts            # Type ánh xạ 1:1 từ Supabase PostgreSQL
│       └── index.ts               # Extended UI domain types
├── supabase/
│   └── migrations/                # Lịch sử các migration SQL đã chạy
├── PROJECT_CONTEXT.md             # File tài liệu context này
└── package.json
```

---

## 4. MÔ HÌNH DỮ LIỆU (DATABASE SCHEMA)

Cơ sở dữ liệu gồm 6 bảng chính trong schema `public`:

### 4.1. Bảng `settings` (Cấu hình đơn giá & thanh toán)
- `id` (int, PK, mặc định = 1): Singleton row.
- `electric_price` (numeric): Đơn giá điện (đ/kWh).
- `water_price` (numeric): Đơn giá nước (đ/m³ hoặc đ/người).
- `service_price` (numeric): Đơn giá dịch vụ cố định (rác, wifi, vệ sinh...).
- `bank_info` (text): Thông tin tài khoản ngân hàng. Hỗ trợ 2 định dạng:
  - Text cổ điển: `MB - 0987654321 - NGUYEN VAN A`
  - JSON hiện đại (tách 2 tài khoản): `{"split":true,"room":{...},"service":{...}}`
- `address` (text): Địa chỉ nhà trọ in trên biên lai.
- `service_description` (text): Diễn giải dịch vụ.
- `receipt_note` (text): Lời nhắn dưới chân biên lai.
- `furniture_catalog` (jsonb/text[]): Danh mục các đồ nội thất mẫu.

### 4.2. Bảng `rooms` (Danh mục phòng trọ)
- `id` (uuid, PK): Mã định danh phòng.
- `code` (varchar, Unique): Tên phòng (ví dụ: `P1`, `P2`, `Phòng 101`...).
- `base_price` (numeric): Giá thuê gốc mỗi tháng.
- `status` (varchar): `'rented'` (đang thuê) hoặc `'empty'` (trống). Tự động cập nhật dựa trên số khách active.
- `note` (text): Ghi chú riêng cho từng phòng (lưu các lưu ý đặc biệt của phòng).
- `furniture` (jsonb/text[]): Danh sách nội thất bàn giao riêng cho phòng này.
- `custom_fees` (jsonb): Danh sách các khoản phụ phí định kỳ riêng của phòng (mục 4).

### 4.3. Bảng `tenants` (Khách thuê phòng)
- `id` (uuid, PK): Mã khách.
- `room_id` (uuid, FK -> `rooms.id` ON DELETE CASCADE).
- `name` (varchar): Họ tên khách thuê.
- `phone` (varchar, Nullable): Số điện thoại (dùng tạo link mở chat Zalo).
- `cccd` (varchar, Nullable): Số căn cước công dân.
- `is_lead` (boolean): `true` nếu là người đại diện hợp đồng / trưởng phòng.
- `start_date` (date): Ngày bắt đầu vào ở hoặc ngày đặt cọc.
- `end_date` (date, Nullable): Ngày dọn đi (nếu đã chuyển đi).
- `deposit_amount` (numeric): Số tiền cọc phòng.
- `status` (varchar): `'active'` (đang ở) hoặc `'moved_out'` (đã chuyển đi).
- `deposit_only` (boolean, Nullable): `true` nếu khách **chỉ mới đặt cọc giữ chỗ** nhưng chưa vào ở, hoặc đã cọc nhưng hủy không vào ở. (Cực kỳ quan trọng để không tính nhầm khách vào số người đang ở trong các tháng trước ngày vào ở).

### 4.4. Bảng `invoices` (Hóa đơn tiền phòng hàng tháng)
- `id` (uuid, PK).
- `room_id` (uuid, FK -> `rooms.id` ON DELETE CASCADE).
- `month` (varchar(7), ví dụ: `'2026-09'`): Tháng xuất hóa đơn.
- `old_electric`, `new_electric` (numeric): Chỉ số điện cũ và mới.
- `old_water`, `new_water` (numeric): Chỉ số nước cũ và mới.
- `base_price` (numeric): Giá phòng tính trong hóa đơn (đã tính ngày lẻ nếu có).
- `electric_price`, `water_price`, `service_price` (numeric): Snapshot đơn giá tại thời điểm chốt.
- `discount` (numeric): Số tiền miễn giảm / trừ bớt.
- `discount_reason` (text): Lý do giảm trừ.
- `custom_fees` (jsonb): Danh sách các phí phụ phát sinh trong tháng: `[{ name, unitPrice, quantity }]`.
- `total_amount` (numeric): Tổng tiền cần thanh toán.
- `status` (varchar): `'pending'` (chưa thu) hoặc `'paid'` (đã thu).
- `paid_at` (timestamptz, Nullable): Thời điểm khách hoàn tất thanh toán.
- `paid_amount` (numeric, Nullable): Số tiền khách đã thanh toán thực tế (hỗ trợ thanh toán từng phần).
- `note` (text): Ghi chú riêng trên hóa đơn.
- *Ràng buộc:* `UNIQUE(room_id, month)` — Mỗi phòng chỉ có 1 hóa đơn cho mỗi tháng.

### 4.5. Bảng `expenses` (Chi phí vận hành nhà trọ)
- `id` (uuid, PK).
- `month` (varchar(7)): Tháng ghi nhận chi phí.
- `date` (date): Ngày phát sinh chi.
- `item_name` (varchar): Tên khoản chi (ví dụ: Sửa máy lạnh, tiền mạng, dọn vệ sinh...).
- `category` (varchar): Nhóm chi phí (`sửa chữa`, `tiện ích`, `quản lý`, `khác`).
- `unit_price`, `quantity`, `total_amount` (numeric): Đơn giá, số lượng, tổng tiền.
- `status` (varchar): `'pending'` hoặc `'paid'`.
- `notes` (text): Ghi chú bổ sung.

### 4.6. Bảng `contracts` (Hợp đồng thuê phòng)
- `id` (uuid, PK).
- `room_id` (uuid, FK -> `rooms.id` ON DELETE CASCADE).
- `tenant_id` (uuid, FK -> `tenants.id`, Nullable).
- `tenant_name` (varchar): Tên người thuê đại diện.
- `title` (varchar): Tiêu đề hợp đồng (ví dụ: `Hợp đồng thuê phòng P1 - Nguyễn Văn A`).
- `html_content` (text): Toàn bộ mã HTML của hợp đồng đã qua chỉnh sửa cá nhân hoá.
- `form_data` (jsonb): Dữ liệu các trường thông tin khi tạo (ngày bắt đầu, thời hạn, tiền cọc...).
- `status` (varchar): `'draft'` hoặc `'signed'`.
- `created_at`, `updated_at` (timestamptz): Dùng theo dõi lịch sử các đời hợp đồng của phòng.

---

## 5. LOGIC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS LOGIC)

### 5.1. Dashboard & Thống kê Tài chính
- **Tháng hiển thị:** Dashboard cho phép xem dữ liệu lịch sử lùi tháng qua component `MonthSelector`. Khi xem tháng `YYYY-MM`:
  - Trạng thái phòng (ai đang ở, số người ở) được truy vấn theo thời gian của tháng đó chứ không lấy theo thời gian thực tại.
- **Công thức tính KPI Doanh thu:**
  - **Tổng dự thu:** Tổng `total_amount` của tất cả hóa đơn đã tạo trong tháng. (Không phụ thuộc vào trạng thái đã thu hay chưa thu).
  - **Đã thu:** Tổng tiền của các hóa đơn có `status = 'paid'` (hoặc `paid_amount`).
  - **Chưa thu:** Tổng tiền của các hóa đơn có `status = 'pending'` (`Chưa thu = Tổng dự thu - Đã thu`).
  - **Tổng chi:** Tổng `total_amount` từ bảng `expenses` trong tháng.
  - **Dòng tiền thực tế:** `Đã thu - Đã chi` (phản ánh số tiền mặt thực tế chủ trọ đang cầm).
  - **Tỷ lệ lấp đầy:** Số phòng có khách ở trong tháng / Tổng số phòng.

### 5.2. Quản lý Khách ở, Khách cọc & Lịch sử chuyển đi
- **Khách chỉ cọc (`deposit_only = true`):**
  - Khi khách đặt cọc trước (ví dụ đặt cọc tháng 8 nhưng tháng 9 mới vào ở, hoặc cọc nhưng sau đó hủy phòng): Cờ `deposit_only` được bật.
  - Hệ thống **loại trừ** khách này khỏi số lượng người ở của phòng trong các tháng trước `start_date`, tránh hiển thị sai số lượng người thực tế.
- **Lịch sử khách chuyển đi (`status = 'moved_out'`):**
  - Khi khách chuyển đi, họ được lưu vào lịch sử của phòng.
  - Cung cấp tính năng **xem, chỉnh sửa thông tin ngày tháng, và xóa lịch sử chuyển đi** để chủ nhà có thể đính chính trong trường hợp nhập nhầm thao tác.
  - Đảm bảo khi 1 phòng chỉ có 1 người ở hiện tại và 1 người cũ đã chuyển đi, UI không bị lỗi hiển thị số người ảo `+1`.

### 5.3. Tạo hóa đơn & Chốt điện nước (`/invoices/new`)
- Khi chọn phòng và tháng: hệ thống tự động tìm hóa đơn tháng liền trước để lấy `new_electric` và `new_water` làm `old_electric` và `old_water` của tháng này.
- Tiền điện = `max(0, new_electric - old_electric) * electric_price`.
- Tiền nước = `max(0, new_water - old_water) * water_price`.
- Phụ phí mục 4 (`custom_fees`): Cho phép thêm nhiều dòng chi phí tùy chọn (nhập tên khoản, đơn giá, số lượng).
- Giảm trừ (`discount`): Cho phép trừ tiền phòng kèm lý do cụ thể.
- Hỗ trợ tính tiền phòng theo ngày lẻ (prorated rent) khi khách vào giữa tháng.

### 5.4. Biên lai thanh toán & Xử lý VietQR chống CORS
- **Chế độ 2 tài khoản thanh toán (Dual Account Split Payment):**
  - Cho phép tách riêng:
    1. **Tài khoản tiền phòng** (thường là STK của Chủ nhà).
    2. **Tài khoản tiền điện & nước + dịch vụ** (thường là STK của Quản lý / Ban quản trị).
  - Hoặc dùng chế độ **1 tài khoản nhận chung** (Single QR).
- **Thiết kế chống quét nhầm camera (Anti-Scan Collision):**
  - 2 mã QR trên phiếu thu được đặt so-le theo chiều dọc: Vé Bước 1 (Xanh dương - Tiền phòng) ở trên, dải ngăn cách và Vé Bước 2 (Cam hổ phách - Tiền điện nước) ở dưới.
  - Khách kéo màn hình đến đâu chỉ nhìn thấy 1 mã QR đến đó, tránh việc camera ngân hàng tự động nhận diện nhầm mã QR thứ hai.
- **Giải quyết triệt để lỗi CORS của VietQR:**
  - *Vấn đề đã xảy ra:* Máy chủ `img.vietqr.io` đổi hành vi, khi gọi URL `.png` sẽ trả về `301 Moved Permanently` chuyển hướng sang `.svg`. Phản hồi 301 này thiếu header CORS `Access-Control-Allow-Origin`, dẫn đến việc trình duyệt chặn đứng request do `html-to-image` yêu cầu `crossOrigin="anonymous"`.
  - *Giải pháp triệt để:*
    1. Tạo route proxy nội bộ: [`src/app/api/qr/route.ts`](file:///Users/khang/Documents/antigravity/quan-ly-tro/src/app/api/qr/route.ts). Trình duyệt gọi `/api/qr?...` (Same-Origin 100% không bị CORS).
    2. Server Next.js fetch từ VietQR với định dạng `.svg` trực tiếp, cache 24h và trả về header CORS `*`.
    3. Thẻ `<img>` trong `ReceiptCanvas.tsx` có sẵn handler `onError` fallback về SVG trực tiếp nếu server gặp timeout.
- **Xuất ảnh Retina:**
  - Sử dụng `html-to-image` xuất ảnh `pixelRatio: 2` (Retina 2x) đảm bảo khi copy vào Zalo hoặc tải về máy chữ và mã QR luôn sắc nét, không bị nhòe vỡ hay cắt xén.

### 5.5. Quản lý Hợp đồng thuê phòng
- Tích hợp sẵn mẫu hợp đồng thuê nhà trọ chuẩn pháp lý Việt Nam tại `RoomContractModal.tsx`.
- Cho phép điền các trường dữ liệu tự động từ thông tin phòng và khách đại diện.
- **Khả năng chỉnh sửa trực tiếp (Inline Editing):** Người dùng có thể click chuột sửa trực tiếp nội dung văn bản ngay trên bản Preview (dùng `contentEditable`) để tùy biến các điều khoản riêng trước khi in hoặc lưu.
- Hợp đồng được lưu trữ vào bảng `contracts` theo từng phòng, có quản lý lịch sử để tra cứu lại các đời hợp đồng cũ.

---

## 6. HƯỚNG DẪN CÀI ĐẶT & CHẠY LOCAL (DEVELOPMENT SETUP)

### 6.1. Yêu cầu môi trường
- Node.js: Phiên bản 18.x trở lên (khuyên dùng Node 20+ LTS).
- Quản lý gói: `npm` (hoặc `pnpm`).

### 6.2. Cấu hình biến môi trường (`.env.local`)
Tạo file `.env.local` tại thư mục gốc với các biến sau:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Admin Authentication
ADMIN_PASSWORD=your_admin_secret_password
AUTH_SECRET=a_random_32_character_string_for_hmac_signing

# App URL (Tùy chọn cho production)
NEXT_PUBLIC_APP_URL=https://quan-ly-tro.vercel.app
```

### 6.3. Cài đặt & Khởi động
```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy dev server
npm run dev
# Mở trình duyệt tại http://localhost:3000

# 3. Kiểm tra build production
npm run build

# 4. Kiểm tra Lint
npm run lint
```

---

## 7. QUY ƯỚC LÀM VIỆC DÀNH CHO AI AGENTS & DEVELOPERS

Khi tiếp nhận phát triển tính năng mới hoặc sửa lỗi trong dự án này, **BẮT BUỘC** tuân thủ các nguyên tắc sau:

1. **Bảo tồn tính toàn vẹn của nghiệp vụ tài chính:**
   - Khi sửa đổi logic doanh thu hay hóa đơn, phải đảm bảo tính đồng bộ giữa KPI trên Dashboard và trạng thái hiển thị của từng thẻ phòng.
   - Luôn sử dụng hàm làm tròn số nguyên cho tiền tệ VND (`Math.round`) và không dùng số thập phân.
2. **Không phá vỡ chức năng xuất ảnh Biên lai (`ReceiptCanvas.tsx`):**
   - Mọi ảnh hiển thị trong thẻ biên lai (như mã QR) **phải đi qua proxy `/api/qr`** và giữ nguyên `crossOrigin="anonymous"`. Không được gọi trực tiếp URL ảnh từ domain bên ngoài mà không có proxy, vì sẽ làm "taint" canvas và làm hỏng tính năng "Tải ảnh về máy" / "Sao chép ảnh Zalo".
3. **Nguyên tắc giao diện tiếng Việt & Mobile-first:**
   - Toàn bộ giao diện người dùng phải sử dụng tiếng Việt tự nhiên, chuẩn mực, đúng ngữ pháp và không chêm tiếng Anh bừa bãi.
   - Thao tác phải thuận tiện trên màn hình điện thoại (nút bấm to bản tối thiểu 44px, padding hợp lý, modal có thể cuộn mượt).
4. **Cập nhật Database Types:**
   - Nếu có thêm cột hoặc bảng mới trong Supabase, hãy tạo file migration mới trong `supabase/migrations/` và cập nhật tương ứng vào `src/types/database.ts` và `src/types/index.ts`.
5. **Git Workflow:**
   - Nhánh chính là `main`. Mỗi commit phải có message rõ ràng theo chuẩn Conventional Commits (ví dụ: `feat(...)`, `fix(...)`, `refactor(...)`). Push vào `main` sẽ kích hoạt Vercel tự động build và deploy lên production.

---
*Tài liệu được cập nhật tự động vào tháng 11/2026 bởi Antigravity AI Assistant.*

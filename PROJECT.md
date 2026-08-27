# Project: Web App Quản Lý Nhà Trọ

## Architecture
- **Framework**: Next.js 14+ (App Router), React 18/19, TypeScript (strict mode)
- **Styling & UX**: Tailwind CSS, Mobile-first responsive layout (optimized for 375px+ viewports), Lucide React icons, Vietnamese localization.
- **Backend & Database**: Supabase (PostgreSQL) with 4 core tables (`settings`, `rooms`, `tenants`, `invoices`), RLS policies, foreign keys with cascade constraints, and default singleton row in settings.
- **Authentication**: Password-protected single-admin auth via `ADMIN_PASSWORD` environment variable, HMAC-SHA256 session token stored in `httpOnly` secure cookie, and Next.js Edge Middleware route guard.
- **Business Logic**: Realtime meter calculation, previous-month reading auto-lookup, and 1-tap Vietnamese Zalo/SMS clipboard message copy.
- **Testing Architecture**: Vitest for fast unit & integration tests, Playwright / Component tests for mobile 375px E2E workflows across 4 tiers (Feature, Boundary, Pairwise, Real-World Lifecycle).

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---|---|---|---|
| F01 | Settings Table | Singleton database table for utility rates & banking info with default seed row | M1 | R1, Acceptance Criteria |
| F02 | Rooms Table | Master table for rental rooms (code, base price, status) | M1 | R1 |
| F03 | Tenants Table | Resident records linked to rooms (name, phone, CCCD, is_lead, deposit, dates, status) | M1 | R1, R3 |
| F04 | Invoices Table | Monthly billing statements per room (readings, rate snapshots, sub-totals, status) | M1 | R1, R2 |
| F05 | RLS Security Policies | Row Level Security enabled on all 4 tables with baseline policies | M1 | R1 |
| F06 | Password Login Screen | Dedicated `/login` page verifying submitted password against `ADMIN_PASSWORD` | M2 | R4, Acceptance Criteria |
| F07 | Middleware Route Guard | Next.js Middleware protecting all private routes (`/`, `/invoices/*`, `/rooms/*`, `/settings`) | M2 | R4 |
| F08 | Session & Logout Action | HMAC-SHA256 session cookie generator and logout endpoint | M2 | R4 |
| F09 | Mobile App Shell & Nav | Responsive 375px+ header and sticky bottom navigation bar in Vietnamese | M2 | R3 |
| F10 | Dashboard KPI Stats | Overview summary cards on `/` (Total revenue, Collected, Pending, Occupancy) | M3 | R3 |
| F11 | Dashboard Rooms Grid | Room cards grid with status badges ('Đã thu' / 'Chưa thu' / 'Trống') and quick navigation | M3 | R3 |
| F12 | Dashboard Month Selector | Ability to toggle viewing month on Dashboard | M3 | R3 |
| F13 | Room Details Header | Room code, monthly base rent, and status badge on `/rooms/[id]` | M3 | R3 |
| F14 | Active Tenants List | List of current residents with contact details, CCCD, and lead tenant badge | M3 | R3 |
| F15 | Add Tenant Modal | Modal form to register new tenant / roommate into a room | M3 | R3 |
| F16 | Mark Tenant Moved Out | Action button to mark tenant departure and record check-out date | M3 | R3 |
| F17 | Room Vacancy Auto-Sync | Automatic synchronization of room status ('rented' vs 'empty') based on active tenants | M3 | R3 |
| F18 | Tenant History Section | Archive list of former residents for a room | M3 | R3 |
| F19 | Room Invoices History | Historical list of billing statements for a specific room | M3 | R3 |
| F20 | Invoice Room & Month Picker | Room dropdown and month selector on `/invoices/new` | M4 | R2, R3 |
| F21 | Previous Reading Auto-Fill | Auto-fetch latest invoice readings for selected room to populate old meters | M4 | R2, Acceptance Criteria |
| F22 | Realtime Cost Calculation | Realtime calculation and live breakdown card of electricity, water, and grand total | M4 | R2, Acceptance Criteria |
| F23 | Save Invoice Action | Persist monthly invoice to Supabase database | M4 | R2, Acceptance Criteria |
| F24 | Zalo Message Copy | Format standard Vietnamese billing text and copy to clipboard with toast notification | M4 | R2, Acceptance Criteria |
| F25 | Invoice Payment Toggle | Toggle invoice payment status between 'pending' and 'paid' | M4 | R1, R3 |
| F26 | Settings Rate Editor | Form to configure electric, water, service rates and bank account details on `/settings` | M5 | R3 |
| F27 | Developer Experience & Docs | `.env.example`, `package.json` scripts, `vitest.config.ts`, and comprehensive `README.md` | M5 | R5, Acceptance Criteria |
| F28 | 100% E2E Pass & Hardening | Full 4-Tier E2E test suite execution + Tier 5 adversarial hardening | M6 | Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| M1 | Database & Base Setup | SQL migration with 4 tables, RLS, default settings seed; Next.js + TS + Tailwind config; Supabase client/server lib; TypeScript domain types. | none | DONE |
| M2 | Auth & Mobile Shell | Web Crypto HMAC session helper, Next.js Middleware route guard, `/login` page with error states, responsive Mobile Shell (Header, BottomNav, Toast). | M1 | DONE |
| M3 | Dashboard & Room Management | `/` Dashboard with KPI cards & Room status grid; `/rooms/[id]` with active tenants, add tenant modal, move-out action, tenant history, vacancy sync. | M2 | PLANNED |
| M4 | Invoices & Business Logic | `/invoices/new` with previous reading auto-fill, realtime calculation, invoice save, payment status toggle, and 1-tap Zalo copy button. | M2, M3 | PLANNED |
| M5 | Settings & Documentation | `/settings` rates & bank info editor; `.env.example`; `README.md` with complete setup instructions; `package.json` standard scripts. | M4 | PLANNED |
| M6 | E2E Testing & Final Gate | E2E Test Suite verification (Tiers 1-4 pass 100%), Tier 5 adversarial hardening, clean build & lint check, forensic audit. | M1, M2, M3, M4, M5, E2E Track | PLANNED |

---

## Interface Contracts

### 1. Database Schema Contract
- `settings`: `(id INT PRIMARY KEY DEFAULT 1, electric_price NUMERIC, water_price NUMERIC, service_price NUMERIC, bank_info TEXT, updated_at TIMESTAMPTZ)`
- `rooms`: `(id UUID PRIMARY KEY, code VARCHAR UNIQUE, base_price NUMERIC, status VARCHAR CHECK (status IN ('rented', 'empty')), created_at TIMESTAMPTZ)`
- `tenants`: `(id UUID PRIMARY KEY, room_id UUID REFERENCES rooms(id) ON DELETE CASCADE, name VARCHAR, phone VARCHAR, cccd VARCHAR, is_lead BOOLEAN, start_date DATE, end_date DATE, deposit_amount NUMERIC, status VARCHAR CHECK (status IN ('active', 'moved_out')), created_at TIMESTAMPTZ)`
- `invoices`: `(id UUID PRIMARY KEY, room_id UUID REFERENCES rooms(id) ON DELETE CASCADE, month VARCHAR(7), old_electric NUMERIC, new_electric NUMERIC, old_water NUMERIC, new_water NUMERIC, base_price NUMERIC, electric_price NUMERIC, water_price NUMERIC, service_price NUMERIC, total_amount NUMERIC, status VARCHAR CHECK (status IN ('pending', 'paid')), paid_at TIMESTAMPTZ, created_at TIMESTAMPTZ, CONSTRAINT uq_room_month UNIQUE(room_id, month))`

### 2. Business Logic Calculations (`src/lib/calculations/invoice.ts`)
```typescript
export interface CalculationInput {
  basePrice: number;
  oldElectric: number;
  newElectric: number;
  oldWater: number;
  newWater: number;
  electricPrice: number;
  waterPrice: number;
  servicePrice: number;
}

export interface CalculationResult {
  electricUsage: number;
  waterUsage: number;
  electricCost: number;
  waterCost: number;
  servicePrice: number;
  basePrice: number;
  totalAmount: number;
}

export function calculateInvoice(input: CalculationInput): CalculationResult {
  const electricUsage = Math.max(0, input.newElectric - input.oldElectric);
  const waterUsage = Math.max(0, input.newWater - input.oldWater);
  const electricCost = Math.round(electricUsage * input.electricPrice);
  const waterCost = Math.round(waterUsage * input.waterPrice);
  const servicePrice = Math.round(input.servicePrice);
  const basePrice = Math.round(input.basePrice);
  const totalAmount = basePrice + electricCost + waterCost + servicePrice;

  return {
    electricUsage,
    waterUsage,
    electricCost,
    waterCost,
    servicePrice,
    basePrice,
    totalAmount,
  };
}
```

### 3. Zalo Message Template Contract (`src/lib/zalo/template.ts`)
```typescript
export function buildZaloMessage(params: {
  roomCode: string;
  month: string;
  totalAmount: number;
  electricUsage: number;
  electricCost: number;
  waterUsage: number;
  waterCost: number;
  serviceCost: number;
}): string {
  // Format numbers to Vietnamese dot-separated currency strings (e.g. 3.425.000)
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  return `Phòng ${params.roomCode} - Tiền tháng ${params.month}: Tổng ${fmt(params.totalAmount)}đ (Điện: ${params.electricUsage} số = ${fmt(params.electricCost)}đ | Nước: ${params.waterUsage} m³ = ${fmt(params.waterCost)}đ | Dịch vụ: ${fmt(params.serviceCost)}đ). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!`;
}
```

### 4. Auth & Session Contract (`src/lib/auth/session.ts`)
- Cookie Name: `auth_session`
- Token payload: HMAC-SHA256 signed `<timestamp>.<signature>` with secret derived from `ADMIN_PASSWORD`.
- Middleware: Intercepts all paths except `/login`, `/api/auth/login`, and static assets. Redirects unauthorized requests to `/login`.

---

## Code Layout

```
quan-ly-tro/
├── .env.example
├── .env.local
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── PROJECT.md
├── TEST_INFRA.md
├── TEST_READY.md
├── supabase/
│   └── migrations/
│       └── 20260826000000_init_schema.sql
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── rooms/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── invoices/
│   │   │   │   └── new/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── login/route.ts
│   │   │       └── logout/route.ts
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/ (Button, Input, Select, Badge, Card, Modal, Toast)
│   │   ├── layout/ (Header, BottomNav)
│   │   ├── dashboard/ (RevenueSummary, RoomStatusGrid)
│   │   ├── rooms/ (TenantModal, TenantHistory)
│   │   ├── invoices/ (InvoiceCalculator, ZaloCopyButton)
│   │   └── settings/ (SettingsForm)
│   ├── lib/
│   │   ├── supabase/ (client.ts, server.ts, db-mock.ts)
│   │   ├── auth/ (session.ts, constants.ts)
│   │   ├── calculations/ (invoice.ts, formatters.ts)
│   │   ├── zalo/ (template.ts)
│   │   └── utils.ts
│   ├── types/ (database.ts, index.ts)
│   ├── actions/ (rooms.ts, tenants.ts, invoices.ts, settings.ts)
│   └── middleware.ts
└── tests/
    ├── setup.ts
    ├── fixtures/ (seed-data.ts, mock-supabase.ts)
    ├── unit/ (calculation.test.ts, zalo-template.test.ts, auth-session.test.ts)
    ├── integration/ (invoice-chain.test.ts, route-guard.test.ts)
    └── e2e/ (tier1-features.test.ts, tier2-boundaries.test.ts, tier3-pairwise.test.ts, tier4-lifecycle.test.ts)
```

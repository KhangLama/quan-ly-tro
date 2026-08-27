# Automated Test Suite: Web App Quản Lý Nhà Trọ

## Overview
The automated test suite for **Web App Quản Lý Nhà Trọ** is an opaque-box, requirement-driven testing architecture strictly derived from `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `TEST_INFRA.md`. It provides comprehensive coverage across Unit, Integration, and 4 Tiers of E2E verification without external network or Supabase database dependencies.

---

## Test Execution Commands

| Target | Command | Description |
|---|---|---|
| **All Tests** | `npm test` | Run complete test suite (Unit, Integration, E2E Tiers 1-4) with Vitest |
| **E2E Only** | `npm run test:e2e` | Run E2E test suites (`tests/e2e/**`) |
| **Watch Mode** | `npm run test:watch` | Interactive TDD watch mode |
| **CI Gate** | `npm run test:ci` | Headless single-run test execution for CI/CD |

---

## Test Catalog & Inventory

### 1. Test Setup & Fixtures
- `tests/setup.ts`: Configures global JSDOM environment, mocks clipboard API (`navigator.clipboard.writeText`), and window matchMedia.
- `tests/fixtures/seed-data.ts`: Contains domain types (`SettingRecord`, `RoomRecord`, `TenantRecord`, `InvoiceRecord`), initial 10-room seed dataset (P101-P105, P201-P205), in-memory Supabase PostgREST mock query engine (`MockSupabaseEngine`), calculation oracle, Zalo message template builder, and Web Crypto HMAC session helpers.

### 2. Unit Test Suite (`tests/unit/`)
- `tests/unit/calculation.test.ts` (6 tests):
  - Standard consumption and cost calculations (Electricity: usage × rate, Water: usage × rate, Total: base + electric + water + service).
  - Zero usage handling when `new == old`.
  - Negative consumption clamping (`Math.max(0, new - old)`).
  - Decimal rates and fractional usage rounding (`Math.round`).
  - High enterprise values arithmetic stability without overflow.
  - Property-based subtotal equality verification across 100 randomized inputs.
- `tests/unit/zalo-template.test.ts` (5 tests):
  - Exact verbatim Vietnamese Zalo billing message string match.
  - Dot-separated Vietnamese currency formatting (`3.425.000đ`, `0đ`, `125.678.000đ`).
  - Special Vietnamese room codes (`Tầng Lửng 01`, `VIP-999`).
  - Vietnamese typography and diacritics preservation.
  - Formatting invariance across calendar months.
- `tests/unit/auth-session.test.ts` (7 tests):
  - Web Crypto HMAC-SHA256 token generation and verification.
  - Rejection of tokens signed with mismatched secrets.
  - Tamper detection on payload timestamp modification.
  - Tamper detection on signature bit corruption.
  - Rejection of expired session tokens (> 7 days).
  - Rejection of tokens with future timestamps beyond clock skew threshold.
  - Safe rejection of null, undefined, and malformed strings.

### 3. Integration Test Suite (`tests/integration/`)
- `tests/integration/invoice-chain.test.ts` (4 tests):
  - Null reading handling for newly occupied rooms with no prior invoices.
  - Auto-populating Month 2 old readings from Month 1 new readings.
  - Multi-room isolated reading chains preventing cross-contamination.
  - Proper ordering by month descending to select the latest billing record.

### 4. Tier 1: Core Feature Verification (`tests/e2e/tier1-features.test.ts`)
Total: **35 Tests** (5 tests per feature across 7 features)
- **F1: Auth & Session**: Login password verification, invalid password rejection, route guard redirection to `/login`, authenticated route access, logout session invalidation.
- **F2: Database Schema**: Default settings seed singleton, room uniqueness constraints, tenant foreign keys and lead tenant flags, invoice unique `(room_id, month)` constraint, cascade delete behaviors.
- **F3: Dashboard Financials**: Total revenue aggregation, collected revenue sum, pending revenue sum, occupancy rate calculation (8/10 = 80%), room status grid badge mapping (`Đã thu`, `Chưa thu`, `Trống`).
- **F4: Invoices & Math**: Realtime calculation on input change, saving invoice to database with pending status, payment toggle to paid, usage delta calculation, subtotal equality.
- **F5: Room & Tenant Management**: Active resident retrieval, roommate check-in, tenant departure recording, room occupancy status auto-sync (`empty` $\leftrightarrow$ `rented`), former tenant history archive.
- **F6: Settings Configuration**: Default rates retrieval, electricity rate update, water rate update, service price update, bank info update.
- **F7: Zalo Localization**: Standard message composition, clipboard API writeText invocation, Vietnamese currency dot formatting, payment deadline notice, Vietnamese character support.

### 5. Tier 2: Boundary & Corner Cases (`tests/e2e/tier2-boundaries.test.ts`)
Total: **35 Tests** (5 boundary tests per feature across 7 features)
- **F1: Auth Boundaries**: Blank/whitespace password rejection, 10,000 character buffer overflow safety, exact millisecond expiration boundaries, non-hex signature handling, malicious SQL/Unicode injection payloads.
- **F2: Schema Boundaries**: Zero room base price, 100 billion VND currency range, non-existent record queries returning `PGRST116`, deleting non-existent IDs, special character room codes.
- **F3: Dashboard Boundaries**: Empty month with 0 invoices, 100% full occupancy (10/10), 0% occupancy (0/10), 100% paid invoices, 100% pending invoices.
- **F4: Calculation Boundaries**: Zero electric & water usage, negative delta input handling, fractional/decimal meters (0.5 kWh, 0.25 m³), high meter numbers approaching 1,000,000, zero rent & service fee edge cases.
- **F5: Room & Resident Boundaries**: Empty room queries, large shared room capacity (5+ roommates), special characters/hyphens in tenant names, same-day check-in & check-out, zero deposit amount.
- **F6: Settings Boundaries**: Zero utility rates, high rate values (50,000 VND/kWh), empty bank info string, multi-line payment notes, decimal rate values.
- **F7: Zalo Copy Boundaries**: 0đ total formatting, billion VND numbers, room codes with punctuation & brackets, 5 consecutive rapid clipboard clicks, all 12 calendar months (`2026-01` to `2026-12`).

### 6. Tier 3: Pairwise Combinatorial Tests (`tests/e2e/tier3-pairwise.test.ts`)
Total: **6 Cross-Feature Workflows**
- **Pair 1**: Settings Rate Revision $\to$ Invoice Calculation
- **Pair 2**: Tenant Check-in $\to$ Room Status Sync $\to$ Invoice Creation
- **Pair 3**: 3-Month Invoice Meter Chaining $\to$ Zalo Text Generation
- **Pair 4**: Invoice Payment Toggle $\to$ Dashboard KPI Updates
- **Pair 5**: Tenant Move-Out $\to$ Historical Data Preservation $\to$ Room Status Sync
- **Pair 6**: Service Price Revision $\to$ Historical Invoices Rate Snapshot Invariance

### 7. Tier 4: Real-World Lifecycle Simulation (`tests/e2e/tier4-lifecycle.test.ts`)
Total: **1 Comprehensive Scenario**
- **Scope**: 10 rooms (P101-P105, P201-P205) across 3 full months (August, September, October 2026).
- **Events & Transitions**:
  - *Month 1 (August 2026)*: Initial 8 rented rooms, 2 empty. Manual initial meter readings, 8 invoices generated (6 paid, 2 pending), financial rollup, Zalo message verification.
  - *Month 2 (September 2026)*: New tenant in P105 (occupancy reaches 90%), roommate added in P202, electricity rate revised in Settings (3500 $\to$ 3800), sequential auto-fill applied to 9 rooms, 8 paid / 1 pending.
  - *Month 3 (October 2026)*: Tenant in P201 moves out (room marked empty), new tenant moves into P205 (room marked rented), 9 October invoices created and fully settled (100% paid).
  - *Quarterly Reconciliation*: Audit of 26 total invoices, rate snapshot invariance verified (August invoices hold 3500 rate, September/October hold 3800 rate), gross revenue > 80,000,000 VND, tenant history archives verified.

---

## Coverage Summary Checklist

- [x] All 7 core requirements from `ORIGINAL_REQUEST.md` covered.
- [x] All 4 Tiers implemented and structured.
- [x] Tier 1: 35 tests ($\ge 5$ per feature).
- [x] Tier 2: 35 tests ($\ge 5$ per feature).
- [x] Tier 3: 6 pairwise workflows.
- [x] Tier 4: 10-room 3-month quarterly lifecycle simulation.
- [x] Unit & Integration suites: 22 tests (Math, Zalo, Auth, Chaining).
- [x] **Total Automated Test Count: 99 Tests**.
- [x] 100% deterministic, zero network latency, instant execution.

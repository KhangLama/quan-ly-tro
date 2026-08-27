# E2E Test Infra: Web App Quản Lý Nhà Trọ

## Test Philosophy
- Opaque-box, requirement-driven testing based strictly on `ORIGINAL_REQUEST.md`.
- No coupling to internal implementation details; exercises public endpoints, UI screens, database states, and business logic.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing.

---

## Feature Inventory & Test Coverage Mapping

| # | Feature | Source (Requirement) | Tier 1 (Count) | Tier 2 (Count) | Tier 3 (Pairwise) | Tier 4 (Lifecycle) |
|---|---|---|:---:|:---:|:---:|:---:|
| F1 | Auth & Session Middleware | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| F2 | Database Schema & Migration | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F3 | Dashboard Financials & Grid | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F4 | Invoices & Realtime Math | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F5 | Room & Tenant Management | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| F6 | Settings & Rate Configuration | ORIGINAL_REQUEST §R1, R3 | 5 | 5 | ✓ | ✓ |
| F7 | Zalo Copy & Vietnamese Localization | ORIGINAL_REQUEST §R2, R3 | 5 | 5 | ✓ | ✓ |
| **Total** | | | **35** | **35** | **6 pairs** | **1 scenario (10 rooms, 3 mo)** |

---

## Test Architecture

### 1. Test Runners & Commands
- **Unit & Integration Suite**: Vitest (`npm run test`)
- **E2E & Component Workflow Suite**: Vitest / Playwright (`npm run test:e2e` or `npm run test`)
- **Full CI Suite**: `npm run test:ci` (`npm run lint && npm run test && npm run build`)

### 2. Test Case Layout
- `tests/unit/`:
  - `calculation.test.ts` (Electricity, water, total calculations, math rounding)
  - `zalo-template.test.ts` (Vietnamese Zalo template formatting & currency string formatting)
  - `auth-session.test.ts` (HMAC token signing, tampering verification, expiration)
- `tests/integration/`:
  - `invoice-chain.test.ts` (Auto-filling previous month readings across consecutive months)
  - `room-occupancy.test.ts` (Auto-syncing room status 'rented' vs 'empty' based on tenant move-ins/outs)
- `tests/e2e/`:
  - `tier1-features.test.ts` (35+ tests verifying core features in isolation)
  - `tier2-boundaries.test.ts` (35+ boundary, corner, and extreme input tests)
  - `tier3-pairwise.test.ts` (6 pairwise cross-feature workflow combinations)
  - `tier4-lifecycle.test.ts` (10 rooms across 3 months complete lifecycle scenario)

---

## Real-World Application Scenario (Tier 4)
- **Scale**: 10 rooms (P101-P105 on floor 1, P201-P205 on floor 2).
- **Timeline**: 3 months (August 2026, September 2026, October 2026).
- **Dynamic Events**:
  - Month 1: 8 rented rooms, 2 empty. Initial meter readings, invoice generation, partial payment settlement.
  - Month 2: New tenant check-in to P105, roommate addition to P202, electric rate increase in Settings, sequential auto-fill verification.
  - Month 3: Tenant checkout from P201 (room becomes empty), new tenant in P205, full invoice calculation, settlement of all bills, financial rollup.

---

## Coverage Thresholds
- **Tier 1**: $\ge 5$ test cases per feature (Total $\ge 35$).
- **Tier 2**: $\ge 5$ boundary/corner cases per feature (Total $\ge 35$).
- **Tier 3**: $\ge 6$ pairwise combinations covering all cross-module interactions.
- **Tier 4**: $\ge 1$ full real-world multi-room quarterly lifecycle simulation.
- **Target**: 100% test pass rate with exit code 0.

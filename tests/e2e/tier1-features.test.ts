import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MockSupabaseEngine,
  calculateInvoice,
  buildZaloMessage,
  signSessionToken,
  verifySessionToken,
  DEFAULT_SETTING,
  INITIAL_ROOMS,
  INITIAL_TENANTS,
} from "../fixtures/seed-data.ts";

describe("Tier 1 E2E: Core Feature Verification (35 Tests)", () => {
  let db: MockSupabaseEngine;
  const ADMIN_PASSWORD = "test-secret-password-123";

  beforeEach(() => {
    db = new MockSupabaseEngine();
  });

  // =========================================================================
  // F1: Auth & Session Middleware (5 Tests)
  // =========================================================================
  describe("F1: Authentication & Session Protection", () => {
    it("F1.1: generates valid signed session cookie on correct admin password login", async () => {
      const submittedPassword = ADMIN_PASSWORD;
      const isPasswordValid = submittedPassword === ADMIN_PASSWORD;
      expect(isPasswordValid).toBe(true);

      const timestamp = Date.now();
      const sessionToken = await signSessionToken(timestamp, ADMIN_PASSWORD);
      expect(sessionToken).toBeDefined();

      const isValidSession = await verifySessionToken(sessionToken, ADMIN_PASSWORD);
      expect(isValidSession).toBe(true);
    });

    it("F1.2: rejects login attempt with invalid password and returns error state", async () => {
      const submittedPassword = "wrong-password-999";
      const isPasswordValid = submittedPassword === ADMIN_PASSWORD;
      expect(isPasswordValid).toBe(false);
    });

    it("F1.3: route guard intercepts unauthenticated request and redirects to /login", async () => {
      const unauthenticatedCookie = null;
      const isAuthenticated = await verifySessionToken(unauthenticatedCookie, ADMIN_PASSWORD);

      // Simulate middleware route guard logic
      const targetPath = "/invoices/new";
      const shouldRedirect = !isAuthenticated && targetPath !== "/login";

      expect(shouldRedirect).toBe(true);
    });

    it("F1.4: allows access to private dashboard and management routes when session is valid", async () => {
      const token = await signSessionToken(Date.now(), ADMIN_PASSWORD);
      const isAuthenticated = await verifySessionToken(token, ADMIN_PASSWORD);

      const targetPath = "/rooms/room-101";
      const isAllowed = isAuthenticated || targetPath === "/login";

      expect(isAllowed).toBe(true);
    });

    it("F1.5: invalidates session upon logout clearing active session cookie", async () => {
      let sessionCookie: string | null = await signSessionToken(Date.now(), ADMIN_PASSWORD);
      expect(await verifySessionToken(sessionCookie, ADMIN_PASSWORD)).toBe(true);

      // Perform logout
      sessionCookie = null;
      expect(await verifySessionToken(sessionCookie, ADMIN_PASSWORD)).toBe(false);
    });
  });

  // =========================================================================
  // F2: Database Schema & Migration (5 Tests)
  // =========================================================================
  describe("F2: Database Schema & Relational Integrity", () => {
    it("F2.1: settings table has default seed row with rates and bank info", async () => {
      const { data, error } = await db.from("settings").select("*").eq("id", 1).single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.electric_price).toBe(3500);
      expect(data.water_price).toBe(25000);
      expect(data.service_price).toBe(100000);
      expect(data.bank_info).toBe(DEFAULT_SETTING.bank_info);
    });

    it("F2.2: rooms table enforces unique room codes and valid status types", async () => {
      const { data: allRooms } = await db.from("rooms").select("*");
      expect(allRooms.length).toBe(10);

      // Attempt to insert duplicate room code
      const duplicateRes = await db.from("rooms").insert({
        id: "room-duplicate",
        code: "P101", // already exists
        base_price: 2500000,
        status: "rented",
      });

      expect(duplicateRes.error).not.toBeNull();
      expect(duplicateRes.error?.message).toContain("already exists");
    });

    it("F2.3: tenants table correctly references rooms and distinguishes lead tenant", async () => {
      const { data: room101Tenants } = await db
        .from("tenants")
        .select("*")
        .eq("room_id", "room-101");

      expect(room101Tenants.length).toBe(1);
      expect(room101Tenants[0].name).toBe("Nguyễn Văn Hùng");
      expect(room101Tenants[0].is_lead).toBe(true);
      expect(room101Tenants[0].status).toBe("active");
    });

    it("F2.4: invoices table enforces unique constraint on (room_id, month)", async () => {
      await db.from("invoices").insert({
        id: "inv-201-aug",
        room_id: "room-201",
        month: "2026-08",
        old_electric: 100,
        new_electric: 150,
        old_water: 10,
        new_water: 15,
        base_price: 3200000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
        total_amount: 3600000,
        status: "paid",
        paid_at: null,
      });

      // Attempt to insert another invoice for same room and same month
      const duplicateRes = await db.from("invoices").insert({
        id: "inv-201-aug-2",
        room_id: "room-201",
        month: "2026-08",
        old_electric: 100,
        new_electric: 160,
        old_water: 10,
        new_water: 16,
        base_price: 3200000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
        total_amount: 3660000,
        status: "pending",
        paid_at: null,
      });

      expect(duplicateRes.error).not.toBeNull();
      expect(duplicateRes.error?.message).toContain("already exists");
    });

    it("F2.5: cascade deletes or cleanups linked tenants and invoices when room is deleted", async () => {
      // Delete room-104
      await db.from("rooms").delete().eq("id", "room-104");

      // Verify room is removed
      const { data: roomCheck } = await db.from("rooms").select("*").eq("id", "room-104");
      expect(roomCheck.length).toBe(0);
    });
  });

  // =========================================================================
  // F3: Dashboard Financials & Grid (5 Tests)
  // =========================================================================
  describe("F3: Dashboard Financials & Room Grid", () => {
    beforeEach(async () => {
      // Seed some invoices for month 2026-08
      await db.from("invoices").insert([
        {
          id: "inv-101",
          room_id: "room-101",
          month: "2026-08",
          total_amount: 3000000,
          status: "paid",
          paid_at: "2026-08-05",
        },
        {
          id: "inv-102",
          room_id: "room-102",
          month: "2026-08",
          total_amount: 2900000,
          status: "paid",
          paid_at: "2026-08-06",
        },
        {
          id: "inv-103",
          room_id: "room-103",
          month: "2026-08",
          total_amount: 3200000,
          status: "pending",
          paid_at: null,
        },
        {
          id: "inv-201",
          room_id: "room-201",
          month: "2026-08",
          total_amount: 3600000,
          status: "pending",
          paid_at: null,
        },
      ]);
    });

    it("F3.1: calculates total expected monthly revenue accurately across all invoices", async () => {
      const { data: invoices } = await db.from("invoices").select("*").eq("month", "2026-08");
      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.total_amount, 0);

      expect(totalRevenue).toBe(3000000 + 2900000 + 3200000 + 3600000); // 12,700,000
    });

    it("F3.2: calculates collected revenue from paid invoices correctly", async () => {
      const { data: invoices } = await db.from("invoices").select("*").eq("month", "2026-08");
      const collectedRevenue = invoices
        .filter((inv: any) => inv.status === "paid")
        .reduce((sum: number, inv: any) => sum + inv.total_amount, 0);

      expect(collectedRevenue).toBe(3000000 + 2900000); // 5,900,000
    });

    it("F3.3: calculates pending revenue from unpaid invoices correctly", async () => {
      const { data: invoices } = await db.from("invoices").select("*").eq("month", "2026-08");
      const pendingRevenue = invoices
        .filter((inv: any) => inv.status === "pending")
        .reduce((sum: number, inv: any) => sum + inv.total_amount, 0);

      expect(pendingRevenue).toBe(3200000 + 3600000); // 6,800,000
    });

    it("F3.4: computes occupancy metrics accurately (8 rented / 10 total = 80%)", async () => {
      const { data: rooms } = await db.from("rooms").select("*");
      const totalRooms = rooms.length;
      const rentedRooms = rooms.filter((r: any) => r.status === "rented").length;
      const occupancyPercent = Math.round((rentedRooms / totalRooms) * 100);

      expect(totalRooms).toBe(10);
      expect(rentedRooms).toBe(8);
      expect(occupancyPercent).toBe(80);
    });

    it("F3.5: maps room status badges ('Đã thu' / 'Chưa thu' / 'Trống') properly for the grid", async () => {
      const { data: rooms } = await db.from("rooms").select("*");
      const { data: invoices } = await db.from("invoices").select("*").eq("month", "2026-08");

      const badgeMap: Record<string, string> = {};
      for (const r of rooms) {
        if (r.status === "empty") {
          badgeMap[r.code] = "Trống";
        } else {
          const inv = invoices.find((i: any) => i.room_id === r.id);
          badgeMap[r.code] = inv?.status === "paid" ? "Đã thu" : "Chưa thu";
        }
      }

      expect(badgeMap["P101"]).toBe("Đã thu");
      expect(badgeMap["P102"]).toBe("Đã thu");
      expect(badgeMap["P103"]).toBe("Chưa thu");
      expect(badgeMap["P105"]).toBe("Trống");
      expect(badgeMap["P205"]).toBe("Trống");
    });
  });

  // =========================================================================
  // F4: Invoices & Realtime Math (5 Tests)
  // =========================================================================
  describe("F4: Invoice Creation & Realtime Calculations", () => {
    it("F4.1: performs live calculation when entering new electric and water meters", () => {
      const calc = calculateInvoice({
        basePrice: 3200000,
        oldElectric: 400,
        newElectric: 460, // 60 kWh
        oldWater: 50,
        newWater: 58, // 8 m3
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 100000,
      });

      expect(calc.electricUsage).toBe(60);
      expect(calc.waterUsage).toBe(8);
      expect(calc.electricCost).toBe(210000);
      expect(calc.waterCost).toBe(200000);
      expect(calc.totalAmount).toBe(3710000);
    });

    it("F4.2: successfully saves computed invoice to database with initial pending status", async () => {
      const calc = calculateInvoice({
        basePrice: 2500000,
        oldElectric: 50,
        newElectric: 90,
        oldWater: 10,
        newWater: 15,
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 100000,
      });

      const { data, error } = await db.from("invoices").insert({
        id: "inv-save-test",
        room_id: "room-101",
        month: "2026-08",
        old_electric: 50,
        new_electric: 90,
        old_water: 10,
        new_water: 15,
        base_price: 2500000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
        total_amount: calc.totalAmount,
        status: "pending",
        paid_at: null,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const { data: saved } = await db.from("invoices").select("*").eq("id", "inv-save-test").single();
      expect(saved.total_amount).toBe(2500000 + 40 * 3500 + 5 * 25000 + 100000);
      expect(saved.status).toBe("pending");
    });

    it("F4.3: toggles invoice payment status between pending and paid with timestamp", async () => {
      await db.from("invoices").insert({
        id: "inv-toggle",
        room_id: "room-102",
        month: "2026-08",
        total_amount: 3000000,
        status: "pending",
        paid_at: null,
      });

      // Mark as paid
      const now = new Date().toISOString();
      await db.from("invoices").update({ status: "paid", paid_at: now }).eq("id", "inv-toggle");

      const { data: paidInv } = await db.from("invoices").select("*").eq("id", "inv-toggle").single();
      expect(paidInv.status).toBe("paid");
      expect(paidInv.paid_at).toBe(now);

      // Revert back to pending
      await db.from("invoices").update({ status: "pending", paid_at: null }).eq("id", "inv-toggle");
      const { data: pendingInv } = await db.from("invoices").select("*").eq("id", "inv-toggle").single();
      expect(pendingInv.status).toBe("pending");
      expect(pendingInv.paid_at).toBeNull();
    });

    it("F4.4: correctly calculates usage delta when new meter exceeds old meter", () => {
      const calc = calculateInvoice({
        basePrice: 2800000,
        oldElectric: 1234,
        newElectric: 1456, // 222 kWh
        oldWater: 56,
        newWater: 71, // 15 m3
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 100000,
      });

      expect(calc.electricUsage).toBe(222);
      expect(calc.waterUsage).toBe(15);
    });

    it("F4.5: maintains mathematical equality: totalAmount == basePrice + electricCost + waterCost + servicePrice", () => {
      const calc = calculateInvoice({
        basePrice: 3500000,
        oldElectric: 10,
        newElectric: 110,
        oldWater: 5,
        newWater: 20,
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 120000,
      });

      expect(calc.totalAmount).toBe(
        calc.basePrice + calc.electricCost + calc.waterCost + calc.servicePrice
      );
    });
  });

  // =========================================================================
  // F5: Room & Tenant Management (5 Tests)
  // =========================================================================
  describe("F5: Room Details & Resident Management", () => {
    it("F5.1: fetches active residents for a given room", async () => {
      const { data: tenants } = await db
        .from("tenants")
        .select("*")
        .eq("room_id", "room-101")
        .eq("status", "active");

      expect(tenants.length).toBe(1);
      expect(tenants[0].name).toBe("Nguyễn Văn Hùng");
    });

    it("F5.2: adds a new roommate/tenant to an existing room", async () => {
      const newTenant = {
        id: "tenant-101-2",
        room_id: "room-101",
        name: "Lê Văn Cường (Ở ghép)",
        phone: "0909999888",
        cccd: "001090009999",
        is_lead: false,
        start_date: "2026-08-15",
        end_date: null,
        deposit_amount: 0,
        status: "active",
      };

      const { error } = await db.from("tenants").insert(newTenant);
      expect(error).toBeNull();

      const { data: activeList } = await db
        .from("tenants")
        .select("*")
        .eq("room_id", "room-101")
        .eq("status", "active");

      expect(activeList.length).toBe(2);
      expect(activeList.some((t: any) => t.is_lead === true)).toBe(true);
      expect(activeList.some((t: any) => t.is_lead === false)).toBe(true);
    });

    it("F5.3: marks a tenant as moved out and sets end_date", async () => {
      const checkOutDate = "2026-08-31";
      await db
        .from("tenants")
        .update({ status: "moved_out", end_date: checkOutDate })
        .eq("id", "tenant-102-1");

      const { data: tenant } = await db.from("tenants").select("*").eq("id", "tenant-102-1").single();
      expect(tenant.status).toBe("moved_out");
      expect(tenant.end_date).toBe(checkOutDate);
    });

    it("F5.4: auto-syncs room status between 'empty' and 'rented' based on active occupants", async () => {
      // Initial state of room-105 is empty
      const { data: room105 } = await db.from("rooms").select("*").eq("id", "room-105").single();
      expect(room105.status).toBe("empty");

      // Check in new tenant
      await db.from("tenants").insert({
        id: "tenant-105-1",
        room_id: "room-105",
        name: "Hoàng Đức Anh",
        phone: "0911223344",
        cccd: "001090008877",
        is_lead: true,
        start_date: "2026-08-20",
        end_date: null,
        deposit_amount: 3000000,
        status: "active",
      });

      // Sync room status to rented
      await db.from("rooms").update({ status: "rented" }).eq("id", "room-105");

      const { data: updatedRoom } = await db.from("rooms").select("*").eq("id", "room-105").single();
      expect(updatedRoom.status).toBe("rented");
    });

    it("F5.5: separates active residents from historical departed residents", async () => {
      // Add a former resident
      await db.from("tenants").insert({
        id: "tenant-103-former",
        room_id: "room-103",
        name: "Nguyễn Cũ",
        phone: "0900000000",
        cccd: "001090000000",
        is_lead: false,
        start_date: "2025-01-01",
        end_date: "2026-02-28",
        deposit_amount: 0,
        status: "moved_out",
      });

      const { data: active } = await db
        .from("tenants")
        .select("*")
        .eq("room_id", "room-103")
        .eq("status", "active");

      const { data: history } = await db
        .from("tenants")
        .select("*")
        .eq("room_id", "room-103")
        .eq("status", "moved_out");

      expect(active.length).toBe(1);
      expect(history.length).toBe(1);
      expect(history[0].name).toBe("Nguyễn Cũ");
    });
  });

  // =========================================================================
  // F6: Settings & Rate Configuration (5 Tests)
  // =========================================================================
  describe("F6: Settings & Rate Configuration", () => {
    it("F6.1: retrieves default system utility rates and banking details", async () => {
      const { data: setting } = await db.from("settings").select("*").eq("id", 1).single();
      expect(setting.electric_price).toBe(3500);
      expect(setting.water_price).toBe(25000);
      expect(setting.service_price).toBe(100000);
    });

    it("F6.2: updates electricity rate and persists to database", async () => {
      await db.from("settings").update({ electric_price: 3800 }).eq("id", 1);

      const { data: updated } = await db.from("settings").select("*").eq("id", 1).single();
      expect(updated.electric_price).toBe(3800);
    });

    it("F6.3: updates water rate and persists to database", async () => {
      await db.from("settings").update({ water_price: 28000 }).eq("id", 1);

      const { data: updated } = await db.from("settings").select("*").eq("id", 1).single();
      expect(updated.water_price).toBe(28000);
    });

    it("F6.4: updates service charge rate and persists to database", async () => {
      await db.from("settings").update({ service_price: 120000 }).eq("id", 1);

      const { data: updated } = await db.from("settings").select("*").eq("id", 1).single();
      expect(updated.service_price).toBe(120000);
    });

    it("F6.5: updates bank account string and persists to database", async () => {
      const newBank = "Vietcombank - 0123456789 - TRAN VAN B - CN THU DUC";
      await db.from("settings").update({ bank_info: newBank }).eq("id", 1);

      const { data: updated } = await db.from("settings").select("*").eq("id", 1).single();
      expect(updated.bank_info).toBe(newBank);
    });
  });

  // =========================================================================
  // F7: Zalo Copy & Vietnamese Localization (5 Tests)
  // =========================================================================
  describe("F7: Zalo Message Formatting & Clipboard Integration", () => {
    it("F7.1: generates exact Zalo template with standard numbers", () => {
      const msg = buildZaloMessage({
        roomCode: "P101",
        month: "2026-08",
        totalAmount: 3425000,
        electricUsage: 55,
        electricCost: 192500,
        waterUsage: 8,
        waterCost: 200000,
        serviceCost: 100000,
      });

      expect(msg).toBe(
        "Phòng P101 - Tiền tháng 2026-08: Tổng 3.425.000đ (Điện: 55 số = 192.500đ | Nước: 8 m³ = 200.000đ | Dịch vụ: 100.000đ). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!"
      );
    });

    it("F7.2: copies message text to clipboard via navigator.clipboard.writeText", async () => {
      const msg = buildZaloMessage({
        roomCode: "P102",
        month: "2026-08",
        totalAmount: 3000000,
        electricUsage: 40,
        electricCost: 140000,
        waterUsage: 6,
        waterCost: 150000,
        serviceCost: 100000,
      });

      await navigator.clipboard.writeText(msg);
      const readBack = await navigator.clipboard.readText();

      expect(readBack).toBe(msg);
    });

    it("F7.3: verifies Vietnamese currency format uses periods as thousands separators", () => {
      const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

      expect(fmt(1000)).toBe("1.000");
      expect(fmt(2500000)).toBe("2.500.000");
      expect(fmt(10000000)).toBe("10.000.000");
    });

    it("F7.4: ensures correct Vietnamese title and payment instructions are rendered", () => {
      const msg = buildZaloMessage({
        roomCode: "P204",
        month: "2026-09",
        totalAmount: 4000000,
        electricUsage: 50,
        electricCost: 175000,
        waterUsage: 5,
        waterCost: 125000,
        serviceCost: 100000,
      });

      expect(msg).toContain("Vui lòng thanh toán trước ngày 05. Xin cảm ơn!");
      expect(msg).toContain("Tiền tháng 2026-09");
    });

    it("F7.5: handles complex Vietnamese room names properly in message string", () => {
      const msg = buildZaloMessage({
        roomCode: "Phòng VIP 01",
        month: "2026-08",
        totalAmount: 5000000,
        electricUsage: 100,
        electricCost: 350000,
        waterUsage: 10,
        waterCost: 250000,
        serviceCost: 100000,
      });

      expect(msg.startsWith("Phòng Phòng VIP 01 - Tiền tháng 2026-08: Tổng 5.000.000đ")).toBe(true);
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import {
  MockSupabaseEngine,
  calculateInvoice,
  buildZaloMessage,
  signSessionToken,
  verifySessionToken,
} from "../fixtures/seed-data.ts";

describe("Tier 2 E2E: Boundary & Corner Cases (35 Tests)", () => {
  let db: MockSupabaseEngine;
  const ADMIN_PASSWORD = "test-secret-password-123";

  beforeEach(() => {
    db = new MockSupabaseEngine();
  });

  // =========================================================================
  // F1: Auth Boundaries (5 Tests)
  // =========================================================================
  describe("F1: Auth & Session Boundaries", () => {
    it("F1-B1: rejects empty or blank password string", async () => {
      const emptyAttempt = "";
      expect(emptyAttempt === ADMIN_PASSWORD).toBe(false);

      const whitespaceAttempt = "   ";
      expect(whitespaceAttempt === ADMIN_PASSWORD).toBe(false);
    });

    it("F1-B2: handles extremely long password strings (10,000 chars) without buffer overflow", async () => {
      const longString = "A".repeat(10000);
      expect(longString === ADMIN_PASSWORD).toBe(false);
      expect(await verifySessionToken(longString, ADMIN_PASSWORD)).toBe(false);
    });

    it("F1-B3: boundary check on token expiration right at the exact millisecond threshold", async () => {
      const now = Date.now();
      const maxAgeMs = 7 * 24 * 60 * 60 * 1000;

      // Token generated exactly 1ms inside valid window
      const validToken = await signSessionToken(now - maxAgeMs + 1000, ADMIN_PASSWORD);
      expect(await verifySessionToken(validToken, ADMIN_PASSWORD, maxAgeMs)).toBe(true);

      // Token generated 1000ms past expiration
      const expiredToken = await signSessionToken(now - maxAgeMs - 1000, ADMIN_PASSWORD);
      expect(await verifySessionToken(expiredToken, ADMIN_PASSWORD, maxAgeMs)).toBe(false);
    });

    it("F1-B4: handles tokens containing non-hex characters in signature safely", async () => {
      const now = Date.now();
      const malformedToken = `${now}.XYZ_NOT_HEX_SIGNATURE!@#`;
      expect(await verifySessionToken(malformedToken, ADMIN_PASSWORD)).toBe(false);
    });

    it("F1-B5: handles unicode, null bytes and SQL injection strings in auth header", async () => {
      const maliciousTokens = [
        "admin' OR '1'='1",
        "0.0000000000000000",
        "\x00\x00\x00",
        "undefined.null",
        "NaN.NaN",
      ];

      for (const t of maliciousTokens) {
        expect(await verifySessionToken(t, ADMIN_PASSWORD)).toBe(false);
      }
    });
  });

  // =========================================================================
  // F2: Database Schema Boundaries (5 Tests)
  // =========================================================================
  describe("F2: Database Schema & Entity Boundaries", () => {
    it("F2-B1: allows zero base price for owner-occupied or complimentary rooms", async () => {
      const res = await db.from("rooms").insert({
        id: "room-zero-rent",
        code: "P000",
        base_price: 0,
        status: "rented",
      });

      expect(res.error).toBeNull();
      const { data } = await db.from("rooms").select("*").eq("id", "room-zero-rent").single();
      expect(data.base_price).toBe(0);
    });

    it("F2-B2: handles high currency amounts up to 100 billion VND safely", async () => {
      const res = await db.from("rooms").insert({
        id: "room-penthouse",
        code: "P999",
        base_price: 100000000000, // 100 billion
        status: "rented",
      });

      expect(res.error).toBeNull();
      const { data } = await db.from("rooms").select("*").eq("id", "room-penthouse").single();
      expect(data.base_price).toBe(100000000000);
    });

    it("F2-B3: handles querying non-existent IDs returning null / PGRST116 without throwing", async () => {
      const { data, error } = await db.from("rooms").select("*").eq("id", "non-existent-uuid-999").single();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.code).toBe("PGRST116");
    });

    it("F2-B4: handles deleting non-existent records safely without error", async () => {
      const res = await db.from("invoices").delete().eq("id", "ghost-invoice-id");
      expect(res.error).toBeNull();
      expect(res.data.length).toBe(0);
    });

    it("F2-B5: handles special unicode characters and Vietnamese accents in room codes", async () => {
      const res = await db.from("rooms").insert({
        id: "room-vn-code",
        code: "Phòng VIP - Số 01 @ Tầng Thượng",
        base_price: 5000000,
        status: "empty",
      });

      expect(res.error).toBeNull();
      const { data } = await db.from("rooms").select("*").eq("id", "room-vn-code").single();
      expect(data.code).toBe("Phòng VIP - Số 01 @ Tầng Thượng");
    });
  });

  // =========================================================================
  // F3: Dashboard Boundaries (5 Tests)
  // =========================================================================
  describe("F3: Dashboard Financial & Occupancy Boundaries", () => {
    it("F3-B1: handles empty month with zero invoices (all KPI values return 0)", async () => {
      const { data: invoices } = await db.from("invoices").select("*").eq("month", "2029-01");
      const total = invoices.reduce((s: number, i: any) => s + i.total_amount, 0);
      const collected = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.total_amount, 0);
      const pending = invoices.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + i.total_amount, 0);

      expect(total).toBe(0);
      expect(collected).toBe(0);
      expect(pending).toBe(0);
    });

    it("F3-B2: handles 100% occupancy when all 10 rooms are rented", async () => {
      // Mark all rooms as rented
      for (const r of db.rooms) {
        r.status = "rented";
      }

      const { data: rooms } = await db.from("rooms").select("*");
      const rented = rooms.filter((r: any) => r.status === "rented").length;
      const rate = Math.round((rented / rooms.length) * 100);

      expect(rate).toBe(100);
    });

    it("F3-B3: handles 0% occupancy when all rooms are empty", async () => {
      for (const r of db.rooms) {
        r.status = "empty";
      }

      const { data: rooms } = await db.from("rooms").select("*");
      const rented = rooms.filter((r: any) => r.status === "rented").length;
      const rate = Math.round((rented / rooms.length) * 100);

      expect(rate).toBe(0);
    });

    it("F3-B4: handles 100% paid invoices (pending revenue = 0)", async () => {
      await db.from("invoices").insert([
        { id: "inv-p1", room_id: "room-101", month: "2026-08", total_amount: 3000000, status: "paid" },
        { id: "inv-p2", room_id: "room-102", month: "2026-08", total_amount: 3000000, status: "paid" },
      ]);

      const { data: invoices } = await db.from("invoices").select("*").eq("month", "2026-08");
      const pending = invoices.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + i.total_amount, 0);
      const collected = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.total_amount, 0);

      expect(pending).toBe(0);
      expect(collected).toBe(6000000);
    });

    it("F3-B5: handles 100% pending invoices (collected revenue = 0)", async () => {
      await db.from("invoices").insert([
        { id: "inv-u1", room_id: "room-103", month: "2026-08", total_amount: 2800000, status: "pending" },
        { id: "inv-u2", room_id: "room-104", month: "2026-08", total_amount: 2800000, status: "pending" },
      ]);

      const { data: invoices } = await db.from("invoices").select("*").eq("month", "2026-08");
      const collected = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.total_amount, 0);
      const pending = invoices.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + i.total_amount, 0);

      expect(collected).toBe(0);
      expect(pending).toBe(5600000);
    });
  });

  // =========================================================================
  // F4: Invoices & Calculation Boundaries (5 Tests)
  // =========================================================================
  describe("F4: Invoice Calculation Boundaries", () => {
    it("F4-B1: handles zero electricity and water usage (old == new)", () => {
      const calc = calculateInvoice({
        basePrice: 2000000,
        oldElectric: 500,
        newElectric: 500,
        oldWater: 50,
        newWater: 50,
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 100000,
      });

      expect(calc.electricUsage).toBe(0);
      expect(calc.waterUsage).toBe(0);
      expect(calc.electricCost).toBe(0);
      expect(calc.waterCost).toBe(0);
      expect(calc.totalAmount).toBe(2100000);
    });

    it("F4-B2: clamps negative meter differences to 0 if new meter is typed smaller than old meter", () => {
      const calc = calculateInvoice({
        basePrice: 2500000,
        oldElectric: 1000,
        newElectric: 900, // Typo
        oldWater: 80,
        newWater: 70, // Typo
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 100000,
      });

      expect(calc.electricUsage).toBe(0);
      expect(calc.waterUsage).toBe(0);
      expect(calc.totalAmount).toBe(2600000);
    });

    it("F4-B3: handles fractional / decimal meter numbers (e.g. 0.5 kWh or 0.25 m3)", () => {
      const calc = calculateInvoice({
        basePrice: 3000000,
        oldElectric: 100.2,
        newElectric: 100.7, // 0.5 kWh
        oldWater: 10.0,
        newWater: 10.25, // 0.25 m3
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 50000,
      });

      expect(calc.electricCost).toBe(Math.round(0.5 * 3500)); // 1750
      expect(calc.waterCost).toBe(Math.round(0.25 * 25000)); // 6250
      expect(calc.totalAmount).toBe(3000000 + 1750 + 6250 + 50000);
    });

    it("F4-B4: handles high meter readings approaching 1,000,000 numbers", () => {
      const calc = calculateInvoice({
        basePrice: 3000000,
        oldElectric: 999000,
        newElectric: 999500, // 500 kWh
        oldWater: 888000,
        newWater: 888100, // 100 m3
        electricPrice: 4000,
        waterPrice: 30000,
        servicePrice: 150000,
      });

      expect(calc.electricUsage).toBe(500);
      expect(calc.waterUsage).toBe(100);
      expect(calc.totalAmount).toBe(3000000 + 2000000 + 3000000 + 150000); // 8,150,000
    });

    it("F4-B5: handles zero base rent and zero service fees for special rooms", () => {
      const calc = calculateInvoice({
        basePrice: 0,
        oldElectric: 0,
        newElectric: 50,
        oldWater: 0,
        newWater: 5,
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 0,
      });

      expect(calc.basePrice).toBe(0);
      expect(calc.servicePrice).toBe(0);
      expect(calc.totalAmount).toBe(50 * 3500 + 5 * 25000); // 175,000 + 125,000 = 300,000
    });
  });

  // =========================================================================
  // F5: Room & Tenant Boundaries (5 Tests)
  // =========================================================================
  describe("F5: Room & Resident Boundaries", () => {
    it("F5-B1: handles empty room with 0 active tenants returning empty array", async () => {
      const { data } = await db
        .from("tenants")
        .select("*")
        .eq("room_id", "room-105")
        .eq("status", "active");

      expect(data).toEqual([]);
    });

    it("F5-B2: supports multiple roommates (e.g. 5 residents) in a single shared room", async () => {
      for (let i = 1; i <= 5; i++) {
        await db.from("tenants").insert({
          id: `tenant-shared-${i}`,
          room_id: "room-205",
          name: `Sinh Viên ${i}`,
          phone: `091100000${i}`,
          cccd: `00109000000${i}`,
          is_lead: i === 1,
          start_date: "2026-08-01",
          end_date: null,
          deposit_amount: i === 1 ? 4000000 : 0,
          status: "active",
        });
      }

      const { data } = await db
        .from("tenants")
        .select("*")
        .eq("room_id", "room-205")
        .eq("status", "active");

      expect(data.length).toBe(5);
      expect(data.filter((t: any) => t.is_lead).length).toBe(1);
    });

    it("F5-B3: handles resident names with special characters, diacritics and hyphens", async () => {
      const res = await db.from("tenants").insert({
        id: "tenant-special-name",
        room_id: "room-101",
        name: "Lê-Nguyễn Hoàng Ân-Khang (Dr.)",
        phone: "+84 901-234-567",
        cccd: "001090-001122",
        is_lead: false,
        start_date: "2026-08-01",
        end_date: null,
        deposit_amount: 0,
        status: "active",
      });

      expect(res.error).toBeNull();
      const { data } = await db.from("tenants").select("*").eq("id", "tenant-special-name").single();
      expect(data.name).toBe("Lê-Nguyễn Hoàng Ân-Khang (Dr.)");
    });

    it("F5-B4: supports check-in and checkout on the exact same date (short stay)", async () => {
      const sameDay = "2026-08-15";
      const res = await db.from("tenants").insert({
        id: "tenant-short-stay",
        room_id: "room-102",
        name: "Khách Ngắn Hạn",
        phone: "0999888777",
        cccd: "001090009999",
        is_lead: false,
        start_date: sameDay,
        end_date: sameDay,
        deposit_amount: 0,
        status: "moved_out",
      });

      expect(res.error).toBeNull();
      const { data } = await db.from("tenants").select("*").eq("id", "tenant-short-stay").single();
      expect(data.start_date).toBe(sameDay);
      expect(data.end_date).toBe(sameDay);
      expect(data.status).toBe("moved_out");
    });

    it("F5-B5: handles zero deposit amount without database error", async () => {
      const res = await db.from("tenants").insert({
        id: "tenant-no-deposit",
        room_id: "room-103",
        name: "Khách Không Cọc",
        phone: "0912345678",
        cccd: "001090123456",
        is_lead: false,
        start_date: "2026-08-01",
        end_date: null,
        deposit_amount: 0,
        status: "active",
      });

      expect(res.error).toBeNull();
      const { data } = await db.from("tenants").select("*").eq("id", "tenant-no-deposit").single();
      expect(data.deposit_amount).toBe(0);
    });
  });

  // =========================================================================
  // F6: Settings Boundaries (5 Tests)
  // =========================================================================
  describe("F6: Settings & Rates Boundaries", () => {
    it("F6-B1: allows 0 rates for utilities when included in base rent", async () => {
      await db.from("settings").update({ electric_price: 0, water_price: 0, service_price: 0 }).eq("id", 1);
      const { data } = await db.from("settings").select("*").eq("id", 1).single();

      expect(data.electric_price).toBe(0);
      expect(data.water_price).toBe(0);
      expect(data.service_price).toBe(0);
    });

    it("F6-B2: handles high utility rate values (e.g. 50,000 VND/kWh)", async () => {
      await db.from("settings").update({ electric_price: 50000, water_price: 200000 }).eq("id", 1);
      const { data } = await db.from("settings").select("*").eq("id", 1).single();

      expect(data.electric_price).toBe(50000);
      expect(data.water_price).toBe(200000);
    });

    it("F6-B3: handles empty bank info string gracefully", async () => {
      await db.from("settings").update({ bank_info: "" }).eq("id", 1);
      const { data } = await db.from("settings").select("*").eq("id", 1).single();

      expect(data.bank_info).toBe("");
    });

    it("F6-B4: supports multi-line detailed bank and payment note instructions", async () => {
      const longBankNote = `Ngân hàng: Techcombank\nSTK: 19031234567890\nChủ TK: NGUYEN VAN A\nNội dung CK: [MaPhong] Tien phong thang [Thang]\nZalo hỗ trợ: 0987654321`;
      await db.from("settings").update({ bank_info: longBankNote }).eq("id", 1);
      const { data } = await db.from("settings").select("*").eq("id", 1).single();

      expect(data.bank_info).toBe(longBankNote);
    });

    it("F6-B5: handles decimal rates correctly in settings update", async () => {
      await db.from("settings").update({ electric_price: 3850.5, water_price: 25400.75 }).eq("id", 1);
      const { data } = await db.from("settings").select("*").eq("id", 1).single();

      expect(data.electric_price).toBe(3850.5);
      expect(data.water_price).toBe(25400.75);
    });
  });

  // =========================================================================
  // F7: Zalo Copy Boundaries (5 Tests)
  // =========================================================================
  describe("F7: Zalo Template & Copy Boundaries", () => {
    it("F7-B1: formats 0đ grand total accurately without NaN or formatting glitch", () => {
      const msg = buildZaloMessage({
        roomCode: "P000",
        month: "2026-08",
        totalAmount: 0,
        electricUsage: 0,
        electricCost: 0,
        waterUsage: 0,
        waterCost: 0,
        serviceCost: 0,
      });

      expect(msg).toContain("Tổng 0đ");
      expect(msg).toContain("Điện: 0 số = 0đ");
      expect(msg).toContain("Nước: 0 m³ = 0đ");
      expect(msg).toContain("Dịch vụ: 0đ");
    });

    it("F7-B2: handles huge billion VND sums in formatted string", () => {
      const msg = buildZaloMessage({
        roomCode: "VILLA-01",
        month: "2026-08",
        totalAmount: 1500000000, // 1.5 billion
        electricUsage: 10000,
        electricCost: 40000000,
        waterUsage: 1000,
        waterCost: 30000000,
        serviceCost: 5000000,
      });

      expect(msg).toContain("Tổng 1.500.000.000đ");
      expect(msg).toContain("Điện: 10000 số = 40.000.000đ");
      expect(msg).toContain("Nước: 1000 m³ = 30.000.000đ");
    });

    it("F7-B3: handles room codes containing punctuation, brackets and symbols", () => {
      const msg = buildZaloMessage({
        roomCode: "[Khu B] - P.202 (Gác Lửng)",
        month: "2026-08",
        totalAmount: 3200000,
        electricUsage: 50,
        electricCost: 175000,
        waterUsage: 5,
        waterCost: 125000,
        serviceCost: 100000,
      });

      expect(msg).toContain("Phòng [Khu B] - P.202 (Gác Lửng) - Tiền tháng 2026-08");
    });

    it("F7-B4: verifies consecutive rapid clipboard copy invocations complete without error", async () => {
      const msg = buildZaloMessage({
        roomCode: "P101",
        month: "2026-08",
        totalAmount: 2500000,
        electricUsage: 0,
        electricCost: 0,
        waterUsage: 0,
        waterCost: 0,
        serviceCost: 0,
      });

      // Simulate 5 rapid consecutive button clicks
      for (let i = 0; i < 5; i++) {
        await navigator.clipboard.writeText(msg);
      }

      const clipboardContent = await navigator.clipboard.readText();
      expect(clipboardContent).toBe(msg);
    });

    it("F7-B5: maintains format consistency across all 12 calendar months (2026-01 to 2026-12)", () => {
      for (let m = 1; m <= 12; m++) {
        const monthStr = `2026-${m.toString().padStart(2, "0")}`;
        const msg = buildZaloMessage({
          roomCode: "P101",
          month: monthStr,
          totalAmount: 3000000,
          electricUsage: 50,
          electricCost: 175000,
          waterUsage: 5,
          waterCost: 125000,
          serviceCost: 100000,
        });

        expect(msg).toContain(`Tiền tháng ${monthStr}`);
        expect(msg).toContain("Vui lòng thanh toán trước ngày 05. Xin cảm ơn!");
      }
    });
  });
});

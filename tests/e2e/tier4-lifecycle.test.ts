import { describe, it, expect, beforeEach } from "vitest";
import {
  MockSupabaseEngine,
  calculateInvoice,
  buildZaloMessage,
} from "../fixtures/seed-data.ts";
import type { SettingRecord, InvoiceRecord } from "../fixtures/seed-data.ts";

describe("Tier 4 E2E: Real-World Quarterly Lifecycle (10 Rooms x 3 Months)", () => {
  let db: MockSupabaseEngine;

  beforeEach(() => {
    db = new MockSupabaseEngine();
  });

  it("executes the full 3-month operational quarter (August, September, October 2026) flawlessly", async () => {
    // =========================================================================
    // MONTH 1: AUGUST 2026 (Initial Setup, 8 Rented, 2 Empty)
    // =========================================================================

    // 1.1 Verify initial 10-room setup
    const { data: allRooms } = await db.from("rooms").select("*");
    expect(allRooms.length).toBe(10);
    const rentedRoomsM1 = allRooms.filter((r: any) => r.status === "rented");
    const emptyRoomsM1 = allRooms.filter((r: any) => r.status === "empty");
    expect(rentedRoomsM1.length).toBe(8);
    expect(emptyRoomsM1.length).toBe(2);

    const { data: settingsM1 } = await db.from("settings").select("*").eq("id", 1).single();
    expect(settingsM1.electric_price).toBe(3500);
    expect(settingsM1.water_price).toBe(25000);
    expect(settingsM1.service_price).toBe(100000);

    // 1.2 Generate initial August invoices for all 8 active rented rooms
    const augReadings: Record<string, { oldE: number; newE: number; oldW: number; newW: number; isPaid: boolean }> = {
      "room-101": { oldE: 100, newE: 160, oldW: 10, newW: 18, isPaid: true },
      "room-102": { oldE: 120, newE: 175, oldW: 15, newW: 22, isPaid: true },
      "room-103": { oldE: 200, newE: 250, oldW: 30, newW: 38, isPaid: true },
      "room-104": { oldE: 150, newE: 195, oldW: 20, newW: 26, isPaid: false }, // Pending
      "room-201": { oldE: 300, newE: 380, oldW: 40, newW: 50, isPaid: true },
      "room-202": { oldE: 250, newE: 320, oldW: 35, newW: 44, isPaid: true },
      "room-203": { oldE: 180, newE: 235, oldW: 25, newW: 32, isPaid: true },
      "room-204": { oldE: 210, newE: 280, oldW: 28, newW: 36, isPaid: false }, // Pending
    };

    for (const room of rentedRoomsM1) {
      const readings = augReadings[room.id];
      const calc = calculateInvoice({
        basePrice: room.base_price,
        oldElectric: readings.oldE,
        newElectric: readings.newE,
        oldWater: readings.oldW,
        newWater: readings.newW,
        electricPrice: settingsM1.electric_price,
        waterPrice: settingsM1.water_price,
        servicePrice: settingsM1.service_price,
      });

      await db.from("invoices").insert({
        id: `inv-${room.id}-2026-08`,
        room_id: room.id,
        month: "2026-08",
        old_electric: readings.oldE,
        new_electric: readings.newE,
        old_water: readings.oldW,
        new_water: readings.newW,
        base_price: room.base_price,
        electric_price: settingsM1.electric_price,
        water_price: settingsM1.water_price,
        service_price: settingsM1.service_price,
        total_amount: calc.totalAmount,
        status: readings.isPaid ? "paid" : "pending",
        paid_at: readings.isPaid ? "2026-08-05T09:00:00Z" : null,
      });

      // Verify Zalo message generation
      const zaloMsg = buildZaloMessage({
        roomCode: room.code,
        month: "2026-08",
        totalAmount: calc.totalAmount,
        electricUsage: calc.electricUsage,
        electricCost: calc.electricCost,
        waterUsage: calc.waterUsage,
        waterCost: calc.waterCost,
        serviceCost: calc.servicePrice,
      });
      expect(zaloMsg).toContain(`Phòng ${room.code} - Tiền tháng 2026-08`);
      expect(zaloMsg).toContain(`Tổng ${new Intl.NumberFormat("vi-VN").format(calc.totalAmount)}đ`);
    }

    // 1.3 Audit August Dashboard Financials
    const { data: augInvoices } = await db.from("invoices").select("*").eq("month", "2026-08");
    expect(augInvoices.length).toBe(8);

    const augTotal = augInvoices.reduce((s: number, i: any) => s + i.total_amount, 0);
    const augCollected = augInvoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.total_amount, 0);
    const augPending = augInvoices.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + i.total_amount, 0);

    expect(augTotal).toBeGreaterThan(25000000); // > 25M VND
    expect(augCollected + augPending).toBe(augTotal);
    expect(augInvoices.filter((i: any) => i.status === "paid").length).toBe(6);
    expect(augInvoices.filter((i: any) => i.status === "pending").length).toBe(2);

    // =========================================================================
    // MONTH 2: SEPTEMBER 2026 (P105 Check-in, P202 Roommate, Rate Revision)
    // =========================================================================

    // 2.1 Check in tenant into P105 (Room becomes rented)
    await db.from("tenants").insert({
      id: "tenant-105-m2",
      room_id: "room-105",
      name: "Hoàng Văn Tuấn",
      phone: "0918112233",
      cccd: "001090008899",
      is_lead: true,
      start_date: "2026-09-01",
      end_date: null,
      deposit_amount: 3000000,
      status: "active",
    });
    await db.from("rooms").update({ status: "rented" }).eq("id", "room-105");

    // 2.2 Add roommate to P202
    await db.from("tenants").insert({
      id: "tenant-202-roommate",
      room_id: "room-202",
      name: "Trần Minh Quang (Ở ghép)",
      phone: "0918998877",
      cccd: "001090007766",
      is_lead: false,
      start_date: "2026-09-01",
      end_date: null,
      deposit_amount: 0,
      status: "active",
    });

    // 2.3 Rate Revision in Settings (Electricity increases from 3500 to 3800)
    await db.from("settings").update({ electric_price: 3800 }).eq("id", 1);
    const { data: settingsM2 } = await db.from("settings").select("*").eq("id", 1).single();
    expect(settingsM2.electric_price).toBe(3800);

    // 2.4 Verify Occupancy rate increased to 90% (9/10 rooms)
    const { data: roomsM2 } = await db.from("rooms").select("*");
    const rentedM2 = roomsM2.filter((r: any) => r.status === "rented").length;
    expect(rentedM2).toBe(9);
    expect(Math.round((rentedM2 / 10) * 100)).toBe(90);

    // 2.5 Generate September invoices with sequential meter chaining
    const septUsages: Record<string, { deltaE: number; deltaW: number; isPaid: boolean }> = {
      "room-101": { deltaE: 55, deltaW: 7, isPaid: true },
      "room-102": { deltaE: 60, deltaW: 8, isPaid: true },
      "room-103": { deltaE: 45, deltaW: 6, isPaid: true },
      "room-104": { deltaE: 50, deltaW: 7, isPaid: true },
      "room-105": { deltaE: 40, deltaW: 5, isPaid: true }, // Newly rented (from 0)
      "room-201": { deltaE: 75, deltaW: 9, isPaid: true },
      "room-202": { deltaE: 90, deltaW: 12, isPaid: true }, // Higher usage due to roommate
      "room-203": { deltaE: 60, deltaW: 7, isPaid: true },
      "room-204": { deltaE: 65, deltaW: 8, isPaid: false }, // Pending
    };

    for (const room of roomsM2.filter((r: any) => r.status === "rented")) {
      // Find latest invoice to auto-fill old readings
      const { data: prevInv } = await db
        .from("invoices")
        .select("*")
        .eq("room_id", room.id)
        .order("month", { ascending: false })
        .limit(1)
        .maybeSingle();

      const oldE = prevInv ? prevInv.new_electric : 0;
      const oldW = prevInv ? prevInv.new_water : 0;
      const u = septUsages[room.id];
      const newE = oldE + u.deltaE;
      const newW = oldW + u.deltaW;

      const calc = calculateInvoice({
        basePrice: room.base_price,
        oldElectric: oldE,
        newElectric: newE,
        oldWater: oldW,
        newWater: newW,
        electricPrice: settingsM2.electric_price,
        waterPrice: settingsM2.water_price,
        servicePrice: settingsM2.service_price,
      });

      await db.from("invoices").insert({
        id: `inv-${room.id}-2026-09`,
        room_id: room.id,
        month: "2026-09",
        old_electric: oldE,
        new_electric: newE,
        old_water: oldW,
        new_water: newW,
        base_price: room.base_price,
        electric_price: settingsM2.electric_price,
        water_price: settingsM2.water_price,
        service_price: settingsM2.service_price,
        total_amount: calc.totalAmount,
        status: u.isPaid ? "paid" : "pending",
        paid_at: u.isPaid ? "2026-09-05T10:00:00Z" : null,
      });
    }

    // Verify 9 September invoices created
    const { data: septInvoices } = await db.from("invoices").select("*").eq("month", "2026-09");
    expect(septInvoices.length).toBe(9);

    // =========================================================================
    // MONTH 3: OCTOBER 2026 (P201 Departure, P205 Check-in, Full Settlement)
    // =========================================================================

    // 3.1 Tenant in P201 moves out on 2026-09-30
    const { data: tenantP201 } = await db.from("tenants").select("*").eq("room_id", "room-201").single();
    await db.from("tenants").update({ status: "moved_out", end_date: "2026-09-30" }).eq("id", tenantP201.id);
    await db.from("rooms").update({ status: "empty" }).eq("id", "room-201");

    // 3.2 New Tenant checks into P205 on 2026-10-01
    await db.from("tenants").insert({
      id: "tenant-205-m3",
      room_id: "room-205",
      name: "Ngô Gia Huy",
      phone: "0977889900",
      cccd: "001090005544",
      is_lead: true,
      start_date: "2026-10-01",
      end_date: null,
      deposit_amount: 4000000,
      status: "active",
    });
    await db.from("rooms").update({ status: "rented" }).eq("id", "room-205");

    // 3.3 Verify occupancy remains 90% (P201 empty, P205 rented)
    const { data: roomsM3 } = await db.from("rooms").select("*");
    const activeRoomsM3 = roomsM3.filter((r: any) => r.status === "rented");
    expect(activeRoomsM3.length).toBe(9);

    // 3.4 Generate October Invoices for 9 active rooms
    for (const room of activeRoomsM3) {
      const { data: prevInv } = await db
        .from("invoices")
        .select("*")
        .eq("room_id", room.id)
        .order("month", { ascending: false })
        .limit(1)
        .maybeSingle();

      const oldE = prevInv ? prevInv.new_electric : 0;
      const oldW = prevInv ? prevInv.new_water : 0;
      const deltaE = 50;
      const deltaW = 6;
      const newE = oldE + deltaE;
      const newW = oldW + deltaW;

      const calc = calculateInvoice({
        basePrice: room.base_price,
        oldElectric: oldE,
        newElectric: newE,
        oldWater: oldW,
        newWater: newW,
        electricPrice: settingsM2.electric_price,
        waterPrice: settingsM2.water_price,
        servicePrice: settingsM2.service_price,
      });

      await db.from("invoices").insert({
        id: `inv-${room.id}-2026-10`,
        room_id: room.id,
        month: "2026-10",
        old_electric: oldE,
        new_electric: newE,
        old_water: oldW,
        new_water: newW,
        base_price: room.base_price,
        electric_price: settingsM2.electric_price,
        water_price: settingsM2.water_price,
        service_price: settingsM2.service_price,
        total_amount: calc.totalAmount,
        status: "paid", // All settled in October
        paid_at: "2026-10-04T12:00:00Z",
      });
    }

    // =========================================================================
    // QUARTERLY AUDIT & RECONCILIATION
    // =========================================================================

    // 4.1 Total Invoices Count across Q3: 8 in Aug + 9 in Sept + 9 in Oct = 26 Invoices
    const { data: totalQuarterInvoices } = await db.from("invoices").select("*");
    expect(totalQuarterInvoices.length).toBe(26);

    // 4.2 Rate Snapshot Invariance: August invoices still retain electric_price 3500
    const augInvoicesPersisted = totalQuarterInvoices.filter((i: any) => i.month === "2026-08");
    for (const inv of augInvoicesPersisted) {
      expect(inv.electric_price).toBe(3500);
    }

    // 4.3 September & October invoices retain revised electric_price 3800
    const laterInvoices = totalQuarterInvoices.filter((i: any) => i.month === "2026-09" || i.month === "2026-10");
    for (const inv of laterInvoices) {
      expect(inv.electric_price).toBe(3800);
    }

    // 4.4 Cumulative Gross Revenue across Quarter > 80,000,000 VND
    const totalGrossRevenue = totalQuarterInvoices.reduce((sum: number, inv: any) => sum + inv.total_amount, 0);
    expect(totalGrossRevenue).toBeGreaterThan(80000000);

    // 4.5 Historical tenant archiving verification
    const { data: movedOutTenants } = await db.from("tenants").select("*").eq("status", "moved_out");
    expect(movedOutTenants.length).toBe(1);
    expect(movedOutTenants[0].name).toBe("Võ Minh Trí");
    expect(movedOutTenants[0].end_date).toBe("2026-09-30");

    // 4.6 Room status consistency
    const { data: room201Final } = await db.from("rooms").select("*").eq("id", "room-201").single();
    expect(room201Final.status).toBe("empty");

    const { data: room205Final } = await db.from("rooms").select("*").eq("id", "room-205").single();
    expect(room205Final.status).toBe("rented");
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import {
  MockSupabaseEngine,
  calculateInvoice,
  buildZaloMessage,
} from "../fixtures/seed-data.ts";

describe("Tier 3 E2E: Pairwise Cross-Feature Workflows (6 Combinations)", () => {
  let db: MockSupabaseEngine;

  beforeEach(() => {
    db = new MockSupabaseEngine();
  });

  // =========================================================================
  // Pairwise 1: Settings Update -> Invoice Calculation
  // =========================================================================
  it("Pair 1: Settings rate revision immediately applies to newly generated invoices", async () => {
    // 1. Update utility rates in settings
    const newElectricRate = 4000;
    const newWaterRate = 30000;
    const newServiceRate = 120000;

    await db.from("settings").update({
      electric_price: newElectricRate,
      water_price: newWaterRate,
      service_price: newServiceRate,
    }).eq("id", 1);

    // 2. Fetch current settings when opening invoice creator
    const { data: currentSettings } = await db.from("settings").select("*").eq("id", 1).single();
    expect(currentSettings.electric_price).toBe(4000);
    expect(currentSettings.water_price).toBe(30000);

    // 3. Compute invoice for Room 101
    const calc = calculateInvoice({
      basePrice: 2500000,
      oldElectric: 100,
      newElectric: 150, // 50 kWh
      oldWater: 20,
      newWater: 26, // 6 m3
      electricPrice: currentSettings.electric_price,
      waterPrice: currentSettings.water_price,
      servicePrice: currentSettings.service_price,
    });

    expect(calc.electricCost).toBe(50 * 4000); // 200,000
    expect(calc.waterCost).toBe(6 * 30000); // 180,000
    expect(calc.servicePrice).toBe(120000);
    expect(calc.totalAmount).toBe(2500000 + 200000 + 180000 + 120000); // 3,000,000

    // 4. Save invoice to database
    const { error } = await db.from("invoices").insert({
      id: "inv-pair-1",
      room_id: "room-101",
      month: "2026-09",
      old_electric: 100,
      new_electric: 150,
      old_water: 20,
      new_water: 26,
      base_price: 2500000,
      electric_price: currentSettings.electric_price,
      water_price: currentSettings.water_price,
      service_price: currentSettings.service_price,
      total_amount: calc.totalAmount,
      status: "pending",
      paid_at: null,
    });

    expect(error).toBeNull();
  });

  // =========================================================================
  // Pairwise 2: Tenant Check-in -> Room Status Sync -> Invoice Creation
  // =========================================================================
  it("Pair 2: Tenant check-in turns empty room to rented and enables initial billing", async () => {
    // 1. Verify Room 105 is initially empty
    const { data: initialRoom } = await db.from("rooms").select("*").eq("id", "room-105").single();
    expect(initialRoom.status).toBe("empty");

    // 2. Check in new tenant
    await db.from("tenants").insert({
      id: "tenant-105-new",
      room_id: "room-105",
      name: "Trần Bảo Nam",
      phone: "0933445566",
      cccd: "001090112233",
      is_lead: true,
      start_date: "2026-08-01",
      end_date: null,
      deposit_amount: 3000000,
      status: "active",
    });

    // 3. Sync room status to 'rented'
    await db.from("rooms").update({ status: "rented" }).eq("id", "room-105");
    const { data: updatedRoom } = await db.from("rooms").select("*").eq("id", "room-105").single();
    expect(updatedRoom.status).toBe("rented");

    // 4. Generate first invoice for Room 105
    const calc = calculateInvoice({
      basePrice: updatedRoom.base_price,
      oldElectric: 0,
      newElectric: 45, // 45 kWh
      oldWater: 0,
      newWater: 6, // 6 m3
      electricPrice: 3500,
      waterPrice: 25000,
      servicePrice: 100000,
    });

    expect(calc.totalAmount).toBe(3000000 + 45 * 3500 + 6 * 25000 + 100000); // 3,407,500

    await db.from("invoices").insert({
      id: "inv-105-aug",
      room_id: "room-105",
      month: "2026-08",
      old_electric: 0,
      new_electric: 45,
      old_water: 0,
      new_water: 6,
      base_price: updatedRoom.base_price,
      electric_price: 3500,
      water_price: 25000,
      service_price: 100000,
      total_amount: calc.totalAmount,
      status: "pending",
      paid_at: null,
    });

    const { data: invoiceCheck } = await db.from("invoices").select("*").eq("id", "inv-105-aug").single();
    expect(invoiceCheck.status).toBe("pending");
  });

  // =========================================================================
  // Pairwise 3: 3-Month Invoice Meter Chaining -> Zalo Text Generation
  // =========================================================================
  it("Pair 3: 3-month consecutive invoice chaining feeds sequential readings and produces exact Zalo messages", async () => {
    const roomId = "room-201";
    const roomCode = "P201";
    const basePrice = 3200000;
    const electricPrice = 3500;
    const waterPrice = 25000;
    const servicePrice = 100000;

    // Month 1: 2026-08 (Meters: E 100->160 = 60kWh, W 10->18 = 8m3)
    const m1Calc = calculateInvoice({
      basePrice,
      oldElectric: 100,
      newElectric: 160,
      oldWater: 10,
      newWater: 18,
      electricPrice,
      waterPrice,
      servicePrice,
    });
    await db.from("invoices").insert({
      id: "inv-201-m1",
      room_id: roomId,
      month: "2026-08",
      old_electric: 100,
      new_electric: 160,
      old_water: 10,
      new_water: 18,
      base_price: basePrice,
      electric_price: electricPrice,
      water_price: waterPrice,
      service_price: servicePrice,
      total_amount: m1Calc.totalAmount,
      status: "paid",
      paid_at: "2026-08-04",
    });

    const m1Zalo = buildZaloMessage({
      roomCode,
      month: "2026-08",
      totalAmount: m1Calc.totalAmount,
      electricUsage: m1Calc.electricUsage,
      electricCost: m1Calc.electricCost,
      waterUsage: m1Calc.waterUsage,
      waterCost: m1Calc.waterCost,
      serviceCost: m1Calc.servicePrice,
    });
    expect(m1Zalo).toContain("Phòng P201 - Tiền tháng 2026-08");
    expect(m1Zalo).toContain("Điện: 60 số = 210.000đ");

    // Month 2: 2026-09 (Auto-fetch latest -> E: 160, W: 18. New: E 225 = 65kWh, W 27 = 9m3)
    const { data: latestForM2 } = await db
      .from("invoices")
      .select("*")
      .eq("room_id", roomId)
      .order("month", { ascending: false })
      .limit(1)
      .single();

    expect(latestForM2.new_electric).toBe(160);
    expect(latestForM2.new_water).toBe(18);

    const m2Calc = calculateInvoice({
      basePrice,
      oldElectric: latestForM2.new_electric,
      newElectric: 225,
      oldWater: latestForM2.new_water,
      newWater: 27,
      electricPrice,
      waterPrice,
      servicePrice,
    });
    await db.from("invoices").insert({
      id: "inv-201-m2",
      room_id: roomId,
      month: "2026-09",
      old_electric: latestForM2.new_electric,
      new_electric: 225,
      old_water: latestForM2.new_water,
      new_water: 27,
      base_price: basePrice,
      electric_price: electricPrice,
      water_price: waterPrice,
      service_price: servicePrice,
      total_amount: m2Calc.totalAmount,
      status: "paid",
      paid_at: "2026-09-04",
    });

    // Month 3: 2026-10 (Auto-fetch latest -> E: 225, W: 27. New: E 290 = 65kWh, W 35 = 8m3)
    const { data: latestForM3 } = await db
      .from("invoices")
      .select("*")
      .eq("room_id", roomId)
      .order("month", { ascending: false })
      .limit(1)
      .single();

    expect(latestForM3.new_electric).toBe(225);
    expect(latestForM3.new_water).toBe(27);

    const m3Calc = calculateInvoice({
      basePrice,
      oldElectric: latestForM3.new_electric,
      newElectric: 290,
      oldWater: latestForM3.new_water,
      newWater: 35,
      electricPrice,
      waterPrice,
      servicePrice,
    });

    const m3Zalo = buildZaloMessage({
      roomCode,
      month: "2026-10",
      totalAmount: m3Calc.totalAmount,
      electricUsage: m3Calc.electricUsage,
      electricCost: m3Calc.electricCost,
      waterUsage: m3Calc.waterUsage,
      waterCost: m3Calc.waterCost,
      serviceCost: m3Calc.servicePrice,
    });

    expect(m3Zalo).toContain("Phòng P201 - Tiền tháng 2026-10");
    expect(m3Zalo).toContain("Điện: 65 số = 227.500đ");
    expect(m3Zalo).toContain("Nước: 8 m³ = 200.000đ");
  });

  // =========================================================================
  // Pairwise 4: Invoice Payment Toggle -> Dashboard KPI Updates
  // =========================================================================
  it("Pair 4: Toggling invoice payment state dynamically recalculates dashboard collected and pending KPIs", async () => {
    // Seed 3 invoices for 2026-08: 1 paid (3M), 2 pending (3M each)
    await db.from("invoices").insert([
      { id: "inv-kpi-1", room_id: "room-101", month: "2026-08", total_amount: 3000000, status: "paid" },
      { id: "inv-kpi-2", room_id: "room-102", month: "2026-08", total_amount: 3000000, status: "pending" },
      { id: "inv-kpi-3", room_id: "room-103", month: "2026-08", total_amount: 3000000, status: "pending" },
    ]);

    // Initial KPI calculation
    let { data: invList } = await db.from("invoices").select("*").eq("month", "2026-08");
    let collected = invList.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.total_amount, 0);
    let pending = invList.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + i.total_amount, 0);

    expect(collected).toBe(3000000);
    expect(pending).toBe(6000000);

    // Landlord marks inv-kpi-2 as paid
    await db.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", "inv-kpi-2");

    // Recalculate KPIs
    const { data: updatedList } = await db.from("invoices").select("*").eq("month", "2026-08");
    collected = updatedList.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.total_amount, 0);
    pending = updatedList.filter((i: any) => i.status === "pending").reduce((s: number, i: any) => s + i.total_amount, 0);

    expect(collected).toBe(6000000);
    expect(pending).toBe(3000000);
  });

  // =========================================================================
  // Pairwise 5: Tenant Move-Out -> Historical Data Preservation -> Room Status Sync
  // =========================================================================
  it("Pair 5: Tenant move-out preserves historical tenant & invoice data while marking room empty", async () => {
    // 1. Existing tenant in Room 102
    const { data: leadTenant } = await db.from("tenants").select("*").eq("room_id", "room-102").single();
    expect(leadTenant.status).toBe("active");

    // 2. Add an invoice for Room 102
    await db.from("invoices").insert({
      id: "inv-102-history",
      room_id: "room-102",
      month: "2026-08",
      total_amount: 2900000,
      status: "paid",
      paid_at: "2026-08-05",
    });

    // 3. Mark tenant moved out
    await db.from("tenants").update({
      status: "moved_out",
      end_date: "2026-08-31",
    }).eq("id", leadTenant.id);

    // 4. Update room status to empty
    await db.from("rooms").update({ status: "empty" }).eq("id", "room-102");

    // 5. Verify room status is empty
    const { data: room102 } = await db.from("rooms").select("*").eq("id", "room-102").single();
    expect(room102.status).toBe("empty");

    // 6. Verify historical tenant is preserved
    const { data: formerTenants } = await db.from("tenants").select("*").eq("room_id", "room-102").eq("status", "moved_out");
    expect(formerTenants.length).toBe(1);
    expect(formerTenants[0].name).toBe("Trần Thị Mai");

    // 7. Verify historical invoice is still intact
    const { data: historicalInv } = await db.from("invoices").select("*").eq("id", "inv-102-history").single();
    expect(historicalInv.total_amount).toBe(2900000);
    expect(historicalInv.status).toBe("paid");
  });

  // =========================================================================
  // Pairwise 6: Service Price Revision -> Historical Invoices Invariance
  // =========================================================================
  it("Pair 6: Modifying service pricing in settings does NOT alter past saved invoices (Rate Snapshot Invariance)", async () => {
    // 1. Save August invoice with original service price (100,000)
    await db.from("invoices").insert({
      id: "inv-aug-snapshot",
      room_id: "room-103",
      month: "2026-08",
      base_price: 2800000,
      old_electric: 100,
      new_electric: 140,
      old_water: 20,
      new_water: 25,
      electric_price: 3500,
      water_price: 25000,
      service_price: 100000,
      total_amount: 2800000 + 40 * 3500 + 5 * 25000 + 100000, // 3,165,000
      status: "paid",
    });

    // 2. Increase service rate in settings for September
    await db.from("settings").update({ service_price: 150000 }).eq("id", 1);

    // 3. Compute September invoice with new service price
    const septCalc = calculateInvoice({
      basePrice: 2800000,
      oldElectric: 140,
      newElectric: 180,
      oldWater: 25,
      newWater: 30,
      electricPrice: 3500,
      waterPrice: 25000,
      servicePrice: 150000,
    });
    expect(septCalc.totalAmount).toBe(2800000 + 40 * 3500 + 5 * 25000 + 150000); // 3,215,000

    await db.from("invoices").insert({
      id: "inv-sept-snapshot",
      room_id: "room-103",
      month: "2026-09",
      base_price: 2800000,
      old_electric: 140,
      new_electric: 180,
      old_water: 25,
      new_water: 30,
      electric_price: 3500,
      water_price: 25000,
      service_price: 150000,
      total_amount: septCalc.totalAmount,
      status: "pending",
    });

    // 4. Verify August invoice was NOT modified by the settings change
    const { data: augRecord } = await db.from("invoices").select("*").eq("id", "inv-aug-snapshot").single();
    expect(augRecord.service_price).toBe(100000);
    expect(augRecord.total_amount).toBe(3165000);

    // 5. Verify September invoice stored the new snapshot
    const { data: septRecord } = await db.from("invoices").select("*").eq("id", "inv-sept-snapshot").single();
    expect(septRecord.service_price).toBe(150000);
    expect(septRecord.total_amount).toBe(3215000);
  });
});

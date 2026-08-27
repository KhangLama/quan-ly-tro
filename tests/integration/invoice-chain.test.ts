import { describe, it, expect, beforeEach } from "vitest";
import { MockSupabaseEngine, calculateInvoice } from "../fixtures/seed-data.ts";
import type { InvoiceRecord } from "../fixtures/seed-data.ts";

describe("Integration Test: Sequential Invoice Meter Reading Chaining", () => {
  let db: MockSupabaseEngine;

  beforeEach(() => {
    db = new MockSupabaseEngine();
  });

  // Helper function mimicking the backend action for finding previous invoice readings
  async function getPreviousInvoiceReadings(roomId: string): Promise<{
    oldElectric: number;
    oldWater: number;
  } | null> {
    const { data, error } = await db
      .from("invoices")
      .select("*")
      .eq("room_id", roomId)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      oldElectric: data.new_electric,
      oldWater: data.new_water,
    };
  }

  it("returns null when no previous invoice exists for a freshly rented room", async () => {
    const prev = await getPreviousInvoiceReadings("room-101");
    expect(prev).toBeNull();
  });

  it("auto-populates Month 2 old readings from Month 1 new readings accurately", async () => {
    // Month 1: 2026-08
    const month1Invoice: Partial<InvoiceRecord> = {
      id: "inv-101-2026-08",
      room_id: "room-101",
      month: "2026-08",
      old_electric: 100,
      new_electric: 155, // +55
      old_water: 20,
      new_water: 28, // +8
      base_price: 2500000,
      electric_price: 3500,
      water_price: 25000,
      service_price: 100000,
      total_amount: 2500000 + 55 * 3500 + 8 * 25000 + 100000,
      status: "paid",
      paid_at: "2026-08-05T10:00:00Z",
    };

    await db.from("invoices").insert(month1Invoice);

    // Query for Month 2 auto-fill
    const prev = await getPreviousInvoiceReadings("room-101");
    expect(prev).not.toBeNull();
    expect(prev?.oldElectric).toBe(155);
    expect(prev?.oldWater).toBe(28);

    // Month 2: 2026-09 calculation with auto-filled old meters
    const month2Calc = calculateInvoice({
      basePrice: 2500000,
      oldElectric: prev!.oldElectric,
      newElectric: 210, // +55
      oldWater: prev!.oldWater,
      newWater: 35, // +7
      electricPrice: 3500,
      waterPrice: 25000,
      servicePrice: 100000,
    });

    expect(month2Calc.electricUsage).toBe(55);
    expect(month2Calc.waterUsage).toBe(7);
    expect(month2Calc.totalAmount).toBe(2500000 + 55 * 3500 + 7 * 25000 + 100000);

    // Persist Month 2
    await db.from("invoices").insert({
      id: "inv-101-2026-09",
      room_id: "room-101",
      month: "2026-09",
      old_electric: prev!.oldElectric,
      new_electric: 210,
      old_water: prev!.oldWater,
      new_water: 35,
      base_price: 2500000,
      electric_price: 3500,
      water_price: 25000,
      service_price: 100000,
      total_amount: month2Calc.totalAmount,
      status: "pending",
      paid_at: null,
    });

    // Verify Month 3 auto-fill reads from Month 2
    const prevForMonth3 = await getPreviousInvoiceReadings("room-101");
    expect(prevForMonth3?.oldElectric).toBe(210);
    expect(prevForMonth3?.oldWater).toBe(35);
  });

  it("maintains isolated reading chains across multiple rooms without cross-contamination", async () => {
    // Insert Month 1 for Room 101
    await db.from("invoices").insert({
      id: "inv-101-1",
      room_id: "room-101",
      month: "2026-08",
      old_electric: 100,
      new_electric: 160,
      old_water: 20,
      new_water: 30,
      base_price: 2500000,
      electric_price: 3500,
      water_price: 25000,
      service_price: 100000,
      total_amount: 3060000,
      status: "paid",
      paid_at: null,
    });

    // Insert Month 1 for Room 202
    await db.from("invoices").insert({
      id: "inv-202-1",
      room_id: "room-202",
      month: "2026-08",
      old_electric: 500,
      new_electric: 580,
      old_water: 80,
      new_water: 92,
      base_price: 3200000,
      electric_price: 3500,
      water_price: 25000,
      service_price: 100000,
      total_amount: 3880000,
      status: "paid",
      paid_at: null,
    });

    const prev101 = await getPreviousInvoiceReadings("room-101");
    const prev202 = await getPreviousInvoiceReadings("room-202");
    const prevEmpty = await getPreviousInvoiceReadings("room-105");

    expect(prev101?.oldElectric).toBe(160);
    expect(prev101?.oldWater).toBe(30);

    expect(prev202?.oldElectric).toBe(580);
    expect(prev202?.oldWater).toBe(92);

    expect(prevEmpty).toBeNull();
  });

  it("always picks the most recent month even if invoices are saved out of order", async () => {
    // Insert October first
    await db.from("invoices").insert({
      id: "inv-103-oct",
      room_id: "room-103",
      month: "2026-10",
      old_electric: 300,
      new_electric: 350,
      old_water: 60,
      new_water: 70,
      base_price: 2800000,
      electric_price: 3500,
      water_price: 25000,
      service_price: 100000,
      total_amount: 3325000,
      status: "pending",
      paid_at: null,
    });

    // Insert August later
    await db.from("invoices").insert({
      id: "inv-103-aug",
      room_id: "room-103",
      month: "2026-08",
      old_electric: 200,
      new_electric: 250,
      old_water: 40,
      new_water: 50,
      base_price: 2800000,
      electric_price: 3500,
      water_price: 25000,
      service_price: 100000,
      total_amount: 3325000,
      status: "paid",
      paid_at: null,
    });

    const latest = await getPreviousInvoiceReadings("room-103");
    // Should select 2026-10 because of order by month desc
    expect(latest?.oldElectric).toBe(350);
    expect(latest?.oldWater).toBe(70);
  });
});

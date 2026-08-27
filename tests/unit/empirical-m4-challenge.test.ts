import { describe, it, expect, beforeEach } from "vitest";
import { mockDbStore, mockSupabase } from "../../src/lib/supabase/mock-db.ts";
import { getInvoiceFormData, saveInvoice, toggleInvoiceStatus, deleteInvoice } from "../../src/actions/invoices.ts";
import { calculateInvoice } from "../../src/lib/calculations/invoice.ts";
import { buildZaloMessage } from "../../src/lib/zalo/template.ts";
import { createRoom } from "../../src/actions/rooms.ts";
import { addTenant } from "../../src/actions/tenants.ts";

describe("Milestone 4 Empirical Gate Verification Suite", () => {
  beforeEach(() => {
    mockDbStore.reset();
  });

  describe("Invoice Previous Reading Auto-Fill & Chaining", () => {
    it("month 1 invoice creation starts with 0 or manual readings", async () => {
      const { room } = await createRoom({ code: "P101", base_price: 2500000 });
      await addTenant({ room_id: room!.id, name: "Nguyen Van A" });

      const formM1 = await getInvoiceFormData(room!.id, "2026-08");
      expect(formM1.previousReading.hasPreviousInvoice).toBe(false);
      expect(formM1.previousReading.old_electric).toBe(0);
      expect(formM1.previousReading.old_water).toBe(0);

      // Save Month 1 invoice (electric: 0 -> 100, water: 0 -> 15)
      const saveM1 = await saveInvoice({
        room_id: room!.id,
        month: "2026-08",
        old_electric: 0,
        new_electric: 100,
        old_water: 0,
        new_water: 15,
        base_price: 2500000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
      });

      expect(saveM1.success).toBe(true);
      expect(saveM1.invoice?.total_amount).toBe(2500000 + 100 * 3500 + 15 * 25000 + 100000);
    });

    it("month 2 invoice automatically populates old meters from month 1 new meters", async () => {
      const { room } = await createRoom({ code: "P102", base_price: 3000000 });

      // Save Month 1
      await saveInvoice({
        room_id: room!.id,
        month: "2026-08",
        old_electric: 50,
        new_electric: 180,
        old_water: 10,
        new_water: 28,
        base_price: 3000000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
      });

      // Query Month 2 form data
      const formM2 = await getInvoiceFormData(room!.id, "2026-09");
      expect(formM2.previousReading.hasPreviousInvoice).toBe(true);
      expect(formM2.previousReading.previousMonth).toBe("2026-08");
      expect(formM2.previousReading.old_electric).toBe(180);
      expect(formM2.previousReading.old_water).toBe(28);

      // Save Month 2 (electric: 180 -> 240, water: 28 -> 35)
      const saveM2 = await saveInvoice({
        room_id: room!.id,
        month: "2026-09",
        old_electric: formM2.previousReading.old_electric,
        new_electric: 240,
        old_water: formM2.previousReading.old_water,
        new_water: 35,
        base_price: 3000000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
      });

      expect(saveM2.success).toBe(true);
      // Usage: (240-180)=60 electric, (35-28)=7 water
      expect(saveM2.invoice?.old_electric).toBe(180);
      expect(saveM2.invoice?.new_electric).toBe(240);
      expect(saveM2.invoice?.old_water).toBe(28);
      expect(saveM2.invoice?.new_water).toBe(35);
      expect(saveM2.invoice?.total_amount).toBe(3000000 + 60 * 3500 + 7 * 25000 + 100000);
    });
  });

  describe("Realtime Invoice Calculations & Invariant Checking", () => {
    it("computes accurate math: total == base + electric + water + service", () => {
      const calc = calculateInvoice({
        basePrice: 3200000,
        oldElectric: 150,
        newElectric: 220, // 70 kWh
        oldWater: 30,
        newWater: 42, // 12 m3
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 100000,
      });

      expect(calc.electricUsage).toBe(70);
      expect(calc.electricCost).toBe(70 * 3500); // 245,000
      expect(calc.waterUsage).toBe(12);
      expect(calc.waterCost).toBe(12 * 25000); // 300,000
      expect(calc.servicePrice).toBe(100000);
      expect(calc.basePrice).toBe(3200000);
      expect(calc.totalAmount).toBe(3200000 + 245000 + 300000 + 100000); // 3,845,000
    });

    it("clamps negative usage to 0 if new meter is smaller than old meter", () => {
      const calc = calculateInvoice({
        basePrice: 2500000,
        oldElectric: 100,
        newElectric: 80, // typo smaller
        oldWater: 20,
        newWater: 15,
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 100000,
      });

      expect(calc.electricUsage).toBe(0);
      expect(calc.waterUsage).toBe(0);
      expect(calc.totalAmount).toBe(2500000 + 100000);
    });
  });

  describe("Invoice Payment Toggle & Zalo Template Generation", () => {
    it("toggles payment status from pending to paid and back", async () => {
      const { room } = await createRoom({ code: "P103", base_price: 2800000 });
      const { invoice } = await saveInvoice({
        room_id: room!.id,
        month: "2026-08",
        old_electric: 0,
        new_electric: 50,
        old_water: 0,
        new_water: 5,
        base_price: 2800000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
      });

      expect(invoice?.status).toBe("pending");
      expect(invoice?.paid_at).toBeNull();

      // Toggle to paid
      const paidRes = await toggleInvoiceStatus(invoice!.id);
      expect(paidRes.success).toBe(true);
      expect(paidRes.invoice?.status).toBe("paid");
      expect(paidRes.invoice?.paid_at).toBeDefined();

      // Toggle back to pending
      const pendingRes = await toggleInvoiceStatus(invoice!.id);
      expect(pendingRes.success).toBe(true);
      expect(pendingRes.invoice?.status).toBe("pending");
      expect(pendingRes.invoice?.paid_at).toBeNull();
    });

    it("formats 1-tap Vietnamese Zalo message matching user specification exactly", () => {
      const msg = buildZaloMessage({
        roomCode: "P101",
        month: "2026-08",
        totalAmount: 3425000,
        electricUsage: 120,
        electricCost: 420000,
        waterUsage: 14,
        waterCost: 350000,
        serviceCost: 155000,
      });

      expect(msg).toBe(
        "Phòng P101 - Tiền tháng 2026-08: Tổng 3.425.000đ (Điện: 120 số = 420.000đ | Nước: 14 m³ = 350.000đ | Dịch vụ: 155.000đ). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!"
      );
    });
  });
});

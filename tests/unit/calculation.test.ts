import { describe, it, expect } from "vitest";
import {
  calculateInvoice,
  calculateProratedRent,
  getDaysInMonth,
  calculateStayDaysFromDates,
  calculatePaymentStatus,
  forgiveRemainingDebt,
} from "../fixtures/seed-data.ts";
import type { CalculationInput } from "../fixtures/seed-data.ts";

describe("Unit Test: Electricity, Water & Grand Total Calculations", () => {
  it("computes exact standard consumption and costs for typical room usage", () => {
    const input: CalculationInput = {
      basePrice: 2500000,
      oldElectric: 120,
      newElectric: 175, // 55 kWh
      oldWater: 40,
      newWater: 48, // 8 m3
      electricPrice: 3500,
      waterPrice: 25000,
      servicePrice: 100000,
    };

    const result = calculateInvoice(input);

    expect(result.electricUsage).toBe(55);
    expect(result.waterUsage).toBe(8);
    expect(result.electricCost).toBe(55 * 3500); // 192,500
    expect(result.waterCost).toBe(8 * 25000); // 200,000
    expect(result.servicePrice).toBe(100000);
    expect(result.basePrice).toBe(2500000);
    expect(result.totalAmount).toBe(2500000 + 192500 + 200000 + 100000); // 2,992,500
  });

  it("handles zero consumption gracefully when new readings equal old readings", () => {
    const input: CalculationInput = {
      basePrice: 3000000,
      oldElectric: 500,
      newElectric: 500,
      oldWater: 100,
      newWater: 100,
      electricPrice: 3500,
      waterPrice: 25000,
      servicePrice: 100000,
    };

    const result = calculateInvoice(input);

    expect(result.electricUsage).toBe(0);
    expect(result.waterUsage).toBe(0);
    expect(result.electricCost).toBe(0);
    expect(result.waterCost).toBe(0);
    expect(result.totalAmount).toBe(3100000); // 3,000,000 + 100,000
  });

  it("clamps negative consumption to zero if new meter is smaller than old meter", () => {
    const input: CalculationInput = {
      basePrice: 2800000,
      oldElectric: 300,
      newElectric: 250, // Invalid meter entry (new < old)
      oldWater: 50,
      newWater: 45, // Invalid meter entry (new < old)
      electricPrice: 3500,
      waterPrice: 25000,
      servicePrice: 80000,
    };

    const result = calculateInvoice(input);

    expect(result.electricUsage).toBe(0);
    expect(result.waterUsage).toBe(0);
    expect(result.electricCost).toBe(0);
    expect(result.waterCost).toBe(0);
    expect(result.totalAmount).toBe(2880000);
  });

  it("properly rounds currency amounts when rates or usages have fractional parts", () => {
    const input: CalculationInput = {
      basePrice: 2500000.4,
      oldElectric: 100,
      newElectric: 133.3, // 33.3 usage
      oldWater: 10,
      newWater: 15.5, // 5.5 usage
      electricPrice: 3850.5,
      waterPrice: 27333.33,
      servicePrice: 99999.6,
    };

    const result = calculateInvoice(input);

    expect(result.electricCost).toBe(Math.round((133.3 - 100) * 3850.5)); // Math.round(33.3 * 3850.5) = 128222
    expect(result.waterCost).toBe(Math.round(5.5 * 27333.33)); // Math.round(150333.315) = 150333
    expect(result.servicePrice).toBe(100000);
    expect(result.basePrice).toBe(2500000);
    expect(result.totalAmount).toBe(
      result.basePrice + result.electricCost + result.waterCost + result.servicePrice
    );
  });

  it("supports large enterprise values without arithmetic overflow or NaN", () => {
    const input: CalculationInput = {
      basePrice: 150000000, // 150 million
      oldElectric: 100000,
      newElectric: 150000, // 50,000 kWh
      oldWater: 10000,
      newWater: 18000, // 8,000 m3
      electricPrice: 4000,
      waterPrice: 30000,
      servicePrice: 5000000,
    };

    const result = calculateInvoice(input);

    expect(result.electricUsage).toBe(50000);
    expect(result.waterUsage).toBe(8000);
    expect(result.electricCost).toBe(200000000);
    expect(result.waterCost).toBe(240000000);
    expect(result.totalAmount).toBe(150000000 + 200000000 + 240000000 + 5000000); // 595,000,000
    expect(Number.isFinite(result.totalAmount)).toBe(true);
  });

  it("ensures subtotal summation matches totalAmount exactly across 100 random combinations", () => {
    for (let i = 0; i < 100; i++) {
      const oldE = Math.floor(Math.random() * 500);
      const newE = oldE + Math.floor(Math.random() * 300);
      const oldW = Math.floor(Math.random() * 100);
      const newW = oldW + Math.floor(Math.random() * 50);
      const eRate = 2000 + Math.floor(Math.random() * 3000);
      const wRate = 15000 + Math.floor(Math.random() * 20000);
      const sRate = 50000 + Math.floor(Math.random() * 100000);
      const base = 2000000 + Math.floor(Math.random() * 4000000);

      const res = calculateInvoice({
        basePrice: base,
        oldElectric: oldE,
        newElectric: newE,
        oldWater: oldW,
        newWater: newW,
        electricPrice: eRate,
        waterPrice: wRate,
        servicePrice: sRate,
      });

      expect(res.totalAmount).toBe(
        res.basePrice + res.electricCost + res.waterCost + res.servicePrice
      );
      expect(res.electricUsage).toBe(newE - oldE);
      expect(res.waterUsage).toBe(newW - oldW);
    }
  });

  it("accurately applies promotional discount and deducts from grand total", () => {
    const input: CalculationInput = {
      basePrice: 3000000,
      oldElectric: 100,
      newElectric: 200, // 100 kWh * 4000 = 400,000
      oldWater: 20,
      newWater: 30, // 10 m3 * 15000 = 150,000
      electricPrice: 4000,
      waterPrice: 15000,
      servicePrice: 50000,
      discount: 200000, // Event discount 200k
    };

    const result = calculateInvoice(input);
    expect(result.discount).toBe(200000);
    // Subtotal: 3,000,000 + 400,000 + 150,000 + 50,000 = 3,600,000
    // Grand total: 3,600,000 - 200,000 = 3,400,000
    expect(result.totalAmount).toBe(3400000);
  });

  it("clamps grand total to zero if discount exceeds the total invoice amount", () => {
    const input: CalculationInput = {
      basePrice: 1000000,
      oldElectric: 0,
      newElectric: 0,
      oldWater: 0,
      newWater: 0,
      electricPrice: 3500,
      waterPrice: 25000,
      servicePrice: 0,
      discount: 2000000, // Discount greater than subtotal
    };

    const result = calculateInvoice(input);
    expect(result.totalAmount).toBe(0);
  });

  describe("Prorated Rent Calculations (R1)", () => {
    it("calculates prorated rent for 10 days in a 30-day month (3,000,000 -> 1,000,000)", () => {
      const prorated = calculateProratedRent(3000000, 30, 10);
      expect(prorated).toBe(1000000);
    });

    it("calculates prorated rent for 14 days in February (28 days, 2,800,000 -> 1,400,000)", () => {
      const prorated = calculateProratedRent(2800000, 28, 14);
      expect(prorated).toBe(1400000);
    });

    it("returns 0 for 0 stay days or non-positive days in month", () => {
      expect(calculateProratedRent(3000000, 30, 0)).toBe(0);
      expect(calculateProratedRent(3000000, 0, 10)).toBe(0);
      expect(calculateProratedRent(3000000, -1, 10)).toBe(0);
    });

    it("clamps stay days to the total days in month", () => {
      expect(calculateProratedRent(3000000, 30, 35)).toBe(3000000);
    });

    it("calculates invoice with isProrated flag enabled", () => {
      const input: CalculationInput = {
        basePrice: 3000000,
        oldElectric: 0,
        newElectric: 0,
        oldWater: 0,
        newWater: 0,
        electricPrice: 3500,
        waterPrice: 25000,
        servicePrice: 0,
        isProrated: true,
        daysInMonth: 30,
        stayDays: 10,
      };
      const result = calculateInvoice(input);
      expect(result.basePrice).toBe(1000000);
      expect(result.originalBasePrice).toBe(3000000);
      expect(result.totalAmount).toBe(1000000);
      expect(result.isProrated).toBe(true);
      expect(result.stayDays).toBe(10);
    });

    it("computes stay days correctly between start and end dates inclusive", () => {
      expect(calculateStayDaysFromDates("2026-09-01", "2026-09-10")).toBe(10);
      expect(calculateStayDaysFromDates("2026-09-05", "2026-09-05")).toBe(1);
      expect(calculateStayDaysFromDates("2026-09-10", "2026-09-01")).toBe(0);
    });

    it("returns correct days in month across calendar months", () => {
      expect(getDaysInMonth("2026-02")).toBe(28);
      expect(getDaysInMonth("2024-02")).toBe(29);
      expect(getDaysInMonth("2026-04")).toBe(30);
      expect(getDaysInMonth("2026-08")).toBe(31);
    });
  });

  describe("Partial Payment & Debt Forgiveness Calculations (R2)", () => {
    it("evaluates unpaid status when paidAmount is 0", () => {
      const status = calculatePaymentStatus(3000000, 0);
      expect(status.status).toBe("pending");
      expect(status.label).toBe("Chưa thu");
      expect(status.remainingAmount).toBe(3000000);
    });

    it("evaluates partially paid status when paidAmount is less than totalAmount", () => {
      const status = calculatePaymentStatus(3000000, 2000000);
      expect(status.status).toBe("partial");
      expect(status.label).toBe("Còn nợ");
      expect(status.remainingAmount).toBe(1000000);
    });

    it("evaluates fully paid status when paidAmount equals or exceeds totalAmount", () => {
      const status = calculatePaymentStatus(3000000, 3000000);
      expect(status.status).toBe("paid");
      expect(status.label).toBe("Đã thu");
      expect(status.remainingAmount).toBe(0);

      const overpaid = calculatePaymentStatus(3000000, 3500000);
      expect(overpaid.status).toBe("paid");
      expect(overpaid.remainingAmount).toBe(0);
    });

    it("forgives remaining debt by transferring debt to discount and balancing invoice to 0", () => {
      const forgiven = forgiveRemainingDebt({
        subtotal: 3000000,
        currentDiscount: 0,
        paidAmount: 2000000,
      });

      expect(forgiven.newDiscount).toBe(1000000);
      expect(forgiven.newTotalAmount).toBe(2000000);
      expect(forgiven.remainingAmount).toBe(0);
      expect(forgiven.newReason).toContain("Miễn giảm nợ khi tất toán");
    });
  });
});

describe("Unit Test: Natural Room Code Ordering", () => {
  it("sorts room codes naturally from P1 to P10 without P10 appearing right after P1", async () => {
    const { compareRoomCodes } = await import("../../src/lib/utils.ts");
    const rawCodes = ["P1", "P10", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"];
    const sorted = [...rawCodes].sort(compareRoomCodes);

    expect(sorted).toEqual(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"]);
  });

  it("sorts room objects by room.code property naturally", async () => {
    const { compareRoomCodes } = await import("../../src/lib/utils.ts");
    const rooms = [
      { id: "10", code: "P10" },
      { id: "1", code: "P1" },
      { id: "2", code: "P2" },
      { id: "5", code: "P5" },
    ];
    const sorted = [...rooms].sort(compareRoomCodes);

    expect(sorted.map((r) => r.code)).toEqual(["P1", "P2", "P5", "P10"]);
  });
});


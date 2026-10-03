import { describe, it, expect } from "vitest";
import { calculateInvoice } from "../../src/lib/calculations/invoice.ts";
import type { CalculationInput, CustomFeeItem } from "../../src/types/index.ts";

describe("Custom Other Fees (Mục số 4: Chi phí khác theo phòng)", () => {
  it("computes total custom fees based on unitPrice and quantity for each item", () => {
    const customFees: CustomFeeItem[] = [
      { name: "Tiền rác", unitPrice: 30000, quantity: 1 },
      { name: "Gửi xe máy", unitPrice: 100000, quantity: 2 },
      { name: "Wifi cáp quang", unitPrice: 50000, quantity: 1 },
    ];

    const input: CalculationInput = {
      basePrice: 2000000,
      oldElectric: 100,
      newElectric: 150, // 50 kWh
      oldWater: 10,
      newWater: 15, // 5 m3
      electricPrice: 3500,
      waterPrice: 25000,
      customFees,
    };

    const result = calculateInvoice(input);

    // 50 * 3500 = 175,000
    expect(result.electricCost).toBe(175000);
    // 5 * 25000 = 125,000
    expect(result.waterCost).toBe(125000);
    // Custom fees: 30k*1 + 100k*2 + 50k*1 = 280,000
    expect(result.servicePrice).toBe(280000);
    expect(result.customFees).toHaveLength(3);
    // Total = 2,000,000 + 175,000 + 125,000 + 280,000 = 2,580,000
    expect(result.totalAmount).toBe(2580000);
  });

  it("handles room with zero custom fees (no default service fee forced)", () => {
    const input: CalculationInput = {
      basePrice: 3000000,
      oldElectric: 200,
      newElectric: 200,
      oldWater: 30,
      newWater: 30,
      electricPrice: 3500,
      waterPrice: 25000,
      customFees: [],
    };

    const result = calculateInvoice(input);

    expect(result.servicePrice).toBe(0);
    expect(result.totalAmount).toBe(3000000);
  });

  it("calculates custom fees with discount and partial payments", () => {
    const customFees: CustomFeeItem[] = [
      { name: "Dịch vụ giặt ủi", unitPrice: 120000, quantity: 1 },
      { name: "Vệ sinh phòng", unitPrice: 50000, quantity: 2 },
    ];

    const input: CalculationInput = {
      basePrice: 2500000,
      oldElectric: 0,
      newElectric: 0,
      oldWater: 0,
      newWater: 0,
      electricPrice: 3500,
      waterPrice: 25000,
      customFees,
      discount: 100000, // giảm 100k
      paidAmount: 2000000, // trả trước 2tr
    };

    const result = calculateInvoice(input);

    // subtotal = 2,500,000 + 0 + 0 + (120k + 100k) = 2,720,000
    // total = 2,720,000 - 100,000 = 2,620,000
    expect(result.servicePrice).toBe(220000);
    expect(result.totalAmount).toBe(2620000);
    expect(result.paidAmount).toBe(2000000);
    expect(result.remainingBalance).toBe(620000);
    expect(result.paymentStatus.status).toBe("partial");
  });

  it("falls back to legacy servicePrice if customFees is omitted", () => {
    const input: CalculationInput = {
      basePrice: 2000000,
      oldElectric: 0,
      newElectric: 0,
      oldWater: 0,
      newWater: 0,
      electricPrice: 3500,
      waterPrice: 25000,
      servicePrice: 150000,
    };

    const result = calculateInvoice(input);

    expect(result.servicePrice).toBe(150000);
    expect(result.totalAmount).toBe(2150000);
  });
});

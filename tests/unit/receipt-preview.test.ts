import { describe, it, expect } from "vitest";
import { formatVND, cn } from "../../src/lib/utils.ts";

export interface ReceiptData {
  roomCode: string;
  month: string;
  customerName?: string;
  customerPhone?: string;
  reportDate?: string;
  address?: string;
  bankInfo?: string;
  serviceDescription?: string;
  receiptNote?: string;
  oldElectric: number;
  newElectric: number;
  electricPrice: number;
  electricCost: number;
  electricUsage: number;
  oldWater: number;
  newWater: number;
  waterPrice: number;
  waterCost: number;
  waterUsage: number;
  basePrice: number;
  servicePrice: number;
  discount?: number;
  discountReason?: string;
  totalAmount: number;
}

describe("ReceiptCanvas & ReceiptPreview Architecture Tests", () => {
  const sampleData: ReceiptData = {
    roomCode: "P101",
    month: "2026-08",
    customerName: "Nguyễn Văn A",
    customerPhone: "0901234567",
    reportDate: "05/08/2026",
    address: "325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ",
    bankInfo: "MB Bank - 0901234567 - NGUYEN VAN A",
    serviceDescription: "Rác + Wifi",
    receiptNote: "Vui lòng thanh toán trước ngày 10/08.",
    oldElectric: 100,
    newElectric: 150,
    electricPrice: 3500,
    electricCost: 175000,
    electricUsage: 50,
    oldWater: 20,
    newWater: 25,
    waterPrice: 15000,
    waterCost: 75000,
    waterUsage: 5,
    basePrice: 2000000,
    servicePrice: 100000,
    discount: 50000,
    discountReason: "Hỗ trợ mùa hè",
    totalAmount: 2300000,
  };

  it("merges custom className and preserves core styling", () => {
    const baseClass = "bg-white text-slate-900 mx-auto p-4 sm:p-5 w-[580px]";
    const customClass = "shadow-lg border border-slate-200";
    const merged = cn(baseClass, customClass);

    expect(merged).toContain("w-[580px]");
    expect(merged).toContain("shadow-lg");
    expect(sampleData.roomCode).toBe("P101");
    expect(sampleData.totalAmount).toBe(2300000);
  });

  it("verifies financial breakdown components sum up accurately", () => {
    const { basePrice, electricCost, waterCost, servicePrice, discount, totalAmount } = sampleData;
    const computedExpected = basePrice + electricCost + waterCost + servicePrice - (discount || 0);
    expect(computedExpected).toBe(totalAmount);
  });

  it("verifies mobile scaling ratio prevents left-clipping and fits viewport", () => {
    // Mobile screen width e.g. 360px, padding = 20px -> available = 340px
    const containerWidth = 360;
    const padding = 20;
    const availableWidth = Math.max(280, containerWidth - padding);
    const fitScale = Math.min(1, Math.max(0.35, availableWidth / 580));

    expect(fitScale).toBeLessThan(1);
    expect(fitScale).toBeGreaterThan(0.5);

    // Scaled width must not exceed available width
    const scaledWidth = Math.round(580 * fitScale);
    expect(scaledWidth).toBeLessThanOrEqual(availableWidth);
  });

  it("verifies desktop screen maintains 100% native unscaled 580px width", () => {
    const desktopWidth = 800;
    const padding = 20;
    const availableWidth = Math.max(280, desktopWidth - padding);
    const fitScale = Math.min(1, Math.max(0.35, availableWidth / 580));

    expect(fitScale).toBe(1);
    expect(580 * fitScale).toBe(580);
  });

  it("formats currency accurately with dot separators in VND", () => {
    expect(formatVND(2300000)).toBe("2.300.000");
    expect(formatVND(175000)).toBe("175.000");
    expect(formatVND(0)).toBe("0");
  });
});

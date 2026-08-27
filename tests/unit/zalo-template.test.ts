import { describe, it, expect } from "vitest";
import { buildZaloMessage } from "../fixtures/seed-data.ts";

describe("Unit Test: Vietnamese Zalo / SMS Message Template", () => {
  it("generates exact verbatim message for standard room invoice", () => {
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

    const expected =
      "Phòng P101 - Tiền tháng 2026-08: Tổng 3.425.000đ (Điện: 55 số = 192.500đ | Nước: 8 m³ = 200.000đ | Dịch vụ: 100.000đ). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!";

    expect(msg).toBe(expected);
  });

  it("formats zero consumption and costs accurately with 0đ values", () => {
    const msg = buildZaloMessage({
      roomCode: "P105",
      month: "2026-09",
      totalAmount: 3100000,
      electricUsage: 0,
      electricCost: 0,
      waterUsage: 0,
      waterCost: 0,
      serviceCost: 100000,
    });

    const expected =
      "Phòng P105 - Tiền tháng 2026-09: Tổng 3.100.000đ (Điện: 0 số = 0đ | Nước: 0 m³ = 0đ | Dịch vụ: 100.000đ). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!";

    expect(msg).toBe(expected);
  });

  it("handles room codes with special Vietnamese characters and alphanumeric formats", () => {
    const msg = buildZaloMessage({
      roomCode: "Tầng Lửng 01",
      month: "2026-10",
      totalAmount: 4500000,
      electricUsage: 120,
      electricCost: 420000,
      waterUsage: 15,
      waterCost: 375000,
      serviceCost: 150000,
    });

    expect(msg).toContain("Phòng Tầng Lửng 01 - Tiền tháng 2026-10");
    expect(msg).toContain("Tổng 4.500.000đ");
    expect(msg).toContain("Điện: 120 số = 420.000đ");
    expect(msg).toContain("Nước: 15 m³ = 375.000đ");
    expect(msg).toContain("Dịch vụ: 150.000đ");
    expect(msg).endsWith("Vui lòng thanh toán trước ngày 05. Xin cảm ơn!");
  });

  it("verifies all Vietnamese diacritics and punctuation are preserved intact", () => {
    const msg = buildZaloMessage({
      roomCode: "P203",
      month: "2026-08",
      totalAmount: 2850000,
      electricUsage: 40,
      electricCost: 140000,
      waterUsage: 6,
      waterCost: 150000,
      serviceCost: 100000,
    });

    // Check key Vietnamese substrings
    expect(msg).toMatch(/^Phòng /);
    expect(msg).toContain(" - Tiền tháng ");
    expect(msg).toContain(": Tổng ");
    expect(msg).toContain(" (Điện: ");
    expect(msg).toContain(" số = ");
    expect(msg).toContain(" | Nước: ");
    expect(msg).toContain(" m³ = ");
    expect(msg).toContain(" | Dịch vụ: ");
    expect(msg).toContain("). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!");
  });

  it("formats massive currency numbers with thousands separators correctly", () => {
    const msg = buildZaloMessage({
      roomCode: "VIP-999",
      month: "2026-12",
      totalAmount: 125678000,
      electricUsage: 5000,
      electricCost: 17500000,
      waterUsage: 350,
      waterCost: 8750000,
      serviceCost: 2000000,
    });

    expect(msg).toContain("Tổng 125.678.000đ");
    expect(msg).toContain("17.500.000đ");
    expect(msg).toContain("8.750.000đ");
    expect(msg).toContain("2.000.000đ");
  });
});

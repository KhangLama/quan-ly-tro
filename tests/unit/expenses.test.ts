import { describe, it, expect, beforeEach } from "vitest";
import { MockSupabaseEngine } from "../fixtures/seed-data.ts";

describe("Unit Test: Operational Expenses Management", () => {
  let db: MockSupabaseEngine;

  beforeEach(() => {
    db = new MockSupabaseEngine();
  });

  it("inserts new expense items and calculates exact line total and month totals", async () => {
    const expenseData = [
      {
        month: "2026-08",
        date: "2026-08-26",
        item_name: "Sửa khoá từ",
        category: "Sửa chữa",
        status: "pending",
        unit_price: 200000,
        quantity: 1,
        total_amount: 200000,
      },
      {
        month: "2026-08",
        date: "2026-08-27",
        item_name: "Wifi",
        category: "Internet",
        status: "pending",
        unit_price: 1100000,
        quantity: 2,
        total_amount: 2200000,
      },
      {
        month: "2026-08",
        date: "2026-08-27",
        item_name: "Ổ khoá số",
        category: "Phụ kiện",
        status: "paid",
        unit_price: 180000,
        quantity: 1,
        total_amount: 180000,
      },
    ];

    for (const exp of expenseData) {
      await db.from("expenses").insert(exp);
    }

    const { data: monthExpenses } = await db
      .from("expenses")
      .select("*")
      .eq("month", "2026-08");

    expect(monthExpenses).toHaveLength(3);

    const total = (monthExpenses || []).reduce((acc: number, cur: any) => acc + cur.total_amount, 0);
    expect(total).toBe(200000 + 2200000 + 180000); // 2,580,000

    const pending = (monthExpenses || [])
      .filter((e: any) => e.status === "pending")
      .reduce((acc: number, cur: any) => acc + cur.total_amount, 0);
    expect(pending).toBe(2400000);

    const paid = (monthExpenses || [])
      .filter((e: any) => e.status === "paid")
      .reduce((acc: number, cur: any) => acc + cur.total_amount, 0);
    expect(paid).toBe(180000);
  });
});

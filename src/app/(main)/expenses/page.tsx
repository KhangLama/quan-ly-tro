import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getExpenses } from "@/actions/expenses";
import { getSettings } from "@/actions/settings";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export const metadata = {
  title: "Quản lý Chi phí - Nhà trọ Trúc Lam",
  description: "Theo dõi và quản lý chi phí phát sinh hàng tháng của nhà trọ",
};

export default async function ExpensesPage() {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [expenseData, settings] = await Promise.all([
    getExpenses(currentMonth),
    getSettings(),
  ]);

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-200">
      {/* Breadcrumb back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>

      <ExpenseList
        initialExpenses={expenseData.expenses}
        initialMonth={currentMonth}
        initialTotalAmount={expenseData.totalAmount}
        initialTotalPendingAmount={expenseData.totalPendingAmount}
        initialTotalPaidAmount={expenseData.totalPaidAmount}
        innName="NHÀ TRỌ TRÚC LAM"
      />
    </div>
  );
}

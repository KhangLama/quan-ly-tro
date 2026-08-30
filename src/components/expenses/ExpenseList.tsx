"use client";

import React, { useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Receipt,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Edit2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatVND } from "@/lib/utils";
import {
  toggleExpenseStatus,
  deleteExpense,
  type CreateExpenseInput,
} from "@/actions/expenses";
import { AddExpenseModal } from "./AddExpenseModal";
import { EditExpenseModal } from "./EditExpenseModal";
import { VietnameseMonthPicker } from "@/components/ui/VietnameseMonthPicker";
import { toPng, toBlob } from "html-to-image";
import type { Expense } from "@/types";

interface ExpenseListProps {
  initialExpenses: Expense[];
  initialMonth: string;
  initialTotalAmount: number;
  initialTotalPendingAmount: number;
  initialTotalPaidAmount: number;
  innName?: string;
  onRefresh?: () => void;
}

export function ExpenseList({
  initialExpenses,
  initialMonth,
  initialTotalAmount,
  initialTotalPendingAmount,
  initialTotalPaidAmount,
  innName = "NHÀ TRỌ TRÚC LAM",
}: ExpenseListProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState<string>(initialMonth);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [totalAmount, setTotalAmount] = useState<number>(initialTotalAmount);
  const [totalPendingAmount, setTotalPendingAmount] = useState<number>(
    initialTotalPendingAmount
  );
  const [totalPaidAmount, setTotalPaidAmount] = useState<number>(
    initialTotalPaidAmount
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Re-fetch data when month changes
  const fetchExpenses = async (targetMonth: string) => {
    setLoading(true);
    try {
      const { getExpenses } = await import("@/actions/expenses");
      const res = await getExpenses(targetMonth);
      setExpenses(res.expenses);
      setTotalAmount(res.totalAmount);
      setTotalPendingAmount(res.totalPendingAmount);
      setTotalPaidAmount(res.totalPaidAmount);
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    fetchExpenses(newMonth);
  };

  // Toggle status
  const handleToggleStatus = async (id: string) => {
    const res = await toggleExpenseStatus(id);
    if (res.success) {
      fetchExpenses(month);
    } else {
      alert(res.error || "Không thể cập nhật trạng thái");
    }
  };

  // Delete
  const handleDelete = async (exp: Expense) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khoản chi "${exp.item_name}" (${formatVND(exp.total_amount)}đ)?`
    );
    if (!confirmed) return;

    const res = await deleteExpense(exp.id);
    if (res.success) {
      fetchExpenses(month);
    } else {
      alert(res.error || "Không thể xóa khoản chi");
    }
  };

  // Format date helper: "2026-08-26" -> "26/08/2026"
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Filtered expenses
  const displayedExpenses = expenses.filter((exp) => {
    if (filterCategory === "all") return true;
    return (exp.category || "Khác") === filterCategory;
  });

  // Unique categories for filter
  const categories = Array.from(new Set(expenses.map((e) => e.category || "Khác")));

  // Handle Share Table as Image
  const handleShareImage = async () => {
    if (!tableRef.current) return;
    try {
      setSharing(true);
      const blob = await toBlob(tableRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      if (!blob) throw new Error("Could not generate image blob");

      const file = new File(
        [blob],
        `Bang_Chi_Phi_${innName.replace(/\s+/g, "_")}_${month}.png`,
        { type: "image/png" }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
        });
      } else {
        // Fallback download
        const dataUrl = await toPng(tableRef.current, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
        const link = document.createElement("a");
        link.download = `Bang_Chi_Phi_${innName.replace(/\s+/g, "_")}_${month}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Share failed", err);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>Quản Lý Chi Phí</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi các khoản sửa chữa, điện nước, phụ kiện, internet...
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Picker */}
          <VietnameseMonthPicker
            value={month}
            onChange={handleMonthChange}
            showQuickNav={true}
          />

          {/* Add Expense Button */}
          <Button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 h-9 px-3.5 rounded-2xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm chi phí</span>
          </Button>

          {/* Share/Export Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleShareImage}
            isLoading={sharing}
            className="text-xs font-bold gap-1.5 h-9 px-3 rounded-2xl text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Chia sẻ ảnh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Pending (Chưa thanh toán) */}
        <Card className="p-4 bg-gradient-to-br from-rose-50 to-white border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Tổng chưa thanh toán
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="text-xl font-black text-rose-600 mt-2">
            {formatVND(totalPendingAmount)} đ
          </div>
          <p className="text-[11px] text-rose-500 mt-0.5 font-medium">
            {expenses.filter((e) => e.status !== "paid").length} khoản chi cần thanh toán
          </p>
        </Card>

        {/* Total Paid (Đã thanh toán) */}
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Tổng đã thanh toán
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2">
            {formatVND(totalPaidAmount)} đ
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            {expenses.filter((e) => e.status === "paid").length} khoản chi đã quyết toán
          </p>
        </Card>

        {/* Total Month Expenses */}
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-white border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tổng chi phí tháng
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {month}
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatVND(totalAmount)} đ
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Tổng cộng {expenses.length} khoản chi phát sinh
          </p>
        </Card>
      </div>

      {/* Filter Category Row */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3" /> Lọc:
          </span>
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterCategory === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tất cả ({expenses.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat} ({expenses.filter((e) => (e.category || "Khác") === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* Main Expense Table Container */}
      <div
        ref={tableRef}
        id="expenses-table-canvas"
        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6"
      >
        {/* Table Canvas Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <h2 className="text-xl font-black text-[#1E3A8A] tracking-wider uppercase">
              CHI PHÍ {innName}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Bảng kê khai chi phí phát sinh — Tháng {month}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-600 mr-2">
              Tổng chưa thanh toán:
            </span>
            <span className="text-lg font-black text-rose-600">
              {formatVND(totalPendingAmount)} đ
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#2B4C7E] text-white text-xs font-bold tracking-wide">
                <th className="py-2.5 px-3 border border-[#1E3A8A] text-center w-12 whitespace-nowrap">
                  STT
                </th>
                <th className="py-2.5 px-3 border border-[#1E3A8A] text-center w-28 whitespace-nowrap">
                  Ngày
                </th>
                <th className="py-2.5 px-4 border border-[#1E3A8A] min-w-[240px]">
                  Hạng mục
                </th>
                <th className="py-2.5 px-3 border border-[#1E3A8A] text-center w-28 whitespace-nowrap">
                  Phân loại
                </th>
                <th className="py-2.5 px-3 border border-[#1E3A8A] text-center w-36 whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="py-2.5 px-3 border border-[#1E3A8A] text-right w-28 whitespace-nowrap">
                  Đơn giá
                </th>
                <th className="py-2.5 px-3 border border-[#1E3A8A] text-center w-20 whitespace-nowrap">
                  Số lượng
                </th>
                <th className="py-2.5 px-3 border border-[#1E3A8A] text-right w-32 whitespace-nowrap">
                  Thành tiền
                </th>
                <th className="py-2.5 px-4 border border-[#1E3A8A] min-w-[180px]">
                  Ghi chú
                </th>
                <th className="py-2.5 px-2 border border-[#1E3A8A] text-center w-20 print:hidden whitespace-nowrap">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-8 text-slate-400 font-medium italic border border-slate-200"
                  >
                    Chưa có khoản chi nào trong tháng {month}. Bấm &quot;Thêm chi phí&quot; để tạo mới!
                  </td>
                </tr>
              ) : (
                displayedExpenses.map((exp, idx) => {
                  const isPaid = exp.status === "paid";
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* STT */}
                      <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-slate-700 whitespace-nowrap">
                        {idx + 1}
                      </td>

                      {/* Ngày */}
                      <td className="py-2.5 px-3 border border-slate-200 text-center font-medium text-slate-800 whitespace-nowrap">
                        {formatDateDisplay(exp.date)}
                      </td>

                      {/* Hạng mục */}
                      <td className="py-2.5 px-4 border border-slate-200 font-semibold text-slate-900 min-w-[240px] leading-relaxed break-words">
                        {exp.item_name}
                      </td>

                      {/* Phân loại badge */}
                      <td className="py-2.5 px-2 border border-slate-200 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {exp.category || "Khác"}
                        </span>
                      </td>

                      {/* Trạng thái - Clickable toggle with pill badge styling */}
                      <td className="py-2.5 px-2 border border-slate-200 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(exp.id)}
                          title="Bấm để đổi trạng thái"
                          className={`w-full max-w-[130px] mx-auto py-1 px-2.5 rounded-full font-extrabold text-[11px] transition-transform active:scale-95 shadow-xs ${
                            isPaid
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-[#990000] hover:bg-[#7a0000] text-white"
                          }`}
                        >
                          {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                        </button>
                      </td>

                      {/* Đơn giá */}
                      <td className="py-2.5 px-3 border border-slate-200 text-right font-medium text-slate-800 whitespace-nowrap">
                        {formatVND(exp.unit_price)} đ
                      </td>

                      {/* Số lượng */}
                      <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-slate-800 whitespace-nowrap">
                        {exp.quantity}
                      </td>

                      {/* Thành tiền */}
                      <td className="py-2.5 px-3 border border-slate-200 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatVND(exp.total_amount)} đ
                      </td>

                      {/* Ghi chú */}
                      <td className="py-2.5 px-4 border border-slate-200 text-xs text-slate-600 min-w-[180px] leading-relaxed break-words">
                        {exp.notes || ""}
                      </td>

                      {/* Action buttons: Edit and Delete */}
                      <td className="py-2.5 px-2 border border-slate-200 text-center print:hidden whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingExpense(exp)}
                            title="Chỉnh sửa khoản chi này"
                            aria-label="Chỉnh sửa chi phí"
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(exp)}
                            title="Xóa khoản chi này"
                            aria-label="Xóa chi phí"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer: Total Row */}
            {displayedExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/80 font-extrabold text-xs text-slate-900">
                  <td colSpan={7} className="py-2.5 px-3 border border-slate-200 text-right uppercase tracking-wider">
                    Tổng cộng:
                  </td>
                  <td className="py-2.5 px-3 border border-slate-200 text-right text-indigo-700 font-black whitespace-nowrap">
                    {formatVND(
                      displayedExpenses.reduce((acc, curr) => acc + curr.total_amount, 0)
                    )} đ
                  </td>
                  <td colSpan={2} className="border border-slate-200 bg-slate-100/80" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currentMonth={month}
        onSuccess={() => fetchExpenses(month)}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        onSuccess={() => fetchExpenses(month)}
      />
    </div>
  );
}

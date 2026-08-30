"use client";

import React, { useState, useEffect } from "react";
import { Edit3, X, Tag, Calendar, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateExpense } from "@/actions/expenses";
import { formatVND } from "@/lib/utils";
import type { Expense } from "@/types";

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Sửa chữa",
  "Phụ kiện",
  "Camera",
  "Internet",
  "Điện nước",
  "Vệ sinh",
  "Nội thất",
  "Khác",
];

export function EditExpenseModal({
  isOpen,
  onClose,
  expense,
  onSuccess,
}: EditExpenseModalProps) {
  const [date, setDate] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Sửa chữa");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<"pending" | "paid">("pending");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (expense) {
      setDate(expense.date || "");
      setItemName(expense.item_name || "");
      setCategory(expense.category || "Sửa chữa");
      setUnitPrice(String(expense.unit_price || 0));
      setQuantity(String(expense.quantity || 1));
      setStatus(expense.status || "pending");
      setNotes(expense.notes || "");
      setErrorMsg(null);
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const totalAmount = (Number(unitPrice) || 0) * (Number(quantity) || 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setErrorMsg("Vui lòng nhập tên hạng mục chi phí");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const expenseMonth = date.substring(0, 7) || expense.month;

    const res = await updateExpense(expense.id, {
      month: expenseMonth,
      date,
      item_name: itemName.trim(),
      category,
      unit_price: Number(unitPrice) || 0,
      quantity: Number(quantity) || 1,
      status,
      notes: notes.trim(),
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || "Không thể cập nhật chi phí");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Chỉnh sửa khoản chi
              </h2>
              <p className="text-[11px] text-slate-500">
                Cập nhật thông tin chi phí phòng trọ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Ngày chi */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Ngày phát sinh</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="text-xs font-semibold"
            />
          </div>

          {/* Hạng mục chi */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Hạng mục (Tên công việc / Mua sắm)</span>
            </label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Sửa khóa từ, Mua bóng đèn, Wifi..."
              required
              className="text-xs font-bold"
            />
          </div>

          {/* Phân loại danh mục */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Phân loại</span>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    category === cat
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Đơn giá & Số lượng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                <span>Đơn giá (VNĐ)</span>
              </label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                min="0"
                required
                placeholder="0"
                className="font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Số lượng
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                required
                className="font-bold text-center text-slate-900"
              />
            </div>
          </div>

          {/* Thành tiền realtime preview */}
          <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-900">
              Thành tiền:
            </span>
            <strong className="text-sm font-black text-indigo-600">
              {formatVND(totalAmount)} đ
            </strong>
          </div>

          {/* Trạng thái thanh toán */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              Trạng thái thanh toán
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("pending")}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                  status === "pending"
                    ? "bg-rose-50 border-rose-400 text-rose-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Chưa thanh toán
              </button>
              <button
                type="button"
                onClick={() => setStatus("paid")}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                  status === "paid"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Đã thanh toán
              </button>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Ghi chú (Tùy chọn)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mua của anh Nam, bảo hành 12 tháng..."
              className="text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-sm"
            >
              Cập nhật
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

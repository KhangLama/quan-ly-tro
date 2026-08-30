"use client";

import React, { useState } from "react";
import { Plus, X, Tag, Calendar, DollarSign, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { addExpense, type CreateExpenseInput } from "@/actions/expenses";
import { formatVND } from "@/lib/utils";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
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

export function AddExpenseModal({
  isOpen,
  onClose,
  currentMonth,
  onSuccess,
}: AddExpenseModalProps) {
  const today = new Date().toISOString().substring(0, 10);
  const [date, setDate] = useState(today);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Sửa chữa");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<"pending" | "paid">("pending");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = (Number(unitPrice) || 0) * (Number(quantity) || 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setErrorMsg("Vui lòng nhập tên hạng mục chi phí");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Extract month from selected date (e.g. "2026-08-26" -> "2026-08")
    const expenseMonth = date.substring(0, 7) || currentMonth;

    const res = await addExpense({
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
      // Reset form
      setItemName("");
      setUnitPrice("");
      setQuantity("1");
      setNotes("");
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || "Không thể thêm chi phí");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Thêm khoản chi mới
              </h2>
              <p className="text-[11px] text-slate-400">
                Tháng {currentMonth}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Row 1: Date & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Ngày phát sinh</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Phân loại</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Item Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Hạng mục / Nội dung chi phí *
            </label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Sửa khoá từ, Wifi, Dời camera..."
              required
              className="text-xs font-semibold"
            />
          </div>

          {/* Row 3: Unit Price & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Đơn giá (VNĐ)</span>
              </label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="200000"
                min="0"
                step="1000"
                required
                className="text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Số lượng
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                required
                className="text-xs font-semibold text-center"
              />
            </div>
          </div>

          {/* Total Amount Preview */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Thành tiền:</span>
            <span className="text-sm font-black text-indigo-700">
              {formatVND(totalAmount)} đ
            </span>
          </div>

          {/* Row 4: Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Trạng thái thanh toán
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("pending")}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                  status === "pending"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                🔴 Chưa thanh toán
              </button>
              <button
                type="button"
                onClick={() => setStatus("paid")}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                  status === "paid"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                🟢 Đã thanh toán
              </button>
            </div>
          </div>

          {/* Row 5: Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Ghi chú (Tùy chọn)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm nếu có..."
              className="text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-semibold h-10 px-4"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-10 px-5 shadow-sm"
            >
              Thêm khoản chi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

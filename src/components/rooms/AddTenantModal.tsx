"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { addTenant } from "@/actions/tenants";
import { UserPlus, Check } from "lucide-react";

interface AddTenantModalProps {
  roomId: string;
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTenantModal({
  roomId,
  roomCode,
  isOpen,
  onClose,
  onSuccess,
}: AddTenantModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cccd, setCccd] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [depositAmount, setDepositAmount] = useState("");
  const [isLead, setIsLead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setPhone("");
    setCccd("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setDepositAmount("");
    setIsLead(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên khách thuê");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await addTenant({
      room_id: roomId,
      name: name.trim(),
      phone: phone.trim() || null,
      cccd: cccd.trim() || null,
      start_date: startDate,
      deposit_amount: depositAmount ? Number(depositAmount) : 0,
      is_lead: isLead,
    });

    setLoading(false);

    if (res.success) {
      resetForm();
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Có lỗi xảy ra khi thêm khách thuê");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <span>Thêm khách thuê — Phòng {roomCode}</span>
        </div>
      }
      description="Điền thông tin khách mới hoặc khách ở ghép"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="e.g. Nguyễn Văn An"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số điện thoại
            </label>
            <Input
              placeholder="e.g. 0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số CCCD / CMND
            </label>
            <Input
              placeholder="e.g. 001090001234"
              value={cccd}
              onChange={(e) => setCccd(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày bắt đầu ở
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiền đặt cọc (VNĐ)
            </label>
            <Input
              type="number"
              placeholder="e.g. 2500000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isLead}
              onChange={(e) => setIsLead(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800">
                Người đại diện phòng (Đứng tên hợp đồng)
              </span>
              <p className="text-[11px] text-slate-500">
                Nhận tin nhắn hóa đơn và liên hệ chính
              </p>
            </div>
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" isLoading={loading} className="gap-1.5">
            <Check className="w-4 h-4" />
            Lưu khách thuê
          </Button>
        </div>
      </form>
    </Modal>
  );
}

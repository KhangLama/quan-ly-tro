"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createRoom } from "@/actions/rooms";
import { Plus, Building2 } from "lucide-react";

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRoomModal({ isOpen, onClose, onSuccess }: AddRoomModalProps) {
  const [code, setCode] = useState("");
  const [basePrice, setBasePrice] = useState("2500000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Vui lòng nhập mã phòng");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createRoom({
      code: code.trim(),
      base_price: Number(basePrice) || 0,
    });

    setLoading(false);

    if (res.room) {
      setCode("");
      setBasePrice("2500000");
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Không thể tạo phòng");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <span>Thêm phòng mới</span>
        </div>
      }
      description="Nhập mã phòng và đơn giá thuê hàng tháng"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mã phòng <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="e.g. P301"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Giá thuê cơ bản (VNĐ/tháng) <span className="text-rose-500">*</span>
          </label>
          <Input
            type="number"
            placeholder="e.g. 3000000"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            required
            min="0"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" isLoading={loading} className="gap-1.5 whitespace-nowrap">
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tạo phòng</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

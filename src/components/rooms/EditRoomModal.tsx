"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateRoom } from "@/actions/rooms";
import { Edit2, Check, Building2 } from "lucide-react";
import type { Room } from "@/types";

interface EditRoomModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRoomModal({
  room,
  isOpen,
  onClose,
  onSuccess,
}: EditRoomModalProps) {
  const [code, setCode] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (room && isOpen) {
      setCode(room.code || "");
      setBasePrice(room.base_price !== undefined ? String(room.base_price) : "");
      setError(null);
    }
  }, [room, isOpen]);

  if (!room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Vui lòng nhập tên / mã phòng (ví dụ: P101, Phòng 1)");
      return;
    }
    if (!basePrice || Number(basePrice) < 0) {
      setError("Vui lòng nhập giá phòng hợp lệ");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateRoom(room.id, {
      code: code.trim(),
      base_price: Number(basePrice),
    });

    setLoading(false);

    if (res.room && !res.error) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Có lỗi xảy ra khi cập nhật phòng");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-indigo-600" />
          <span>Sửa thông tin phòng</span>
        </div>
      }
      description={`Cập nhật mã phòng và giá thuê cho Phòng ${room.code}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tên / Mã phòng <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="e.g. P101, Phòng 1"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Mã phòng duy nhất để quản lý và in trên phiếu tiền phòng
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Giá thuê cơ bản (VNĐ / tháng) <span className="text-rose-500">*</span>
          </label>
          <Input
            type="number"
            placeholder="e.g. 3200000"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            required
            min="0"
            step="10000"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" isLoading={loading} className="gap-1.5 whitespace-nowrap">
            <Check className="w-4 h-4 shrink-0" />
            <span>Lưu thay đổi</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateRoom } from "@/actions/rooms";
import { getSettings } from "@/actions/settings";
import { DEFAULT_FURNITURE_CATALOG } from "@/lib/constants/furniture";
import { Edit2, Check, Building2, Armchair } from "lucide-react";
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
  const [catalog, setCatalog] = useState<string[]>(DEFAULT_FURNITURE_CATALOG);
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (room && isOpen) {
      setCode(room.code || "");
      setBasePrice(room.base_price !== undefined ? String(room.base_price) : "");
      setError(null);

      // Load master furniture catalog
      let loadedCatalog = DEFAULT_FURNITURE_CATALOG;
      if (typeof window !== "undefined") {
        try {
          const cachedCat = localStorage.getItem("app_furniture_catalog");
          if (cachedCat) {
            const parsed = JSON.parse(cachedCat);
            if (Array.isArray(parsed) && parsed.length > 0) loadedCatalog = parsed;
          }
        } catch {}
      }
      getSettings().then((res) => {
        const cat = (res.settings as any)?.furniture_catalog;
        if (cat && Array.isArray(cat) && cat.length > 0) {
          setCatalog(cat);
        } else {
          setCatalog(loadedCatalog);
        }
      });

      // Load room furniture
      let initialFurn = (room as any)?.furniture;
      if (!initialFurn && typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("room_furniture_" + room.id);
          if (cached) initialFurn = JSON.parse(cached);
        } catch {}
      }
      setSelectedFurniture(Array.isArray(initialFurn) ? initialFurn : []);
    }
  }, [room, isOpen]);

  if (!room) return null;

  const toggleItem = (item: string) => {
    setSelectedFurniture((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const selectAll = () => setSelectedFurniture([...catalog]);
  const clearAll = () => setSelectedFurniture([]);

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
      furniture: selectedFurniture,
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "room_furniture_" + room.id,
          JSON.stringify(selectedFurniture)
        );
      } catch {}
    }

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
      description={`Cập nhật mã phòng, giá thuê và nội thất cho Phòng ${room.code}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giá thuê cơ bản (VNĐ/tháng) <span className="text-rose-500">*</span>
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
        </div>

        {/* Furniture Selection Checklist */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Armchair className="w-4 h-4 text-indigo-600" />
              <span>Nội thất & Tiện ích trong phòng ({selectedFurniture.length}/{catalog.length})</span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={selectAll}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-slate-400 font-semibold hover:text-slate-600 hover:underline"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Bấm vào từng mục để đánh dấu phòng có trang bị nội thất nào:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50/70 rounded-2xl border border-slate-100">
            {catalog.map((item) => {
              const isSelected = selectedFurniture.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleItem(item)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold border transition-all text-left ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate pr-1">{item}</span>
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? "bg-white text-indigo-600 border-white"
                        : "border-slate-300 bg-slate-50"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" isLoading={loading} className="gap-1.5 whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Check className="w-4 h-4 shrink-0" />
            <span>Lưu thay đổi</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

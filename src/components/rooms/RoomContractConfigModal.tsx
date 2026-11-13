"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sliders,
  Armchair,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatVND } from "@/lib/utils";
import type { Room } from "@/types";
import type { RoomContractConfig, RentPriceStage } from "@/lib/contracts/template";
import { createDefaultRentStages } from "@/lib/contracts/template";
import {
  getRoomContractConfig,
  saveRoomContractConfig,
} from "@/actions/contracts";

interface RoomContractConfigModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function RoomContractConfigModal({
  room,
  isOpen,
  onClose,
  onSaved,
}: RoomContractConfigModalProps) {
  const [roomArea, setRoomArea] = useState("");
  const [defaultLeaseMonths, setDefaultLeaseMonths] = useState("12");
  const [defaultDepositAmount, setDefaultDepositAmount] = useState(
    String(room.base_price || 2000000)
  );
  const [roomAddressOverride, setRoomAddressOverride] = useState("");
  const [furnitureDetails, setFurnitureDetails] = useState<string[]>([]);
  const [specialTerms, setSpecialTerms] = useState<string[]>([]);
  const [enableStagedPricing, setEnableStagedPricing] = useState(false);
  const [rentStages, setRentStages] = useState<RentPriceStage[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getRoomRawFurniture = useCallback((): string[] => {
    let fList: string[] = (room as any)?.furniture || [];
    if ((!fList || fList.length === 0) && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`room_furniture_${room.id}`);
        if (cached) fList = JSON.parse(cached);
      } catch {}
    }
    return Array.isArray(fList) ? fList : [];
  }, [room]);

  const loadConfig = useCallback(async () => {
    if (!room?.id) return;
    setLoading(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const { config } = await getRoomContractConfig(room.id);
    setRoomArea(config.roomArea || "");
    setDefaultLeaseMonths(
      config.defaultLeaseMonths ? String(config.defaultLeaseMonths) : "12"
    );
    setDefaultDepositAmount(
      config.defaultDepositAmount !== undefined
        ? String(config.defaultDepositAmount)
        : String(room.base_price || 2000000)
    );
    setRoomAddressOverride(config.roomAddressOverride || "");

    if (
      Array.isArray(config.furnitureDetails) &&
      config.furnitureDetails.length > 0
    ) {
      setFurnitureDetails(config.furnitureDetails);
    } else {
      const rawFurniture = getRoomRawFurniture();
      if (rawFurniture.length > 0) {
        setFurnitureDetails(
          rawFurniture.map((item) => `${item}: 01 cái, hoạt động bình thường.`)
        );
      } else {
        setFurnitureDetails([]);
      }
    }

    setSpecialTerms(
      Array.isArray(config.specialTerms) ? config.specialTerms : []
    );
    const isStaged = Boolean(config.enableStagedPricing);
    setEnableStagedPricing(isStaged);
    if (Array.isArray(config.rentStages) && config.rentStages.length > 0) {
      setRentStages(config.rentStages);
    } else {
      setRentStages(
        createDefaultRentStages(
          room.base_price || 2000000,
          config.defaultLeaseMonths || 12,
          6
        )
      );
    }
    setLoading(false);
  }, [room, getRoomRawFurniture]);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen, loadConfig]);

  const handleSyncFromRoomFurniture = () => {
    const rawFurniture = getRoomRawFurniture();
    if (rawFurniture.length === 0) {
      alert(
        "Phòng này hiện chưa có món nội thất nào được tích chọn. Bạn có thể thêm dòng thủ công bên dưới."
      );
      return;
    }
    setFurnitureDetails(
      rawFurniture.map((item) =>
        item.includes(":") ? item : `${item}: 01 cái, hoạt động bình thường.`
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const payload: RoomContractConfig = {
      roomArea: roomArea.trim() || undefined,
      defaultLeaseMonths: Math.max(1, Number(defaultLeaseMonths) || 12),
      defaultDepositAmount: Math.max(0, Number(defaultDepositAmount) || 0),
      roomAddressOverride: roomAddressOverride.trim() || undefined,
      furnitureDetails: furnitureDetails.map((s) => s.trim()).filter(Boolean),
      specialTerms: specialTerms.map((s) => s.trim()).filter(Boolean),
      enableStagedPricing,
      rentStages: enableStagedPricing
        ? rentStages.map((stg) => ({
            id: stg.id,
            label: stg.label.trim() || "Giai đoạn",
            months: stg.months ? Math.max(1, Number(stg.months) || 1) : undefined,
            price: Math.max(0, Number(stg.price) || 0),
            note: stg.note?.trim() || undefined,
          }))
        : undefined,
    };

    const res = await saveRoomContractConfig(room.id, payload);
    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      onSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 900);
    } else {
      setErrorMsg(res.error || "Không thể lưu cấu hình hợp đồng của phòng");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-slate-900">
            Cấu hình Hợp đồng riêng — Phòng {room.code}
          </span>
        </div>
      }
      description="Thiết lập diện tích, tiền cọc, danh mục nội thất bàn giao và điều khoản đặc thù riêng cho phòng này"
      size="lg"
    >
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải cấu hình hợp đồng Phòng {room.code}...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div
              role="status"
              className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Đã lưu cấu hình hợp đồng riêng cho Phòng {room.code}!
              </span>
            </div>
          )}

          {/* Section 1: Basic Room Contract Specs */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Thông số mặc định của Phòng {room.code}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diện tích riêng của phòng
                </label>
                <Input
                  value={roomArea}
                  onChange={(e) => setRoomArea(e.target.value)}
                  placeholder="VD: 28m2 (có ban công)"
                  className="text-xs font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Để trống sẽ lấy diện tích chung trong Mẫu HĐ
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thời hạn hợp đồng (tháng)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={defaultLeaseMonths}
                  onChange={(e) => setDefaultLeaseMonths(e.target.value)}
                  className="text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiền cọc mặc định (VNĐ)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={defaultDepositAmount}
                  onChange={(e) => setDefaultDepositAmount(e.target.value)}
                  className="text-xs font-bold text-indigo-700"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {formatVND(Number(defaultDepositAmount) || 0)}đ
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Địa chỉ riêng của phòng (Tùy chọn)
              </label>
              <Input
                value={roomAddressOverride}
                onChange={(e) => setRoomAddressOverride(e.target.value)}
                placeholder="Để trống sẽ tự động lấy địa chỉ nhà trọ chung..."
                className="text-xs"
              />
            </div>
          </div>

          {/* Section 2: Staged Pricing (Chia lộ trình giá thuê theo giai đoạn) */}
          <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  2. Lộ trình Giá thuê theo giai đoạn (Ưu đãi 6 tháng đầu / 6 tháng sau)
                </h4>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableStagedPricing}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEnableStagedPricing(checked);
                    if (checked && rentStages.length === 0) {
                      setRentStages(
                        createDefaultRentStages(
                          room.base_price || 2000000,
                          Number(defaultLeaseMonths) || 12,
                          6
                        )
                      );
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-2 text-xs font-bold text-amber-900">
                  {enableStagedPricing ? "Đang bật" : "Tắt"}
                </span>
              </label>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dành cho trường hợp hỗ trợ khách thuê (ví dụ: hợp đồng 12 tháng chia ra 06 tháng đầu giá rẻ hơn, 06 tháng sau tính đúng giá hợp đồng) hoặc lộ trình tăng/giảm giá theo thời gian.
            </p>

            {enableStagedPricing && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                  <span className="text-[11px] font-bold text-amber-900">
                    Danh sách các giai đoạn ({rentStages.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setRentStages(
                          createDefaultRentStages(
                            room.base_price || 2000000,
                            Number(defaultLeaseMonths) || 12,
                            6
                          )
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white text-amber-800 hover:bg-amber-100 border border-amber-300 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span>Mẫu 6 tháng đầu / 6 tháng sau</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRentStages((prev) => [
                          ...prev,
                          {
                            id: `stage-${Date.now()}`,
                            label: `Giai đoạn ${prev.length + 1}`,
                            months: 6,
                            price: room.base_price || 2000000,
                            note: "",
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm giai đoạn</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {rentStages.map((stage, idx) => (
                    <div
                      key={stage.id || idx}
                      className="p-2.5 bg-white rounded-xl border border-amber-200/90 shadow-2xs space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Tên giai đoạn
                          </label>
                          <Input
                            value={stage.label}
                            onChange={(e) => {
                              const next = [...rentStages];
                              next[idx] = { ...next[idx], label: e.target.value };
                              setRentStages(next);
                            }}
                            placeholder="VD: 06 tháng đầu"
                            className="text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Số tháng
                          </label>
                          <Input
                            type="number"
                            min={1}
                            value={stage.months || ""}
                            onChange={(e) => {
                              const next = [...rentStages];
                              next[idx] = {
                                ...next[idx],
                                months: Math.max(1, Number(e.target.value) || 1),
                              };
                              setRentStages(next);
                            }}
                            placeholder="6"
                            className="text-xs font-bold text-center"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Giá thuê (VNĐ/tháng)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={stage.price}
                            onChange={(e) => {
                              const next = [...rentStages];
                              next[idx] = {
                                ...next[idx],
                                price: Math.max(0, Number(e.target.value) || 0),
                              };
                              setRentStages(next);
                            }}
                            className="text-xs font-bold text-amber-700"
                          />
                        </div>

                        <div className="sm:col-span-3 flex items-center justify-between gap-1 pt-3 sm:pt-0">
                          <span className="text-[11px] font-bold text-slate-700">
                            {formatVND(stage.price)}đ
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRentStages((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Xóa giai đoạn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <Input
                          value={stage.note || ""}
                          onChange={(e) => {
                            const next = [...rentStages];
                            next[idx] = { ...next[idx], note: e.target.value };
                            setRentStages(next);
                          }}
                          placeholder="Ghi chú điều kiện áp dụng (VD: Giá ưu đãi hỗ trợ thời gian đầu)"
                          className="text-xs text-slate-600 bg-slate-50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Furniture Handover List in Contract */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Armchair className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Mô tả nội thất bàn giao trong Hợp đồng ({furnitureDetails.length})
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSyncFromRoomFurniture}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-indigo-600" />
                  <span>Đồng bộ từ nội thất phòng</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFurnitureDetails((prev) => [
                      ...prev,
                      "Thiết bị mới: 01 cái, hoạt động bình thường.",
                    ])
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm dòng</span>
                </button>
              </div>
            </div>

            {furnitureDetails.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Chưa có dòng mô tả nội thất riêng. Bấm &ldquo;Đồng bộ từ nội
                thất phòng&rdquo; hoặc &ldquo;Thêm dòng&rdquo;.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {furnitureDetails.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 w-5 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      value={item}
                      onChange={(e) => {
                        const next = [...furnitureDetails];
                        next[idx] = e.target.value;
                        setFurnitureDetails(next);
                      }}
                      placeholder="VD: Máy lạnh Inverter: 01 cái, hoạt động bình thường."
                      className="text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFurnitureDetails((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                      aria-label={`Xóa nội thất ${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Special Terms for this Room */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    4. Điều khoản / Thỏa thuận riêng của Phòng {room.code}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sẽ hiển thị thành mục riêng trên hợp đồng của phòng này (VD:
                    chỗ đậu xe, ban công, thú cưng...)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSpecialTerms((prev) => [...prev, ""])}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm điều khoản riêng</span>
              </button>
            </div>

            {specialTerms.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Phòng này chưa có điều khoản thỏa thuận riêng bổ sung.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {specialTerms.map((term, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-2 text-[11px] font-bold text-slate-400 w-5 text-right shrink-0">
                      -
                    </span>
                    <textarea
                      rows={2}
                      value={term}
                      onChange={(e) => {
                        const next = [...specialTerms];
                        next[idx] = e.target.value;
                        setSpecialTerms(next);
                      }}
                      placeholder="Nhập thỏa thuận hoặc quy định riêng cho phòng này..."
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 leading-relaxed resize-y"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSpecialTerms((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="mt-1.5 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                      aria-label={`Xóa điều khoản riêng ${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              loadingText="Đang lưu..."
              leftIcon={<Save className="w-4 h-4" />}
            >
              Lưu cấu hình hợp đồng phòng
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

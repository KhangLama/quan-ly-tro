"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Zap,
  Droplet,
  Home,
  Shield,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Building2,
  Calendar,
  DollarSign,
  Share2,
  ImageIcon,
  FileText,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { calculateInvoice } from "@/lib/calculations/invoice";
import { buildZaloMessage } from "@/lib/zalo/template";
import { formatVND } from "@/lib/utils";
import {
  getInvoiceFormData,
  saveInvoice,
  toggleInvoiceStatus,
  type InvoiceFormDataResult,
} from "@/actions/invoices";
import { ReceiptModal, type ReceiptData } from "./ReceiptModal";
import type { Invoice, Room, Setting } from "@/types";

interface InvoiceCalculatorProps {
  initialRoomId?: string;
}

export function InvoiceCalculator({ initialRoomId }: InvoiceCalculatorProps) {
  const [month, setMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );
  const [roomId, setRoomId] = useState<string>(initialRoomId || "");
  const [formData, setFormData] = useState<InvoiceFormDataResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Meter inputs
  const [oldElectric, setOldElectric] = useState<string>("0");
  const [newElectric, setNewElectric] = useState<string>("0");
  const [oldWater, setOldWater] = useState<string>("0");
  const [newWater, setNewWater] = useState<string>("0");

  // Custom rates overrides (initialized from settings)
  const [electricPrice, setElectricPrice] = useState<number>(3500);
  const [waterPrice, setWaterPrice] = useState<number>(25000);
  const [servicePrice, setServicePrice] = useState<number>(100000);
  const [basePrice, setBasePrice] = useState<number>(2500000);

  // Saving state & feedback
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Load initial form data when room or month changes
  const loadData = useCallback(async (targetRoomId?: string, targetMonth?: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const res = await getInvoiceFormData(targetRoomId, targetMonth);
    setFormData(res);

    if (res.settings) {
      setElectricPrice(Number(res.settings.electric_price) || 3500);
      setWaterPrice(Number(res.settings.water_price) || 25000);
      setServicePrice(Number(res.settings.service_price) || 100000);
    }

    if (res.selectedRoom) {
      setRoomId(res.selectedRoom.id);
      setBasePrice(Number(res.selectedRoom.base_price) || 0);
    }

    if (res.existingInvoice) {
      // If invoice already exists for this month, load its saved values
      setOldElectric(String(res.existingInvoice.old_electric));
      setNewElectric(String(res.existingInvoice.new_electric));
      setOldWater(String(res.existingInvoice.old_water));
      setNewWater(String(res.existingInvoice.new_water));
      setBasePrice(Number(res.existingInvoice.base_price));
      setElectricPrice(Number(res.existingInvoice.electric_price));
      setWaterPrice(Number(res.existingInvoice.water_price));
      setServicePrice(Number(res.existingInvoice.service_price));
      setSavedInvoice(res.existingInvoice);
    } else {
      // Auto-fill old meters from previous reading
      setOldElectric(String(res.previousReading.old_electric));
      setNewElectric(String(res.previousReading.old_electric)); // initial default
      setOldWater(String(res.previousReading.old_water));
      setNewWater(String(res.previousReading.old_water)); // initial default
      setSavedInvoice(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(roomId || initialRoomId, month);
  }, [roomId, month, loadData, initialRoomId]);

  // Realtime calculation computed with live state
  const calculation = useMemo(() => {
    return calculateInvoice({
      basePrice,
      oldElectric: Number(oldElectric) || 0,
      newElectric: Number(newElectric) || 0,
      oldWater: Number(oldWater) || 0,
      newWater: Number(newWater) || 0,
      electricPrice,
      waterPrice,
      servicePrice,
    });
  }, [basePrice, oldElectric, newElectric, oldWater, newWater, electricPrice, waterPrice, servicePrice]);

  // Handle room change
  const handleRoomSelect = (newRoomId: string) => {
    setRoomId(newRoomId);
    loadData(newRoomId, month);
  };

  // Handle Save
  const handleSave = async (status: "pending" | "paid" = "pending") => {
    if (!roomId) {
      setErrorMsg("Vui lòng chọn phòng");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const res = await saveInvoice({
      room_id: roomId,
      month,
      old_electric: Number(oldElectric) || 0,
      new_electric: Number(newElectric) || 0,
      old_water: Number(oldWater) || 0,
      new_water: Number(newWater) || 0,
      base_price: basePrice,
      electric_price: electricPrice,
      water_price: waterPrice,
      service_price: servicePrice,
      status,
    });

    setSaving(false);

    if (res.success && res.invoice) {
      setSavedInvoice(res.invoice);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setErrorMsg(res.error || "Không thể lưu hóa đơn");
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async () => {
    if (!savedInvoice) return;
    const res = await toggleInvoiceStatus(savedInvoice.id);
    if (res.success && res.invoice) {
      setSavedInvoice(res.invoice);
    }
  };

  // Handle Zalo Copy
  const handleCopyZalo = async () => {
    const selectedRoom = formData?.rooms.find((r) => r.id === roomId);
    const roomCode = selectedRoom ? selectedRoom.code : "Mới";

    const text = buildZaloMessage({
      roomCode,
      month,
      totalAmount: calculation.totalAmount,
      electricUsage: calculation.electricUsage,
      electricCost: calculation.electricCost,
      waterUsage: calculation.waterUsage,
      waterCost: calculation.waterCost,
      serviceCost: calculation.servicePrice,
    });

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedZalo(true);
      setTimeout(() => setCopiedZalo(false), 3000);
    } catch {
      // Fallback
      setCopiedZalo(true);
      setTimeout(() => setCopiedZalo(false), 3000);
    }
  };

  const selectedRoom = formData?.rooms.find((r) => r.id === roomId);

  const receiptData: ReceiptData | null = useMemo(() => {
    if (!selectedRoom) return null;
    return {
      roomCode: selectedRoom.code,
      month,
      customerName: formData?.leadTenant?.name || undefined,
      bankInfo: formData?.settings?.bank_info || undefined,
      address: "325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ",
      oldElectric: Number(oldElectric) || 0,
      newElectric: Number(newElectric) || 0,
      electricPrice,
      electricCost: calculation.electricCost,
      electricUsage: calculation.electricUsage,
      oldWater: Number(oldWater) || 0,
      newWater: Number(newWater) || 0,
      waterPrice,
      waterCost: calculation.waterCost,
      waterUsage: calculation.waterUsage,
      basePrice: calculation.basePrice,
      servicePrice: calculation.servicePrice,
      totalAmount: calculation.totalAmount,
    };
  }, [
    selectedRoom,
    month,
    formData,
    oldElectric,
    newElectric,
    electricPrice,
    oldWater,
    newWater,
    waterPrice,
    calculation,
  ]);

  return (
    <div className="space-y-4">
      {/* Alert feedback */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Hóa đơn tháng {month} đã được lưu thành công vào cơ sở dữ liệu!</span>
        </div>
      )}

      {/* Room & Month Selector Card */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Room Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chọn phòng</span>
            </label>
            <select
              value={roomId}
              onChange={(e) => handleRoomSelect(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {formData?.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Phòng {r.code} ({formatVND(r.base_price)}đ/tháng) {r.status === "empty" ? "— [Trống]" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tháng tính tiền</span>
            </label>
            <Input
              type="month"
              value={month}
              onChange={(e) => {
                if (e.target.value) setMonth(e.target.value);
              }}
              className="font-bold text-sm h-11"
            />
          </div>
        </div>

        {/* Existing invoice status indicator */}
        {savedInvoice && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Trạng thái hóa đơn:
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={savedInvoice.status === "paid" ? "success" : "warning"}>
                {savedInvoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                className="text-[11px] h-7 px-2"
              >
                {savedInvoice.status === "paid" ? "Đổi sang Chưa thu" : "Đánh dấu Đã thu"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Electricity Section */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tiền điện</h3>
              <p className="text-[11px] text-slate-500">
                Đơn giá: {formatVND(electricPrice)}đ/số (kWh)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Sử dụng:</span>
            <span className="text-sm font-bold text-amber-600 ml-1">
              {calculation.electricUsage} số
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Chỉ số cũ {formData?.previousReading.hasPreviousInvoice && (
                <span className="text-[10px] text-indigo-600 font-normal">
                  (tháng {formData.previousReading.previousMonth})
                </span>
              )}
            </label>
            <Input
              type="number"
              value={oldElectric}
              onChange={(e) => setOldElectric(e.target.value)}
              min="0"
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Chỉ số mới <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              value={newElectric}
              onChange={(e) => setNewElectric(e.target.value)}
              min={oldElectric}
              className="font-mono text-sm font-bold text-slate-900 bg-amber-50/40 border-amber-200 focus:border-amber-500"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs text-slate-600">
          <span>{calculation.electricUsage} số × {formatVND(electricPrice)}đ</span>
          <strong className="text-slate-900 font-bold">{formatVND(calculation.electricCost)}đ</strong>
        </div>
      </Card>

      {/* Water Section */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/10 text-sky-600 rounded-lg">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tiền nước</h3>
              <p className="text-[11px] text-slate-500">
                Đơn giá: {formatVND(waterPrice)}đ/khối (m³)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Sử dụng:</span>
            <span className="text-sm font-bold text-sky-600 ml-1">
              {calculation.waterUsage} m³
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Chỉ số cũ {formData?.previousReading.hasPreviousInvoice && (
                <span className="text-[10px] text-indigo-600 font-normal">
                  (tháng {formData.previousReading.previousMonth})
                </span>
              )}
            </label>
            <Input
              type="number"
              value={oldWater}
              onChange={(e) => setOldWater(e.target.value)}
              min="0"
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Chỉ số mới <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              value={newWater}
              onChange={(e) => setNewWater(e.target.value)}
              min={oldWater}
              className="font-mono text-sm font-bold text-slate-900 bg-sky-50/40 border-sky-200 focus:border-sky-500"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs text-slate-600">
          <span>{calculation.waterUsage} m³ × {formatVND(waterPrice)}đ</span>
          <strong className="text-slate-900 font-bold">{formatVND(calculation.waterCost)}đ</strong>
        </div>
      </Card>

      {/* Room Rent & Services Breakdown */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Phí cố định hàng tháng
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-indigo-500" />
              Tiền phòng {selectedRoom ? `(${selectedRoom.code})` : ""}:
            </span>
            <span className="font-semibold text-slate-900">
              {formatVND(calculation.basePrice)}đ
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Phí dịch vụ chung (Wifi, Rác, Vệ sinh):
            </span>
            <span className="font-semibold text-slate-900">
              {formatVND(calculation.servicePrice)}đ
            </span>
          </div>
        </div>
      </Card>

      {/* Grand Total Summary Card */}
      <Card className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Tổng cộng thanh toán
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              {formatVND(calculation.totalAmount)}
              <span className="text-sm font-medium text-indigo-200 ml-1">VNĐ</span>
            </div>
          </div>

          <Badge variant="info" className="bg-indigo-500/20 text-indigo-200 border-indigo-500/30">
            Tháng {month}
          </Badge>
        </div>

        {/* Breakdown pills */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-2 border-t border-white/10">
          <div>• Tiền phòng: {formatVND(calculation.basePrice)}đ</div>
          <div>• Tiền điện: {formatVND(calculation.electricCost)}đ</div>
          <div>• Tiền nước: {formatVND(calculation.waterCost)}đ</div>
          <div>• Tiền DV: {formatVND(calculation.servicePrice)}đ</div>
        </div>

        {/* Bank info display */}
        {formData?.settings?.bank_info && (
          <div className="p-2.5 bg-white/10 rounded-xl text-xs text-slate-200">
            <span className="font-semibold text-amber-300 block text-[11px] mb-0.5">
              Tài khoản nhận tiền:
            </span>
            <span className="font-mono text-xs">{formData.settings.bank_info}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* View & Download Receipt Image Button */}
          <Button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs h-11 gap-2 shadow-md shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>Xem & Tải ảnh phiếu báo tiền phòng (Biên lai)</span>
          </Button>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Copy Zalo Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyZalo}
              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5 text-xs h-11"
            >
              {copiedZalo ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Đã copy Zalo!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-sky-400" />
                  <span>Copy tin Zalo</span>
                </>
              )}
            </Button>

            {/* Save Invoice Button */}
            <Button
              type="button"
              onClick={() => handleSave("pending")}
              isLoading={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs font-bold h-11 shadow-md shadow-indigo-500/30"
            >
              <Save className="w-4 h-4" />
              <span>Lưu hóa đơn</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Receipt Modal for previewing and downloading image */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        data={receiptData}
      />
    </div>
  );
}

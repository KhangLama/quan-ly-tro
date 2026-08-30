"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Zap,
  Droplet,
  Check,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Building2,
  Calendar,
  Share2,
  Download,
  Image as ImageIcon,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { calculateInvoice } from "@/lib/calculations/invoice";
import { formatVND } from "@/lib/utils";
import {
  getInvoiceFormData,
  saveInvoice,
  toggleInvoiceStatus,
  deleteInvoice,
  type InvoiceFormDataResult,
} from "@/actions/invoices";
import { ReceiptCanvas, type ReceiptData } from "./ReceiptCanvas";
import { toPng, toBlob } from "html-to-image";
import type { Invoice } from "@/types";

interface InvoiceCalculatorProps {
  initialRoomId?: string;
}

export function InvoiceCalculator({ initialRoomId }: InvoiceCalculatorProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
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
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [basePrice, setBasePrice] = useState<number>(2500000);

  // Discount / Event
  const [discount, setDiscount] = useState<string>("0");
  const [discountReason, setDiscountReason] = useState<string>("");

  // Action states & feedback
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);

  // Load initial form data when room or month changes
  const loadData = useCallback(async (targetRoomId?: string, targetMonth?: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const res = await getInvoiceFormData(targetRoomId, targetMonth);
    setFormData(res);

    if (res.settings) {
      if (res.settings.electric_price !== undefined && res.settings.electric_price !== null) {
        setElectricPrice(Number(res.settings.electric_price));
      }
      if (res.settings.water_price !== undefined && res.settings.water_price !== null) {
        setWaterPrice(Number(res.settings.water_price));
      }
      if (res.settings.service_price !== undefined && res.settings.service_price !== null) {
        setServicePrice(Number(res.settings.service_price));
      }
    }

    if (res.selectedRoom) {
      setRoomId(res.selectedRoom.id);
      setBasePrice(Number(res.selectedRoom.base_price) || 0);
    }

    if (res.existingInvoice) {
      // If invoice already exists for this month, load its saved meter readings
      setOldElectric(String(res.existingInvoice.old_electric));
      setNewElectric(String(res.existingInvoice.new_electric));
      setOldWater(String(res.existingInvoice.old_water));
      setNewWater(String(res.existingInvoice.new_water));
      setBasePrice(Number(res.existingInvoice.base_price));

      // If the invoice is already paid, preserve historical rates.
      // If pending / in progress, adopt current active settings rates!
      if (res.existingInvoice.status === "paid") {
        setElectricPrice(Number(res.existingInvoice.electric_price));
        setWaterPrice(Number(res.existingInvoice.water_price));
        setServicePrice(Number(res.existingInvoice.service_price));
      }

      // Load or infer discount
      const invOldE = Number(res.existingInvoice.old_electric) || 0;
      const invNewE = Number(res.existingInvoice.new_electric) || 0;
      const invOldW = Number(res.existingInvoice.old_water) || 0;
      const invNewW = Number(res.existingInvoice.new_water) || 0;
      const invERate = Number(res.existingInvoice.electric_price) || 0;
      const invWRate = Number(res.existingInvoice.water_price) || 0;
      const invSRate = Number(res.existingInvoice.service_price) || 0;
      const invBase = Number(res.existingInvoice.base_price) || 0;
      const invSubtotal =
        invBase +
        Math.max(0, invNewE - invOldE) * invERate +
        Math.max(0, invNewW - invOldW) * invWRate +
        invSRate;

      const rawDiscount = (res.existingInvoice as any).discount;
      const savedDiscount =
        rawDiscount !== undefined && rawDiscount !== null
          ? Number(rawDiscount)
          : Math.max(0, invSubtotal - Number(res.existingInvoice.total_amount));

      setDiscount(String(savedDiscount || 0));
      setDiscountReason(
        (res.existingInvoice as any).discount_reason ||
          (savedDiscount > 0 ? "Event giảm giá tháng" : "")
      );

      setSavedInvoice(res.existingInvoice);
    } else {
      // Auto-fill old meters from previous reading
      setOldElectric(String(res.previousReading.old_electric));
      setNewElectric(String(res.previousReading.old_electric)); // initial default
      setOldWater(String(res.previousReading.old_water));
      setNewWater(String(res.previousReading.old_water)); // initial default
      setDiscount("0");
      setDiscountReason("");
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
      discount: Number(discount) || 0,
    });
  }, [basePrice, oldElectric, newElectric, oldWater, newWater, electricPrice, waterPrice, servicePrice, discount]);

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
      discount: Number(discount) || 0,
      discount_reason: discountReason.trim(),
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

  // Handle Delete Saved Invoice
  const handleDeleteSavedInvoice = async () => {
    if (!savedInvoice || !selectedRoom) return;
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa vĩnh viễn hóa đơn tháng ${month} của phòng ${selectedRoom.code}?`
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await deleteInvoice(savedInvoice.id);
    setDeleting(false);

    if (res.success) {
      setSavedInvoice(null);
      setSaveSuccess(true);
      loadData(roomId, month);
    } else {
      setErrorMsg(res.error || "Không thể xóa hóa đơn");
    }
  };

  // Build live receipt data
  const selectedRoom = formData?.rooms.find((r) => r.id === roomId);

  const receiptData: ReceiptData | null = useMemo(() => {
    if (!selectedRoom) return null;
    return {
      roomCode: selectedRoom.code,
      month,
      customerName: formData?.leadTenant?.name || undefined,
      customerPhone: formData?.leadTenant?.phone || undefined,
      bankInfo: formData?.settings?.bank_info || undefined,
      address: formData?.settings?.address || undefined,
      serviceDescription:
        calculation.servicePrice > 0
          ? formData?.settings?.service_description || undefined
          : undefined,
      receiptNote: formData?.settings?.receipt_note || undefined,
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
      discount: calculation.discount,
      discountReason: discountReason.trim() || undefined,
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
    discountReason,
  ]);

  // Handle Share: Share ONLY the image file
  const handleShareImage = async () => {
    if (!receiptRef.current || !selectedRoom) return;
    try {
      setSharing(true);
      const blob = await toBlob(receiptRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      if (!blob) throw new Error("Could not generate receipt image blob");

      const file = new File(
        [blob],
        `Phieu_Tien_Phong_${selectedRoom.code}_${month}.png`,
        { type: "image/png" }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file], // Only share the PNG image file, no text attached
        });
      } else {
        // Fallback for desktop: copy image to clipboard
        await handleCopyImage();
        if (formData?.leadTenant?.phone) {
          const cleanPhone = formData.leadTenant.phone.replace(/\D/g, "");
          window.open(`https://zalo.me/${cleanPhone}`, "_blank");
        } else {
          alert("Đã sao chép ảnh biên lai vào bộ nhớ tạm! Bạn chỉ cần dán (Ctrl+V) vào khung chat người nhận.");
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Share failed", err);
      }
    } finally {
      setSharing(false);
    }
  };

  // Handle Download Image
  const handleDownloadImage = async () => {
    if (!receiptRef.current || !selectedRoom) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(receiptRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `Phieu_Tien_Phong_${selectedRoom.code}_${month}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Không thể tạo ảnh biên lai. Vui lòng thử lại!");
    } finally {
      setDownloading(false);
    }
  };

  // Handle Copy Image
  const handleCopyImage = async () => {
    if (!receiptRef.current) return;
    try {
      setDownloading(true);
      const blob = await toBlob(receiptRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      console.error("Failed to copy image", err);
      handleDownloadImage();
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !formData) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Đang tải dữ liệu phòng và đơn giá...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Thao tác hóa đơn phòng {selectedRoom?.code} thành công!</span>
        </div>
      )}

      {/* Invoice Status Banner if already exists */}
      {savedInvoice && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-900">
              Trạng thái:
            </span>
            <Badge variant={savedInvoice.status === "paid" ? "success" : "warning"}>
              {savedInvoice.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleStatus}
              className="text-[11px] h-7 bg-white whitespace-nowrap"
            >
              Đánh dấu {savedInvoice.status === "paid" ? "Chưa thu" : "Đã thu"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteSavedInvoice}
              disabled={deleting}
              className="text-[11px] h-7 bg-white text-rose-600 border-rose-200 hover:bg-rose-50 whitespace-nowrap gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? "Đang xóa..." : "Xóa"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Cards */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">

      {/* Card 1: Room & Month Selection */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Chọn phòng và tháng chốt</span>
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Room Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Phòng
            </label>
            <select
              value={roomId}
              onChange={(e) => handleRoomSelect(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {formData?.rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.code} ({room.status === "rented" ? "Đang thuê" : "Trống"})
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Tháng
            </label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs font-bold"
            />
          </div>
        </div>

        {/* Lead Tenant Badge */}
        {formData?.leadTenant ? (
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl flex items-center justify-between border border-slate-100">
            <span>
              Người đại diện: <strong>{formData.leadTenant.name}</strong>
            </span>
            {formData.leadTenant.phone && (
              <span className="text-slate-400 text-[11px]">
                {formData.leadTenant.phone}
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl">
            ⚠️ Phòng chưa có khách đại diện (đang trống)
          </div>
        )}
      </Card>

      {/* Card 2: Electricity Meters */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Chỉ số Điện (kWh)</span>
          </h2>
          <span className="text-[11px] font-medium text-slate-400">
            Đơn giá: {formatVND(electricPrice)}đ/kWh
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Số cũ (tháng trước)
            </label>
            <Input
              type="number"
              value={oldElectric}
              onChange={(e) => setOldElectric(e.target.value)}
              className="font-mono text-sm font-semibold bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-amber-700 mb-1">
              Số mới (hiện tại)
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
          <span>{calculation.electricUsage} kWh × {formatVND(electricPrice)}đ</span>
          <strong className="text-slate-900 font-bold">{formatVND(calculation.electricCost)}đ</strong>
        </div>
      </Card>

      {/* Card 3: Water Meters */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-sky-500" />
            <span>Chỉ số Nước (m³)</span>
          </h2>
          <span className="text-[11px] font-medium text-slate-400">
            Đơn giá: {formatVND(waterPrice)}đ/m³
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Số cũ (tháng trước)
            </label>
            <Input
              type="number"
              value={oldWater}
              onChange={(e) => setOldWater(e.target.value)}
              className="font-mono text-sm font-semibold bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-sky-700 mb-1">
              Số mới (hiện tại)
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

      {/* Card 4: Discount / Promotional Event */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ưu đãi / Giảm giá (Tùy chọn)</span>
          </h2>
          {Number(discount) > 0 && (
            <Badge variant="success" size="sm">
              Giảm -{formatVND(Number(discount))}đ
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Số tiền giảm (VNĐ)
            </label>
            <div className="relative">
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
                placeholder="0"
                className="font-bold text-sm text-emerald-700 bg-emerald-50/30 border-emerald-200 focus:border-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                đ
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Lý do giảm (Hiển thị trên biên lai)
            </label>
            <Input
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="e.g. Event sinh viên, Khuyến mãi tháng"
              className="text-xs"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Nhanh:</span>
          {["0", "50000", "100000", "200000", "500000"].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setDiscount(preset);
                if (preset !== "0" && !discountReason) {
                  setDiscountReason("Event giảm giá tháng");
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                discount === preset
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {preset === "0" ? "0đ" : `-${formatVND(Number(preset))}đ`}
            </button>
          ))}
        </div>
      </Card>
    </div>
    {/* End of Left Column */}

        {/* Right Column: Live Receipt & Actions */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-3 lg:sticky lg:top-20">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Phiếu báo tiền phòng (Biên lai)
              </h2>
            </div>
            <span className="text-[11px] font-bold text-indigo-600">
              Tổng: {formatVND(calculation.totalAmount)}đ
            </span>
          </div>

          {/* Live Receipt Canvas */}
          <div className="overflow-x-auto p-1 max-h-[65vh] overflow-y-auto rounded-2xl border border-slate-200/90 bg-slate-100 shadow-inner flex justify-center">
            {receiptData ? (
              <ReceiptCanvas ref={receiptRef} data={receiptData} />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Vui lòng chọn phòng để hiển thị biên lai
              </div>
            )}
          </div>

          {/* Action Buttons Panel */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Primary Share Button (Pure image share) */}
            <Button
              type="button"
              onClick={handleShareImage}
              isLoading={sharing}
              className="w-full bg-[#0068FF] hover:bg-[#0055d4] text-white font-extrabold text-xs gap-2 h-11 shadow-sm shadow-blue-500/20 whitespace-nowrap"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Share</span>
            </Button>

            <div className="grid grid-cols-3 gap-2">
              {/* Save Button */}
              <Button
                type="button"
                onClick={() => handleSave("pending")}
                isLoading={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 h-10 shadow-sm whitespace-nowrap"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>Lưu</span>
              </Button>

              {/* Download Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadImage}
                isLoading={downloading}
                className="w-full font-bold text-xs gap-1.5 h-10 text-slate-700 border-slate-300 hover:bg-white whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0 text-slate-600" />
                <span>Tải ảnh</span>
              </Button>

              {/* Copy Image Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyImage}
                disabled={downloading || sharing}
                className="w-full font-bold text-xs gap-1.5 h-10 text-slate-700 border-slate-300 hover:bg-white whitespace-nowrap"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700">Đã copy!</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>

            {/* Quick Zalo Direct Chat Link */}
            {formData?.leadTenant?.phone && (
              <div className="pt-1 text-center">
                <a
                  href={`https://zalo.me/${formData.leadTenant.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#0068FF] hover:underline font-semibold"
                >
                  <span>💬 Mở khung chat Zalo với {formData.leadTenant.name} ({formData.leadTenant.phone})</span>
                </a>
              </div>
            )}
          </div>
        </div>
        {/* End of Right Column */}
      </div>
      {/* End of 2-Column Grid */}
    </div>
  );
}

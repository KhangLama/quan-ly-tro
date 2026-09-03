"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Zap, Droplet, Shield, CreditCard, Save, RotateCcw, CheckCircle2, AlertCircle, MapPin, FileText, Armchair, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getSettings, updateSettings } from "@/actions/settings";
import { formatVND } from "@/lib/utils";
import { DEFAULT_FURNITURE_CATALOG } from "@/lib/constants/furniture";
import type { Setting } from "@/types";

export function SettingsForm() {
  const [electricPrice, setElectricPrice] = useState("3500");
  const [waterPrice, setWaterPrice] = useState("25000");
  const [enableService, setEnableService] = useState(false);
  const [servicePrice, setServicePrice] = useState("0");
  const [bankInfo, setBankInfo] = useState("MB Bank - 0987654321 - NGUYEN VAN A");
  const [address, setAddress] = useState("325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ");
  const [serviceDescription, setServiceDescription] = useState("");
  const [receiptNote, setReceiptNote] = useState("");

  // Furniture Catalog
  const [furnitureCatalog, setFurnitureCatalog] = useState<string[]>(DEFAULT_FURNITURE_CATALOG);
  const [newFurnitureName, setNewFurnitureName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCurrentSettings = useCallback(async () => {
    setLoading(true);
    const res = await getSettings();
    if (res.settings) {
      if (res.settings.electric_price !== undefined) setElectricPrice(String(res.settings.electric_price));
      if (res.settings.water_price !== undefined) setWaterPrice(String(res.settings.water_price));
      if (res.settings.service_price !== undefined) {
        const sPrice = Number(res.settings.service_price) || 0;
        setServicePrice(String(sPrice));
        setEnableService(sPrice > 0);
      }
      setBankInfo(res.settings.bank_info || "");
      if (res.settings.address !== undefined) setAddress(res.settings.address || "");
      if (res.settings.service_description !== undefined) setServiceDescription(res.settings.service_description || "");
      if (res.settings.receipt_note !== undefined) setReceiptNote(res.settings.receipt_note || "");

      let catalog = (res.settings as any)?.furniture_catalog;
      if (!catalog && typeof window !== "undefined") {
        try {
          const localCat = localStorage.getItem("app_furniture_catalog");
          if (localCat) catalog = JSON.parse(localCat);
        } catch {}
      }
      setFurnitureCatalog(catalog && Array.isArray(catalog) && catalog.length > 0 ? catalog : DEFAULT_FURNITURE_CATALOG);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCurrentSettings();
  }, [fetchCurrentSettings]);

  const handleAddFurniture = () => {
    const trimmed = newFurnitureName.trim();
    if (!trimmed) return;
    if (furnitureCatalog.includes(trimmed)) {
      alert("Món nội thất này đã có trong danh mục!");
      return;
    }
    setFurnitureCatalog((prev) => [...prev, trimmed]);
    setNewFurnitureName("");
  };

  const handleRemoveFurniture = (item: string) => {
    setFurnitureCatalog((prev) => prev.filter((i) => i !== item));
  };

  const handleResetFurnitureCatalog = () => {
    setFurnitureCatalog(DEFAULT_FURNITURE_CATALOG);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const finalServicePrice = enableService ? (Number(servicePrice) || 0) : 0;
    const finalServiceDesc = enableService ? serviceDescription.trim() : "";

    const res = await updateSettings({
      electric_price: Number(electricPrice) || 0,
      water_price: Number(waterPrice) || 0,
      service_price: finalServicePrice,
      bank_info: bankInfo,
      address,
      service_description: finalServiceDesc,
      receipt_note: receiptNote,
      furniture_catalog: furnitureCatalog,
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("app_furniture_catalog", JSON.stringify(furnitureCatalog));
      } catch {}
    }

    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setErrorMsg(res.error || "Không thể lưu cài đặt");
    }
  };

  const handleResetDefaults = () => {
    setElectricPrice("3500");
    setWaterPrice("25000");
    setEnableService(false);
    setServicePrice("0");
    setBankInfo("MB Bank - 0987654321 - NGUYEN VAN A");
    setAddress("325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ");
    setServiceDescription("");
    setReceiptNote("");
    setFurnitureCatalog(DEFAULT_FURNITURE_CATALOG);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Đang tải thông tin cài đặt...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Cài đặt hệ thống và đơn giá đã được cập nhật thành công!</span>
        </div>
      )}

      {/* Form Content in 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Utility Rates Card */}
          <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Đơn giá điện, nước & dịch vụ
        </h3>

        {/* Electric Rate */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Đơn giá điện (VNĐ / số - kWh)</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              value={electricPrice}
              onChange={(e) => setElectricPrice(e.target.value)}
              min="0"
              required
              className="font-bold text-sm"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400">
              đ/kWh
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Đang áp dụng: <strong>{formatVND(Number(electricPrice) || 0)}đ</strong>/kWh
          </p>
        </div>

        {/* Water Rate */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-sky-500" />
            <span>Đơn giá nước (VNĐ / khối - m³)</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              value={waterPrice}
              onChange={(e) => setWaterPrice(e.target.value)}
              min="0"
              required
              className="font-bold text-sm"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400">
              đ/m³
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Đang áp dụng: <strong>{formatVND(Number(waterPrice) || 0)}đ</strong>/m³
          </p>
        </div>

        {/* Service Rate Section with Toggle */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Thu phí dịch vụ / Chi phí khác (Mục số 4)</span>
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableService}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEnableService(checked);
                  if (checked && (servicePrice === "0" || !servicePrice)) {
                    setServicePrice("100000");
                    if (!serviceDescription) setServiceDescription("Dịch vụ chung (Rác, Wifi, ...)");
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {enableService ? (
            <div className="space-y-3 pl-2 border-l-2 border-emerald-500/40 mt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Đơn giá dịch vụ (VNĐ / phòng / tháng)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    min="0"
                    required
                    className="font-bold text-sm"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                    đ/tháng
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mô tả khoản chi phí khác trên biên lai (Mục số 4)
                </label>
                <Input
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="e.g. Dịch vụ chung (Rác, Wifi, ...)"
                  className="text-xs font-medium"
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Đang tắt (0đ) — trên biên lai sẽ set về 0đ và bỏ trống mô tả.
            </p>
          )}
        </div>
      </Card>

      {/* Bank Account Info Card */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Thông tin chuyển khoản ngân hàng
          </h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tên ngân hàng - Số tài khoản - Chủ tài khoản
          </label>
          <textarea
            rows={3}
            value={bankInfo}
            onChange={(e) => setBankInfo(e.target.value)}
            placeholder="e.g. MB Bank - 0987654321 - NGUYEN VAN A"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Thông tin này sẽ hiển thị trên biểu mẫu tính tiền và hỗ trợ gửi kèm khách thuê.
          </p>
        </div>
      </Card>
    </div>
    {/* End of Left Column */}

    {/* Right Column */}
    <div className="space-y-4">
      {/* Receipt Customization Card */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Cấu hình Phiếu báo tiền phòng (Biên lai)
          </h3>
        </div>

        {/* Inn Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Địa chỉ nhà trọ (In góc trên biên lai)</span>
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ"
            className="text-xs font-medium"
          />
        </div>

        {/* Receipt Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nội dung ghi chú chân biên lai (Tùy chọn)
          </label>
          <textarea
            rows={4}
            value={receiptNote}
            onChange={(e) => setReceiptNote(e.target.value)}
            placeholder="Để trống sẽ tự động hiển thị hướng dẫn thanh toán kèm STK ngân hàng ở dưới"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Nếu nhập, nội dung này sẽ thay thế câu ghi chú mặc định ở chân phiếu báo tiền phòng.
          </p>
        </div>
      </Card>

      {/* Furniture Catalog Card */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Armchair className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh mục nội thất & tiện nghi ({furnitureCatalog.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetFurnitureCatalog}
            className="text-[11px] text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Khôi phục mẫu
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Danh mục các món nội thất dùng chung cho toàn bộ nhà trọ. Khi chỉnh sửa phòng trọ, bạn có thể chọn các món này để gán vào từng phòng.
        </p>

        {/* Add new furniture item input */}
        <div className="flex items-center gap-2">
          <Input
            value={newFurnitureName}
            onChange={(e) => setNewFurnitureName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddFurniture();
              }
            }}
            placeholder="e.g. Máy giặt, Bàn trang điểm, Smart TV..."
            className="text-xs"
          />
          <Button
            type="button"
            onClick={handleAddFurniture}
            variant="outline"
            className="text-xs font-bold shrink-0 gap-1 h-9 px-3 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </Button>
        </div>

        {/* Furniture chips list */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {furnitureCatalog.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 group hover:border-slate-300 transition-all"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveFurniture(item)}
                title={`Xóa ${item}`}
                className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {furnitureCatalog.length === 0 && (
            <span className="text-xs text-slate-400 italic">
              Chưa có món nội thất nào. Vui lòng nhập ở trên hoặc bấm &quot;Khôi phục mẫu&quot;.
            </span>
          )}
        </div>
      </Card>
    </div>
    {/* End of Right Column */}
  </div>
  {/* End of 2-Column Grid */}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={handleResetDefaults}
          disabled={saving}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Mặc định</span>
        </Button>

        <Button
          type="submit"
          isLoading={saving}
          className="gap-1.5 text-xs font-bold px-5"
        >
          <Save className="w-4 h-4" />
          <span>Lưu cài đặt</span>
        </Button>
      </div>
    </form>
  );
}

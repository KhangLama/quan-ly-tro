"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Zap, Droplet, Shield, CreditCard, Save, RotateCcw, CheckCircle2, AlertCircle, MapPin, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getSettings, updateSettings } from "@/actions/settings";
import { formatVND } from "@/lib/utils";
import type { Setting } from "@/types";

export function SettingsForm() {
  const [electricPrice, setElectricPrice] = useState("3500");
  const [waterPrice, setWaterPrice] = useState("25000");
  const [servicePrice, setServicePrice] = useState("100000");
  const [bankInfo, setBankInfo] = useState("MB Bank - 0987654321 - NGUYEN VAN A");
  const [address, setAddress] = useState("325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ");
  const [serviceDescription, setServiceDescription] = useState("Dịch vụ chung (Rác, Wifi, ...)");
  const [receiptNote, setReceiptNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCurrentSettings = useCallback(async () => {
    setLoading(true);
    const res = await getSettings();
    if (res.settings) {
      setElectricPrice(String(res.settings.electric_price));
      setWaterPrice(String(res.settings.water_price));
      setServicePrice(String(res.settings.service_price));
      setBankInfo(res.settings.bank_info || "");
      if (res.settings.address) setAddress(res.settings.address);
      if (res.settings.service_description) setServiceDescription(res.settings.service_description);
      if (res.settings.receipt_note !== undefined) setReceiptNote(res.settings.receipt_note || "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCurrentSettings();
  }, [fetchCurrentSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const res = await updateSettings({
      electric_price: Number(electricPrice) || 0,
      water_price: Number(waterPrice) || 0,
      service_price: Number(servicePrice) || 0,
      bank_info: bankInfo,
      address,
      service_description: serviceDescription,
      receipt_note: receiptNote,
    });

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
    setServicePrice("100000");
    setBankInfo("MB Bank - 0987654321 - NGUYEN VAN A");
    setAddress("325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ");
    setServiceDescription("Dịch vụ chung (Rác, Wifi, ...)");
    setReceiptNote("");
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
          <span>Đơn giá và thông tin ngân hàng đã được cập nhật thành công!</span>
        </div>
      )}

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
              đ/số
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Đang áp dụng: <strong>{formatVND(Number(electricPrice) || 0)}đ</strong>/số
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

        {/* Service Rate */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Phí dịch vụ chung (VNĐ / phòng / tháng)</span>
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
          <p className="text-[11px] text-slate-500 mt-1">
            Bao gồm rác, wifi, vệ sinh: <strong>{formatVND(Number(servicePrice) || 0)}đ</strong>/tháng
          </p>
        </div>
      </Card>

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

        {/* Service Name / Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mô tả khoản phí dịch vụ chung (Mục số 4 trên bảng biên lai)
          </label>
          <Input
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            placeholder="e.g. Dịch vụ chung (Rác, Wifi, ...)"
            className="text-xs font-medium"
          />
        </div>

        {/* Receipt Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nội dung ghi chú chân biên lai (Tùy chọn)
          </label>
          <textarea
            rows={2}
            value={receiptNote}
            onChange={(e) => setReceiptNote(e.target.value)}
            placeholder="Để trống sẽ tự động hiển thị hướng dẫn thanh toán kèm STK ngân hàng ở trên"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Nếu nhập, nội dung này sẽ thay thế câu ghi chú mặc định ở chân phiếu báo tiền phòng.
          </p>
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

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
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

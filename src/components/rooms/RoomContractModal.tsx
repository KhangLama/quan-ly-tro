"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatVND } from "@/lib/utils";
import {
  FileText,
  Printer,
  Copy,
  Check,
  Building2,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  Sliders,
} from "lucide-react";
import type { Room, Tenant, Setting } from "@/types";

interface RoomContractModalProps {
  room: Room;
  leadTenant: Tenant | null;
  settings: Setting | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RoomContractModal({
  room,
  leadTenant,
  settings,
  isOpen,
  onClose,
}: RoomContractModalProps) {
  // Tabs: "preview" (Xem trước & In) or "config" (Chỉnh sửa thông tin)
  const [tab, setTab] = useState<"preview" | "config">("preview");
  const [copied, setCopied] = useState(false);

  // Contract Date
  const today = new Date();
  const [contractDay, setContractDay] = useState(String(today.getDate()).padStart(2, "0"));
  const [contractMonth, setContractMonth] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [contractYear, setContractYear] = useState(String(today.getFullYear()));
  const [innName, setInnName] = useState("Nhà trọ Trúc Lam");

  // Party A (Landlord - Bên A)
  const [partyAName, setPartyAName] = useState("Bùi Thanh Tùng");
  const [partyACccd, setPartyACccd] = useState("086089000009");
  const [partyACccdDate, setPartyACccdDate] = useState("13/08/2021");
  const [partyACccdPlace, setPartyACccdPlace] = useState("Cục Cảnh sát QLHC về TTXH");
  const [partyAAddress, setPartyAAddress] = useState(
    "Q5 đường số 6, KDC Cty8, Phường Hưng Thạnh, Quận Cái Răng, Thành phố Cần Thơ, Việt Nam."
  );
  const [partyAPhone, setPartyAPhone] = useState("0901 001 079");

  // Party B (Tenant - Bên B)
  const [partyBName, setPartyBName] = useState("");
  const [partyBCccd, setPartyBCccd] = useState("");
  const [partyBCccdDate, setPartyBCccdDate] = useState("04/03/2022");
  const [partyBCccdPlace, setPartyBCccdPlace] = useState("Cục Cảnh sát QLHC về TTXH");
  const [partyBAddress, setPartyBAddress] = useState("Ấp An Nhơn, Thế An Hội, Kế Sách, Sóc Trăng.");
  const [partyBPhone, setPartyBPhone] = useState("");

  // Room & Lease Terms (Điều 1)
  const [roomAddress, setRoomAddress] = useState(
    settings?.address || "325B Kv. Phú Mỹ, Phường Cái Răng, Thành phố Cần Thơ."
  );
  const [roomArea, setRoomArea] = useState("32m2");
  const [monthlyPrice, setMonthlyPrice] = useState(room.base_price || 2000000);
  const [leaseMonths, setLeaseMonths] = useState(12);
  const [leaseStartDate, setLeaseStartDate] = useState("01/09/2026");
  const [leaseEndDate, setLeaseEndDate] = useState("01/09/2027");
  const [depositAmount, setDepositAmount] = useState(room.base_price || 2000000);
  const [electricPrice, setElectricPrice] = useState(settings?.electric_price || 4000);
  const [waterPrice, setWaterPrice] = useState(settings?.water_price || 12000);

  // Bank info
  const [bankOwner, setBankOwner] = useState("Bùi Thanh Tùng");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");

  // Furniture items list
  const [furnitureItems, setFurnitureItems] = useState<string[]>([]);

  // Load saved Party A preferences & populate tenant data
  useEffect(() => {
    if (!isOpen) return;

    // Load Party A from localStorage if available
    if (typeof window !== "undefined") {
      try {
        const savedA = localStorage.getItem("contract_party_a");
        if (savedA) {
          const parsed = JSON.parse(savedA);
          if (parsed.name) setPartyAName(parsed.name);
          if (parsed.cccd) setPartyACccd(parsed.cccd);
          if (parsed.cccdDate) setPartyACccdDate(parsed.cccdDate);
          if (parsed.cccdPlace) setPartyACccdPlace(parsed.cccdPlace);
          if (parsed.address) setPartyAAddress(parsed.address);
          if (parsed.phone) setPartyAPhone(parsed.phone);
          if (parsed.innName) setInnName(parsed.innName);
        }
      } catch {}
    }

    // Populate Tenant (Party B)
    if (leadTenant) {
      setPartyBName(leadTenant.name || "");
      setPartyBCccd(leadTenant.cccd || "");
      setPartyBPhone(leadTenant.phone || "");

      // Date calculations
      if (leadTenant.start_date) {
        const d = new Date(leadTenant.start_date);
        if (!isNaN(d.getTime())) {
          const sDateStr = `${String(d.getDate()).padStart(2, "0")}/${String(
            d.getMonth() + 1
          ).padStart(2, "0")}/${d.getFullYear()}`;
          setLeaseStartDate(sDateStr);

          // Default 12 months later
          const nextYear = new Date(d);
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          const eDateStr = `${String(nextYear.getDate()).padStart(2, "0")}/${String(
            nextYear.getMonth() + 1
          ).padStart(2, "0")}/${nextYear.getFullYear()}`;
          setLeaseEndDate(eDateStr);
        }
      }

      if (leadTenant.deposit_amount) {
        setDepositAmount(Number(leadTenant.deposit_amount));
      } else {
        setDepositAmount(room.base_price || 2000000);
      }
    }

    // Room specifics
    setMonthlyPrice(room.base_price || 2000000);
    if (settings?.address) setRoomAddress(settings.address);
    if (settings?.electric_price) setElectricPrice(settings.electric_price);
    if (settings?.water_price) setWaterPrice(settings.water_price);

    // Bank parsing
    if (settings?.bank_info) {
      // Format usually: "Bank - STK - Tên" or similar
      const parts = settings.bank_info.split("-").map((s) => s.trim());
      if (parts.length >= 3) {
        setBankName(parts[0]);
        setBankAccount(parts[1]);
        setBankOwner(parts[2]);
      } else if (parts.length === 2) {
        setBankName(parts[0]);
        setBankAccount(parts[1]);
      } else {
        setBankAccount(settings.bank_info);
      }
    }

    // Furniture list
    let fList: string[] = (room as any)?.furniture || [];
    if ((!fList || fList.length === 0) && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`room_furniture_${room.id}`);
        if (cached) fList = JSON.parse(cached);
      } catch {}
    }
    setFurnitureItems(Array.isArray(fList) ? fList : []);
  }, [isOpen, room, leadTenant, settings]);

  const handleSavePartyADefaults = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "contract_party_a",
          JSON.stringify({
            name: partyAName,
            cccd: partyACccd,
            cccdDate: partyACccdDate,
            cccdPlace: partyACccdPlace,
            address: partyAAddress,
            phone: partyAPhone,
            innName,
          })
        );
        alert("Đã lưu thông tin Bên A làm mặc định cho tất cả các hợp đồng sau!");
      } catch {}
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const contractRef = useRef<HTMLDivElement>(null);

  const handleCopyText = async () => {
    if (!contractRef.current) return;
    try {
      const text = contractRef.current.innerText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert("Không thể sao chép tự động, vui lòng chọn văn bản và bấm Ctrl+C / Cmd+C");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>Hợp đồng thuê phòng - Phòng {room.code}</span>
        </div>
      }
      description="Xem trước, tùy chỉnh và in ấn bản hợp đồng thuê trọ chuẩn pháp lý"
      size="3xl"
    >
      {/* Action Header & Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === "preview"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem trước & In ấn</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("config")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === "config"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Chỉnh sửa thông tin hợp đồng</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyText}
            className="text-xs font-bold gap-1.5 h-9"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép văn bản</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handlePrint}
            className="text-xs font-bold gap-1.5 h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In hợp đồng (PDF)</span>
          </Button>
        </div>
      </div>

      {/* Tab 1: Config Form */}
      {tab === "config" && (
        <div className="space-y-6 max-h-[72vh] overflow-y-auto pr-1">
          {/* Section: Bên A */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Thông tin Bên cho thuê (Bên A)
              </h3>
              <button
                type="button"
                onClick={handleSavePartyADefaults}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                💾 Lưu thông tin này làm mặc định
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tên nhà trọ
                </label>
                <Input value={innName} onChange={(e) => setInnName(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Họ và tên Bên A
                </label>
                <Input value={partyAName} onChange={(e) => setPartyAName(e.target.value)} className="text-xs font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Số điện thoại Bên A
                </label>
                <Input value={partyAPhone} onChange={(e) => setPartyAPhone(e.target.value)} className="text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Số CCCD Bên A
                </label>
                <Input value={partyACccd} onChange={(e) => setPartyACccd(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ngày cấp CCCD
                </label>
                <Input value={partyACccdDate} onChange={(e) => setPartyACccdDate(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nơi cấp CCCD
                </label>
                <Input value={partyACccdPlace} onChange={(e) => setPartyACccdPlace(e.target.value)} className="text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Địa chỉ thường trú Bên A
              </label>
              <Input value={partyAAddress} onChange={(e) => setPartyAAddress(e.target.value)} className="text-xs" />
            </div>
          </div>

          {/* Section: Bên B */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Thông tin Bên thuê phòng (Bên B - Người đại diện)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Họ và tên Bên B
                </label>
                <Input value={partyBName} onChange={(e) => setPartyBName(e.target.value)} className="text-xs font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Số điện thoại Bên B
                </label>
                <Input value={partyBPhone} onChange={(e) => setPartyBPhone(e.target.value)} className="text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Số CCCD Bên B
                </label>
                <Input value={partyBCccd} onChange={(e) => setPartyBCccd(e.target.value)} className="text-xs font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ngày cấp CCCD
                </label>
                <Input value={partyBCccdDate} onChange={(e) => setPartyBCccdDate(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nơi cấp CCCD
                </label>
                <Input value={partyBCccdPlace} onChange={(e) => setPartyBCccdPlace(e.target.value)} className="text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Địa chỉ thường trú Bên B (Theo CCCD/Hộ khẩu)
              </label>
              <Input value={partyBAddress} onChange={(e) => setPartyBAddress(e.target.value)} className="text-xs" />
            </div>
          </div>

          {/* Section: Điều khoản phòng & Giá */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Thông tin thuê phòng & Giá cả
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Phòng trọ số
                </label>
                <Input value={room.code} disabled className="text-xs font-bold bg-slate-100" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Diện tích phòng
                </label>
                <Input value={roomArea} onChange={(e) => setRoomArea(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Thời hạn hợp đồng (tháng)
                </label>
                <Input
                  type="number"
                  value={leaseMonths}
                  onChange={(e) => setLeaseMonths(Number(e.target.value) || 12)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Thời gian tính tiền thuê từ ngày
                </label>
                <Input value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} className="text-xs font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Đến ngày
                </label>
                <Input value={leaseEndDate} onChange={(e) => setLeaseEndDate(e.target.value)} className="text-xs font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Giá thuê (VNĐ/tháng)
                </label>
                <Input
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(Number(e.target.value) || 0)}
                  className="text-xs font-bold text-indigo-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tiền đặt cọc (VNĐ)
                </label>
                <Input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                  className="text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Đơn giá điện (VNĐ/kWh)
                </label>
                <Input
                  type="number"
                  value={electricPrice}
                  onChange={(e) => setElectricPrice(Number(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Đơn giá nước (VNĐ/m³)
                </label>
                <Input
                  type="number"
                  value={waterPrice}
                  onChange={(e) => setWaterPrice(Number(e.target.value) || 0)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Địa chỉ khu nhà trọ
              </label>
              <Input value={roomAddress} onChange={(e) => setRoomAddress(e.target.value)} className="text-xs" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Họ tên thụ hưởng ngân hàng
                </label>
                <Input value={bankOwner} onChange={(e) => setBankOwner(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Số tài khoản
                </label>
                <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="text-xs font-mono font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ngân hàng
                </label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="text-xs" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={() => setTab("preview")}
              className="text-xs font-bold gap-1 bg-indigo-600 text-white"
            >
              <span>Xem trước hợp đồng</span>
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Document Preview (A4 Printable Document) */}
      {tab === "preview" && (
        <div className="max-h-[75vh] overflow-y-auto p-2 bg-slate-200/70 rounded-2xl">
          {/* A4 Container */}
          <div
            ref={contractRef}
            id="printable-contract"
            className="max-w-[800px] mx-auto bg-white p-8 sm:p-14 shadow-md rounded-lg text-slate-900 font-serif leading-relaxed text-[13.5px] print:shadow-none print:m-0 print:p-8 print:max-w-none print:w-full print:rounded-none"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Header: Quốc hiệu & Tiêu ngữ */}
            <div className="text-center space-y-1 mb-6">
              <h2 className="font-bold text-sm tracking-wide uppercase">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h2>
              <p className="font-bold text-xs underline underline-offset-4">
                Độc lập – Tự do – Hạnh phúc
              </p>
              <p className="text-xs italic tracking-widest text-slate-600 pt-0.5">
                -----ooo0ooo-----
              </p>
            </div>

            {/* Contract Title */}
            <div className="text-center my-6">
              <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide">
                HỢP ĐỒNG CHO THUÊ PHÒNG TRỌ
              </h1>
            </div>

            {/* Legal grounds */}
            <div className="space-y-1 text-justify mb-4 italic text-[13px]">
              <p>Căn cứ bộ luật dân sự, luật đất đai của nước Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam.</p>
              <p>Căn cứ vào điều kiện và nhu cầu thực tế của các bên trong hợp đồng này.</p>
              <p className="not-italic pt-1">
                Hôm nay, ngày {contractDay} tháng {contractMonth} năm {contractYear}, tại {innName}, chúng tôi gồm:
              </p>
            </div>

            {/* Party A */}
            <div className="space-y-1 mb-4">
              <p className="font-bold uppercase tracking-wide">
                ĐẠI DIỆN BÊN CHO THUÊ PHÒNG TRỌ (gọi tắt là Bên A):
              </p>
              <div className="pl-3 space-y-1">
                <p>
                  - Họ và tên: <strong>{partyAName}</strong>
                </p>
                <p>
                  - CCCD số: <strong>{partyACccd}</strong>; Ngày cấp: {partyACccdDate}; Nơi cấp: {partyACccdPlace}
                </p>
                <p>- Địa chỉ thường trú: {partyAAddress}</p>
                <p>
                  - Số điện thoại: <strong>{partyAPhone}</strong>
                </p>
              </div>
            </div>

            {/* Party B */}
            <div className="space-y-1 mb-4">
              <p className="font-bold uppercase tracking-wide">
                ĐẠI DIỆN BÊN THUÊ PHÒNG TRỌ (gọi tắt là Bên B):
              </p>
              <div className="pl-3 space-y-1">
                <p>
                  - Họ và tên: <strong>{partyBName || "...................................................."}</strong>
                </p>
                <p>
                  - CCCD số: <strong>{partyBCccd || "........................"}</strong>; Ngày cấp: {partyBCccdDate || "..../..../........"}; Nơi cấp: {partyBCccdPlace}
                </p>
                <p>- Địa chỉ thường trú: {partyBAddress || "..........................................................................................."}</p>
                <p>
                  - Số điện thoại: <strong>{partyBPhone || "........................"}</strong>
                </p>
              </div>
            </div>

            <p className="italic mb-4">
              Hai bên cùng thỏa thuận và ký kết hợp đồng thuê phòng trọ với các điều khoản sau:
            </p>

            {/* Điều 1: Thông tin chung */}
            <div className="space-y-2 mb-4 text-justify">
              <p className="font-bold">Điều 1: Thông tin chung</p>
              <div className="pl-3 space-y-1.5">
                <p>- Địa chỉ phòng trọ: {roomAddress}</p>
                <p>
                  - Phòng trọ số: <strong>{room.code}</strong>
                </p>
                <p>- Diện tích: {roomArea}</p>
                <p>
                  - Giá thuê: <strong>{formatVND(monthlyPrice)} VNĐ/tháng</strong>, giá thuê không bao gồm tiền điện, tiền nước và các khoản chi phí khác phát sinh do bên thuê sử dụng.
                </p>
                <p>
                  - Thời gian thuê: <strong>{leaseMonths} tháng</strong>, thời gian tính tiền thuê từ ngày <strong>{leaseStartDate}</strong> đến ngày <strong>{leaseEndDate}</strong>.
                </p>
                <p>
                  - Khi hết thời hạn thuê, nếu hai bên có nhu cầu tiếp tục thuê, sẽ ký hợp đồng mới hoặc gia hạn hợp đồng hiện tại.
                </p>
                <p>
                  - Tiền cọc: <strong>{formatVND(depositAmount)} VNĐ</strong> (tương đương {Math.round(depositAmount / (monthlyPrice || 1))} tháng tiền thuê).
                </p>
                <p>
                  - Tiền điện: <strong>{formatVND(electricPrice)} VNĐ/kWh</strong>, tính theo chỉ số công tơ, thanh toán vào cuối các tháng.
                </p>
                <p>
                  - Tiền nước: <strong>{formatVND(waterPrice)} VNĐ/m³</strong>.
                </p>
                <p>
                  - Với phòng có trang bị máy lạnh, Bên A chịu trách nhiệm bảo trì và định kỳ vệ sinh miễn phí thời gian 06 (Sáu) tháng/ 1 lần. Nếu bên B có phát sinh vệ sinh máy ngoài lịch định kỳ, Bên A sẽ hỗ trợ gọi thợ máy, chi phí do bên B chi trả.
                </p>
                <p>
                  - Khi có sự cố nghẹt cống, tắc cống, tràn cống xảy ra: nếu nguyên nhân do Bên B thì Bên B phải thanh toán cho Bên A chi phí sửa chữa và chi phí sẽ được thông báo cụ thể khi sửa chữa.
                </p>
                <p>
                  - Hình thức thanh toán: Tiền mặt hoặc chuyển khoản vào thông tin sau:
                </p>
                <div className="my-2 p-2 border border-black/80 rounded bg-slate-50/50">
                  <p>Họ và Tên: <strong>{bankOwner}</strong></p>
                  <p>Số tài khoản: <strong>{bankAccount || "...................................."}</strong> tại Ngân hàng <strong>{bankName || "...................................."}</strong></p>
                </div>
                <p>
                  - Bên B sẽ thanh toán tiền thuê phòng cho bên A vào <strong>ngày 05 hàng tháng</strong> cùng với tiền điện và tiền nước. Nếu quá hạn trễ 3 ngày so với thời gian thanh toán và để tình trạng thanh toán trễ quá 3 lần, Bên A có quyền đơn phương chấm dứt hợp đồng và lấy lại phòng (trường hợp xấu nhất buộc phải cắt ổ khoá và không phải chịu trách nhiệm về tài sản trong phòng), Bên B không được quyền khiếu nại và mất 100% số tiền đã cọc.
                </p>

                {/* Furniture Items */}
                <p className="font-semibold pt-1">- Nội thất trang bị sẵn:</p>
                <div className="pl-4 space-y-1">
                  {furnitureItems.length > 0 ? (
                    furnitureItems.map((item, idx) => (
                      <p key={idx}>
                        {idx + 1}. {item}: 01 cái, hoạt động bình thường.
                      </p>
                    ))
                  ) : (
                    <>
                      <p>1. Máy lạnh: 01 cái, hoạt động bình thường.</p>
                      <p>2. Bếp hồng ngoại: ........ cái, hoạt động bình thường.</p>
                      <p>3. Máy nước nóng năng lượng: .......... hoạt động bình thường.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Điều 2: Quyền và nghĩa vụ */}
            <div className="space-y-2 mb-4 text-justify">
              <p className="font-bold">Điều 2: Quyền và nghĩa vụ của các bên</p>
              <div className="pl-3 space-y-1.5">
                <p className="font-bold">2.1. Bên A có quyền và nghĩa vụ:</p>
                <p>- Cung cấp phòng trọ và nội thất trong tình trạng tốt.</p>
                <p>- Không tự ý tăng giá thuê khi hợp đồng còn hiệu lực.</p>
                <p>- Nhận tiền thuê đúng thời hạn.</p>

                <p className="font-bold pt-1">2.2. Bên B có quyền và nghĩa vụ:</p>
                <p>- Thanh toán đầy đủ tiền theo đúng thỏa thuận.</p>
                <p>- Sử dụng phòng trọ đúng mục đích, không cho thuê lại trừ khi có sự đồng ý của bên A.</p>
                <p>- Bảo quản các trang thiết bị và cơ sở vật chất của Bên A trang bị cho ban đầu (làm hỏng phải sửa, mất phải đền).</p>
                <p>- Đảm bảo các thiết bị và sửa chữa các hư hỏng trong phòng trong khi sử dụng. Nếu không sửa chữa thì khi trả phòng, Bên A sẽ trừ vào tiền đặt cọc, giá trị cụ thể được tính theo giá thị trường.</p>
                <p>- Nếu có nhu cầu sửa chữa, cải tạo kiến trúc phòng hoặc trang trí ảnh hưởng tới tường, cột, nền phải trao đổi với Bên A để được thống nhất.</p>
                <p>- Luôn có ý thức giữ gìn vệ sinh trong và ngoài khu vực phòng trọ.</p>
                <p>- Bên B phải chấp hành mọi quy định của pháp luật Nhà nước, quy định của địa phương và quy định thuê phòng ở Điều 3 của Hợp đồng.</p>
              </div>
            </div>

            {/* Điều 3: Nội quy thuê phòng */}
            <div className="space-y-2 mb-4 text-justify">
              <p className="font-bold">Điều 3: Nội quy thuê phòng</p>
              <div className="pl-3 space-y-1">
                <p>- Cấm tổ chức ăn nhậu, tụ tập tham gia các hoạt động cờ bạc, cho vay, đánh bài, số đề, đánh nhau, mua bán, tàng trữ và sử dụng trái phép các chất ma túy.</p>
                <p>- Bên B không được tiếp khách quá 23h. Trường hợp tự ý cho người ở lại qua đêm nếu Công an kiểm tra thì Bên B sẽ phải tự chịu trách nhiệm (nếu bị phạt).</p>
                <p>- Bên B phải tôn trọng giờ nghỉ trưa, đặc biệt là sau 23h không được tổ chức tiệc tùng tại nhà trọ gây mất an ninh trật tự, ảnh hưởng những người thuê còn lại.</p>
                <p>- Xe ra vào chú ý giờ giấc, tránh rồ ga, nẹt pô. Không được gây hấn, nói tục chửi thề hoặc có thái độ không hợp tác với nhân viên quản lý.</p>
                <p>- Không được vứt rác, xả nước, quăng đồ vật bừa bãi ngoài hành lang và sân trước phòng, giữ vệ sinh chung, rác thải phải để tập trung đúng nơi quy định.</p>
                <p>- Bảo quản, giữ gìn và không thay đổi, xê dịch tài sản của phòng ở.</p>
                <p>- Không được khoan tường, không dán tường bằng vật liệu xốp dính, keo dính.</p>
                <p>- Bên B vi phạm ANTT khu vực (đánh nhau, tụ tập ăn nhậu,.....) và các hành vi vi phạm pháp luật (tàng trữ chất cấm, sử dụng ma túy, mại dâm,.....) có thông báo điều tra hoặc quyết định không cho lưu trú - tạm trú của Cơ quan chức năng có thẩm quyền.</p>
                <p>- Trường hợp Bên B liên quan những khoản vay không thể chi trả từ tổ chức - cá nhân cho vay nặng lãi có hành vi đe dọa - bạo lực.</p>
                <p>- Trường hợp Bên B không chấp hành những nội quy trên Bên A được quyền lấy lại phòng. Bên B phải dọn đi trong thời hạn Bên A yêu cầu và mất 100% số tiền đã cọc.</p>
              </div>
            </div>

            {/* Điều 4: Chấm dứt hợp đồng */}
            <div className="space-y-2 mb-4 text-justify">
              <p className="font-bold">Điều 4: Chấm dứt hợp đồng</p>
              <div className="pl-3 space-y-1">
                <p>- Hợp đồng chấm dứt khi hết hạn hoặc do hai bên thỏa thuận.</p>
                <p>- Trường hợp Bên B chấm dứt hợp đồng trước thời hạn, bên B có quyền chuyển giao/ cho thuê lại cho bên mới thì Bên B sẽ nhận lại được tiền cọc.</p>
                <p>- Trường hợp Bên B chấm dứt hợp đồng trước thời hạn mà không chuyển giao/cho thuê lại cho bên mới thì Bên B sẽ mất 100 % số tiền cọc và Bên A sẽ nhận lại phòng ở đã cho Bên B thuê. Ngoài ra Bên B phải có trách nhiệm thanh toán các khoản chi phí dịch vụ (điện, nước…) khi Bên B sử dụng phòng ở.</p>
                <p>- Trong cả 2 trường hợp, Bên B phải báo trước cho Bên A 01 tháng trước khi chấm dứt hợp đồng.</p>
                <p>- Nếu Bên A đơn phương chấm dứt hợp đồng mà không có lý do chính đáng, phải hoàn lại tiền cọc và bồi thường một khoản tương đương tiền cọc.</p>
              </div>
            </div>

            {/* Điều 5: Điều khoản chung */}
            <div className="space-y-2 mb-8 text-justify">
              <p className="font-bold">Điều 5: Điều khoản chung</p>
              <div className="pl-3 space-y-1">
                <p>- Hợp đồng có hiệu lực kể từ ngày ký.</p>
                <p>- Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng hoặc theo quy định của pháp luật.</p>
                <p>- Hợp đồng được lập thành hai bản, mỗi bên giữ một bản có giá trị pháp lý như nhau.</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 text-center pt-4 pb-12 gap-8 font-serif">
              <div className="space-y-1">
                <p className="font-bold uppercase text-sm">Bên A</p>
                <p className="text-xs italic text-slate-500">(ký, ghi rõ họ tên)</p>
                <div className="h-20" />
                <p className="font-bold">{partyAName}</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold uppercase text-sm">Bên B</p>
                <p className="text-xs italic text-slate-500">(ký, ghi rõ họ tên)</p>
                <div className="h-20" />
                <p className="font-bold">{partyBName || "...................................."}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Style for clean A4 printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-contract,
          #printable-contract * {
            visibility: visible;
          }
          #printable-contract {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            box-shadow: none !important;
            background: white !important;
            font-size: 13pt !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>
    </Modal>
  );
}

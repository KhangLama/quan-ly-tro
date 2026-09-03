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
  Calendar,
  Eye,
  Sliders,
  Columns,
  Info,
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
  // Modes: "split" (Desktop side-by-side) | "preview" (Full contract) | "config" (Full form)
  const [viewMode, setViewMode] = useState<"split" | "preview" | "config">("split");
  const [copied, setCopied] = useState(false);

  // Responsive default: "split" on desktop (>=1024px), "preview" on mobile
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1024) {
        setViewMode("preview");
      } else {
        setViewMode("split");
      }
    }
  }, [isOpen]);

  // Contract Date (Ngày ký hợp đồng)
  const today = new Date();
  const [contractDay, setContractDay] = useState(String(today.getDate()).padStart(2, "0"));
  const [contractMonth, setContractMonth] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [contractYear, setContractYear] = useState(String(today.getFullYear()));
  const [innName, setInnName] = useState("Nhà trọ Trúc Lam");
  const [signatureHeight, setSignatureHeight] = useState(120);

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

  // Populate data when opening
  useEffect(() => {
    if (!isOpen) return;

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

    if (leadTenant) {
      setPartyBName(leadTenant.name || "");
      setPartyBCccd(leadTenant.cccd || "");
      setPartyBPhone(leadTenant.phone || "");

      if (leadTenant.start_date) {
        const d = new Date(leadTenant.start_date);
        if (!isNaN(d.getTime())) {
          setContractDay(String(d.getDate()).padStart(2, "0"));
          setContractMonth(String(d.getMonth() + 1).padStart(2, "0"));
          setContractYear(String(d.getFullYear()));

          const sDateStr = `${String(d.getDate()).padStart(2, "0")}/${String(
            d.getMonth() + 1
          ).padStart(2, "0")}/${d.getFullYear()}`;
          setLeaseStartDate(sDateStr);

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

    setMonthlyPrice(room.base_price || 2000000);
    if (settings?.address) setRoomAddress(settings.address);
    if (settings?.electric_price) setElectricPrice(settings.electric_price);
    if (settings?.water_price) setWaterPrice(settings.water_price);

    if (settings?.bank_info) {
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

  const handleSetToday = () => {
    const now = new Date();
    setContractDay(String(now.getDate()).padStart(2, "0"));
    setContractMonth(String(now.getMonth() + 1).padStart(2, "0"));
    setContractYear(String(now.getFullYear()));
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

  const tenantName = partyBName.trim() || leadTenant?.name?.trim() || "Khách thuê";
  const roomLabel = room.code.toLowerCase().startsWith("p") ? room.code : `Phòng ${room.code}`;
  const contractFileName = `HĐPT - ${roomLabel} - ${tenantName}`;

  // Pure multi-page A4 print without browser headers or footers
  const handlePrint = () => {
    const printContent = contractRef.current?.innerHTML;
    if (!printContent) return;

    // Set document title temporarily so browser defaults to this exact filename when saving PDF
    const originalDocTitle = typeof document !== "undefined" ? document.title : "";
    if (typeof document !== "undefined") {
      document.title = contractFileName;
    }

    let iframe = document.getElementById("contract-print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "contract-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${contractFileName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0mm; /* Completely suppresses browser URL, date, and headers/footers */
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: 'Times New Roman', Times, serif;
              font-size: 13pt;
              line-height: 1.42;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            p, div {
              margin: 0;
              padding: 0;
            }
            .page-container {
              width: 210mm;
              padding: 13mm 18mm 13mm 18mm;
              margin: 0 auto;
              page-break-after: always;
              break-after: page;
              box-sizing: border-box;
            }
            .page-container:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .page-3-box {
              font-size: 11.5pt;
              line-height: 1.34;
            }
            .page-3-box p {
              margin-top: 2px;
            }
            .text-center { text-align: center; }
            .text-justify { text-align: justify; text-justify: inter-word; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .italic { font-style: italic; }
            .uppercase { text-transform: uppercase; }
            .underline { text-decoration: underline; }
            .space-y-1 > * + * { margin-top: 3px; }
            .space-y-1-5 > * + * { margin-top: 5px; }
            .space-y-2 > * + * { margin-top: 7px; }
            .pl-3 { padding-left: 14px; }
            .pl-4 { padding-left: 20px; }
            .my-2 { margin-top: 6px; margin-bottom: 6px; }
            .my-4 { margin-top: 12px; margin-bottom: 12px; }
            .my-5 { margin-top: 15px; margin-bottom: 15px; }
            .mb-2 { margin-bottom: 6px; }
            .mb-3 { margin-bottom: 10px; }
            .mb-4 { margin-bottom: 14px; }
            .pt-1 { padding-top: 3px; }
            .bank-box {
              border: 1px solid #111;
              padding: 7px 12px;
              margin: 6px 0;
              border-radius: 4px;
              background-color: #fafafa;
            }
            .signatures-container {
              display: table;
              width: 100%;
              margin-top: 16px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .signature-col {
              display: table-cell;
              width: 50%;
              text-align: center;
              vertical-align: top;
            }
            .signature-space {
              height: ${signatureHeight}px;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (typeof document !== "undefined" && originalDocTitle) {
          document.title = originalDocTitle;
        }
      }, 6000);
    }, 300);
  };

  // Reusable Form Component
  const renderConfigForm = () => (
    <div className="space-y-4">
      {/* Section: Bên A */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            1. Thông tin Bên cho thuê (Bên A)
          </h3>
          <button
            type="button"
            onClick={handleSavePartyADefaults}
            className="text-[11px] font-bold text-indigo-600 hover:underline"
          >
            💾 Lưu làm mặc định
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          2. Thông tin Bên thuê phòng (Bên B - Người đại diện)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          3. Thông tin thuê phòng & Giá cả
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Thời gian thuê từ ngày
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Giá thuê (VNĐ)
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
              Tiền cọc (VNĐ)
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
              Điện (đ/kWh)
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
              Nước (đ/m³)
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Chủ tài khoản
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
    </div>
  );

  // Reusable 3-Page Contract Document Component
  const renderContractDocument = () => (
    <div ref={contractRef} className="space-y-6">
      {/* TRANG 1 */}
      <div
        className="page-container max-w-[760px] mx-auto bg-white p-8 sm:p-12 shadow-md rounded-xl text-slate-900 leading-relaxed text-[13pt]"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Header: Quốc hiệu & Tiêu ngữ */}
        <div className="text-center space-y-1 mb-5">
          <p className="font-bold text-sm tracking-wide uppercase">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </p>
          <p className="font-bold text-xs underline underline-offset-4">
            Độc lập – Tự do – Hạnh phúc
          </p>
          <p className="text-xs italic tracking-widest text-slate-500 pt-0.5">
            -----ooo0ooo-----
          </p>
        </div>

        {/* Contract Title */}
        <div className="text-center my-4">
          <p className="text-lg sm:text-xl font-bold uppercase tracking-wide">
            HỢP ĐỒNG CHO THUÊ PHÒNG TRỌ
          </p>
        </div>

        {/* Legal grounds */}
        <div className="space-y-1 text-justify mb-4 italic text-[12.5pt]">
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

        <p className="italic mb-3">
          Hai bên cùng thỏa thuận và ký kết hợp đồng thuê phòng trọ với các điều khoản sau:
        </p>

        {/* Điều 1: Thông tin chung (Phần 1) */}
        <div className="space-y-2 text-justify">
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
          </div>
        </div>
      </div>

      {/* TRANG 2 */}
      <div
        className="page-container max-w-[760px] mx-auto bg-white p-8 sm:p-12 shadow-md rounded-xl text-slate-900 leading-relaxed text-[13pt]"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        <div className="space-y-2 text-justify mb-4">
          <div className="pl-3 space-y-1.5">
            <p>
              - Với phòng có trang bị máy lạnh, Bên A chịu trách nhiệm bảo trì và định kỳ vệ sinh miễn phí thời gian 06 (Sáu) tháng/ 1 lần. Nếu bên B có phát sinh vệ sinh máy ngoài lịch định kỳ, Bên A sẽ hỗ trợ gọi thợ máy, chi phí do bên B chi trả.
            </p>
            <p>
              - Khi có sự cố nghẹt cống, tắc cống, tràn cống xảy ra: nếu nguyên nhân do Bên B thì Bên B phải thanh toán cho Bên A chi phí sửa chữa và chi phí sẽ được thông báo cụ thể khi sửa chữa.
            </p>
            <p>
              - Hình thức thanh toán: Tiền mặt hoặc chuyển khoản vào thông tin sau:
            </p>
            <div className="bank-box my-2 p-2.5 border border-black rounded">
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

        {/* Điều 3: Tiêu đề mở đầu */}
        <div className="text-justify">
          <p className="font-bold">Điều 3: Nội quy thuê phòng</p>
        </div>
      </div>

      {/* TRANG 3 */}
      <div
        className="page-container page-3-box max-w-[760px] mx-auto bg-white p-8 sm:p-12 shadow-md rounded-xl text-slate-900 leading-[1.36] text-[12pt]"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Tiếp tục Điều 3 */}
        <div className="space-y-1 text-justify mb-3">
          <div className="pl-3 space-y-0.5">
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
        <div className="space-y-1 mb-3 text-justify">
          <p className="font-bold">Điều 4: Chấm dứt hợp đồng</p>
          <div className="pl-3 space-y-0.5">
            <p>- Hợp đồng chấm dứt khi hết hạn hoặc do hai bên thỏa thuận.</p>
            <p>- Trường hợp Bên B chấm dứt hợp đồng trước thời hạn, bên B có quyền chuyển giao/ cho thuê lại cho bên mới thì Bên B sẽ nhận lại được tiền cọc.</p>
            <p>- Trường hợp Bên B chấm dứt hợp đồng trước thời hạn mà không chuyển giao/cho thuê lại cho bên mới thì Bên B sẽ mất 100 % số tiền cọc và Bên A sẽ nhận lại phòng ở đã cho Bên B thuê. Ngoài ra Bên B phải có trách nhiệm thanh toán các khoản chi phí dịch vụ (điện, nước…) khi Bên B sử dụng phòng ở.</p>
            <p>- Trong cả 2 trường hợp, Bên B phải báo trước cho Bên A 01 tháng trước khi chấm dứt hợp đồng.</p>
            <p>- Nếu Bên A đơn phương chấm dứt hợp đồng mà không có lý do chính đáng, phải hoàn lại tiền cọc và bồi thường một khoản tương đương tiền cọc.</p>
          </div>
        </div>

        {/* Điều 5: Điều khoản chung */}
        <div className="space-y-1 mb-4 text-justify">
          <p className="font-bold">Điều 5: Điều khoản chung</p>
          <div className="pl-3 space-y-0.5">
            <p>- Hợp đồng có hiệu lực kể từ ngày ký.</p>
            <p>- Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng hoặc theo quy định của pháp luật.</p>
            <p>- Hợp đồng được lập thành hai bản, mỗi bên giữ một bản có giá trị pháp lý như nhau.</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="signatures-container pt-3 pb-8 font-serif">
          <div className="signature-col">
            <p className="font-bold uppercase text-sm">Bên A</p>
            <p className="text-xs italic text-slate-500">(ký, ghi rõ họ tên)</p>
            <div className="signature-space" style={{ height: `${signatureHeight}px` }} />
            <p className="font-bold text-sm text-slate-900">{partyAName}</p>
          </div>
          <div className="signature-col">
            <p className="font-bold uppercase text-sm">Bên B</p>
            <p className="text-xs italic text-slate-500">(ký, ghi rõ họ tên)</p>
            <div className="signature-space" style={{ height: `${signatureHeight}px` }} />
            <p className="font-bold text-sm text-slate-900">{partyBName || "...................................."}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-slate-900">{contractFileName}</span>
        </div>
      }
      description="Xem trước, tùy chỉnh trực tiếp và in ấn bản hợp đồng thuê trọ chuẩn A4 pháp lý"
      size="full"
    >
      <div className="flex flex-col h-full space-y-3">
        {/* Top Control Bar: View Switcher & Action Buttons */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
          {/* Desktop View Switcher */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "split"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Chia đôi màn hình (Soạn + Xem)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "preview"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Toàn màn hình Hợp đồng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("config")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "config"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Toàn màn hình Soạn thảo</span>
            </button>
          </div>

          {/* Mobile Tabs Switcher */}
          <div className="lg:hidden flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode !== "config"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước & In</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("config")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "config"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Soạn thảo</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-600">Tên file khi lưu:</span>
              <span className="font-bold text-indigo-900 font-mono text-[11px] max-w-[260px] truncate" title={`${contractFileName}.pdf`}>
                {contractFileName}.pdf
              </span>
            </div>

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

        {/* Quick Toolbar: Date & Signatures Space Adjustment */}
        <div className="p-2.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Ngày ký:</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-slate-600">Ngày</span>
              <input
                type="text"
                maxLength={2}
                value={contractDay}
                onChange={(e) => setContractDay(e.target.value)}
                className="w-9 h-7 text-center font-bold text-indigo-900 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="text-slate-600">tháng</span>
              <input
                type="text"
                maxLength={2}
                value={contractMonth}
                onChange={(e) => setContractMonth(e.target.value)}
                className="w-9 h-7 text-center font-bold text-indigo-900 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="text-slate-600">năm</span>
              <input
                type="text"
                maxLength={4}
                value={contractYear}
                onChange={(e) => setContractYear(e.target.value)}
                className="w-14 h-7 text-center font-bold text-indigo-900 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={handleSetToday}
              className="text-[11px] text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg font-bold transition-colors"
            >
              Hôm nay
            </button>
          </div>

          {/* Signature Height Control */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white border border-indigo-200 px-2.5 py-1 rounded-xl shadow-2xs">
              <span className="text-slate-600 font-semibold text-[11px] whitespace-nowrap">Chỗ ký:</span>
              <button
                type="button"
                onClick={() => setSignatureHeight((h) => Math.max(60, h - 15))}
                className="w-5 h-5 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 rounded text-xs transition-colors"
                title="Thu nhỏ chỗ ký"
              >
                -
              </button>
              <span className="font-bold text-indigo-700 min-w-9 text-center text-xs">
                {signatureHeight}px
              </span>
              <button
                type="button"
                onClick={() => setSignatureHeight((h) => Math.min(180, h + 15))}
                className="w-5 h-5 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 rounded text-xs transition-colors"
                title="Mở rộng chỗ ký"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <span>Địa điểm:</span>
              <input
                type="text"
                value={innName}
                onChange={(e) => setInnName(e.target.value)}
                className="h-7 px-2 font-medium text-slate-800 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="Nhà trọ Trúc Lam"
              />
            </div>
          </div>
        </div>

        {/* Content Area - Responsive Desktop Layout */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Mode 1: Split View (Side-by-Side: Config on left, Live Contract on right) */}
          {viewMode === "split" && (
            <div className="flex flex-col lg:flex-row h-full gap-4 overflow-hidden">
              {/* Left Column: Form Controls */}
              <div className="w-full lg:w-[460px] xl:w-[500px] 2xl:w-[540px] shrink-0 h-full overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="pb-2 flex items-center justify-between border-b border-slate-200/80 mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cấu hình & Nhập liệu</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Tự động cập nhật trực tiếp</span>
                </div>
                {renderConfigForm()}
              </div>

              {/* Right Column: Live Document Preview */}
              <div className="flex-1 min-w-0 h-full overflow-y-auto p-4 bg-slate-200/90 border border-slate-300 rounded-2xl">
                <div className="flex items-center gap-2 p-2 bg-amber-50/90 border border-amber-200/90 rounded-xl text-amber-900 text-xs mb-4">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Bản xem trước trực tiếp tương ứng 100% với file PDF và bản in thực tế. Chỉnh sửa bên trái sẽ cập nhật ngay tại đây.
                  </span>
                </div>
                {renderContractDocument()}
              </div>
            </div>
          )}

          {/* Mode 2: Full Preview Only */}
          {viewMode === "preview" && (
            <div className="h-full overflow-y-auto p-4 bg-slate-200/90 border border-slate-300 rounded-2xl">
              <div className="flex items-center gap-2 p-2 bg-amber-50/90 border border-amber-200/90 rounded-xl text-amber-900 text-xs mb-4 max-w-[760px] mx-auto">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Bản xem trước A4 trọn vẹn 3 trang. Bấm <strong>In hợp đồng (PDF)</strong> để in hoặc lưu file PDF.
                </span>
              </div>
              {renderContractDocument()}
            </div>
          )}

          {/* Mode 3: Full Config Form Only */}
          {viewMode === "config" && (
            <div className="h-full overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="max-w-4xl mx-auto">
                {renderConfigForm()}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

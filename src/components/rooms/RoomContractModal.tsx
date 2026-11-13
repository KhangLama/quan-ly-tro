"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Save,
  Trash2,
  History,
  PenLine,
  RotateCcw,
  ChevronDown,
  Settings,
  Plus,
  Tag,
} from "lucide-react";
import type { Room, Tenant, Setting, Contract } from "@/types";
import {
  parsePaymentAccounts,
  getBankDisplayName,
  type PaymentAccountsConfig,
} from "@/lib/vietqr";
import {
  DEFAULT_CONTRACT_TEMPLATE,
  interpolateContractText,
  createDefaultRentStages,
  type ContractTemplateConfig,
  type RentPriceStage,
} from "@/lib/contracts/template";
import {
  saveContract,
  getContractsByRoom,
  deleteContract,
  getContractTemplate,
  saveContractTemplate,
  getRoomContractConfig,
  saveRoomContractConfig,
} from "@/actions/contracts";

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

  // Global Template Clauses State
  const [templateConfig, setTemplateConfig] = useState<ContractTemplateConfig>({
    ...DEFAULT_CONTRACT_TEMPLATE,
  });

  // Contract Date (Ngày ký hợp đồng)
  const today = new Date();
  const [contractDay, setContractDay] = useState(String(today.getDate()).padStart(2, "0"));
  const [contractMonth, setContractMonth] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [contractYear, setContractYear] = useState(String(today.getFullYear()));
  const [innName, setInnName] = useState(DEFAULT_CONTRACT_TEMPLATE.innName);
  const [contractTitle, setContractTitle] = useState(DEFAULT_CONTRACT_TEMPLATE.contractTitle);
  const [signatureHeight, setSignatureHeight] = useState(
    DEFAULT_CONTRACT_TEMPLATE.defaultSignatureHeight
  );
  const [paymentDueDay, setPaymentDueDay] = useState(
    DEFAULT_CONTRACT_TEMPLATE.paymentDueDay
  );

  // Party A (Landlord - Bên A)
  const [partyAName, setPartyAName] = useState(DEFAULT_CONTRACT_TEMPLATE.partyAName);
  const [partyACccd, setPartyACccd] = useState(DEFAULT_CONTRACT_TEMPLATE.partyACccd);
  const [partyACccdDate, setPartyACccdDate] = useState(
    DEFAULT_CONTRACT_TEMPLATE.partyACccdDate
  );
  const [partyACccdPlace, setPartyACccdPlace] = useState(
    DEFAULT_CONTRACT_TEMPLATE.partyACccdPlace
  );
  const [partyAAddress, setPartyAAddress] = useState(
    DEFAULT_CONTRACT_TEMPLATE.partyAAddress
  );
  const [partyAPhone, setPartyAPhone] = useState(DEFAULT_CONTRACT_TEMPLATE.partyAPhone);

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
  const [roomArea, setRoomArea] = useState(DEFAULT_CONTRACT_TEMPLATE.defaultRoomArea);
  const [monthlyPrice, setMonthlyPrice] = useState(room.base_price || 2000000);
  const [leaseMonths, setLeaseMonths] = useState(
    DEFAULT_CONTRACT_TEMPLATE.defaultLeaseMonths
  );
  const [leaseStartDate, setLeaseStartDate] = useState("01/09/2026");
  const [leaseEndDate, setLeaseEndDate] = useState("01/09/2027");
  const [depositAmount, setDepositAmount] = useState(room.base_price || 2000000);
  const [electricPrice, setElectricPrice] = useState(settings?.electric_price || 4000);
  const [waterPrice, setWaterPrice] = useState(settings?.water_price || 12000);

  // Bank info
  const [paymentConfig, setPaymentConfig] = useState<PaymentAccountsConfig | null>(null);
  const [bankOwner, setBankOwner] = useState("Bùi Thanh Tùng");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [serviceOwner, setServiceOwner] = useState("");
  const [serviceAccount, setServiceAccount] = useState("");
  const [serviceBank, setServiceBank] = useState("");

  // Furniture items & Room-specific Special Terms & Staged Pricing
  const [furnitureItems, setFurnitureItems] = useState<string[]>([]);
  const [specialTerms, setSpecialTerms] = useState<string[]>([]);
  const [enableStagedPricing, setEnableStagedPricing] = useState(false);
  const [rentStages, setRentStages] = useState<RentPriceStage[]>([]);
  const [savingRoomConfig, setSavingRoomConfig] = useState(false);
  const [savingPartyA, setSavingPartyA] = useState(false);

  // Contract persistence & inline editing
  const [savedContracts, setSavedContracts] = useState<Contract[]>([]);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [editedHtml, setEditedHtml] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Populate data when opening:
  // Priority: 1. Global Contract Template -> 2. RoomContractConfig -> 3. Current Lead Tenant
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const initModalData = async () => {
      // Reset inline-edit state when opening fresh
      setIsEditable(false);
      setEditedHtml(null);
      setEditingContractId(null);
      setShowHistory(false);
      setSaveMsg(null);

      // Fetch Global Template & Room-Specific Config in parallel
      const [tplRes, roomCfgRes] = await Promise.all([
        getContractTemplate(),
        getRoomContractConfig(room.id),
      ]);

      if (cancelled) return;

      const tpl = tplRes.template || DEFAULT_CONTRACT_TEMPLATE;
      const rCfg = roomCfgRes.config || {};

      setTemplateConfig(tpl);
      setInnName(tpl.innName);
      setContractTitle(tpl.contractTitle);
      setPartyAName(tpl.partyAName);
      setPartyACccd(tpl.partyACccd);
      setPartyACccdDate(tpl.partyACccdDate);
      setPartyACccdPlace(tpl.partyACccdPlace);
      setPartyAAddress(tpl.partyAAddress);
      setPartyAPhone(tpl.partyAPhone);
      setSignatureHeight(tpl.defaultSignatureHeight || 120);
      setPaymentDueDay(tpl.paymentDueDay || "ngày 05 hàng tháng");

      // Also check localStorage fallback if user saved offline
      if (typeof window !== "undefined") {
        try {
          const savedA = localStorage.getItem("contract_party_a");
          if (savedA && !tpl.partyAName) {
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

      // Layer 2: Room-specific overrides
      const effectiveLeaseMonths =
        rCfg.defaultLeaseMonths || tpl.defaultLeaseMonths || 12;
      setRoomArea(rCfg.roomArea || tpl.defaultRoomArea || "32m2");
      setLeaseMonths(effectiveLeaseMonths);

      const baseAddress =
        rCfg.roomAddressOverride ||
        settings?.address ||
        "325B Kv. Phú Mỹ, Phường Cái Răng, Thành phố Cần Thơ.";
      setRoomAddress(baseAddress);

      setMonthlyPrice(room.base_price || 2000000);
      if (settings?.electric_price) setElectricPrice(settings.electric_price);
      if (settings?.water_price) setWaterPrice(settings.water_price);

      // Deposit priority: leadTenant.deposit_amount -> rCfg.defaultDepositAmount -> room.base_price
      if (leadTenant?.deposit_amount) {
        setDepositAmount(Number(leadTenant.deposit_amount));
      } else if (rCfg.defaultDepositAmount !== undefined) {
        setDepositAmount(Number(rCfg.defaultDepositAmount));
      } else {
        setDepositAmount(room.base_price || 2000000);
      }

      // Layer 3: Lead Tenant details
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

            const endD = new Date(d);
            endD.setMonth(endD.getMonth() + effectiveLeaseMonths);
            const eDateStr = `${String(endD.getDate()).padStart(2, "0")}/${String(
              endD.getMonth() + 1
            ).padStart(2, "0")}/${endD.getFullYear()}`;
            setLeaseEndDate(eDateStr);
          }
        }
      } else {
        setPartyBName("");
        setPartyBCccd("");
        setPartyBPhone("");
      }

      // Bank accounts
      if (settings?.bank_info) {
        const parsed = parsePaymentAccounts(settings.bank_info);
        setPaymentConfig(parsed);
        setBankOwner(parsed.room.accountName || tpl.partyAName || "Bùi Thanh Tùng");
        setBankAccount(parsed.room.accountNumber || "");
        setBankName(getBankDisplayName(parsed.room.bank) || parsed.room.bank || "");

        if (parsed.split) {
          setServiceOwner(parsed.service.accountName || "");
          setServiceAccount(parsed.service.accountNumber || "");
          setServiceBank(
            getBankDisplayName(parsed.service.bank) || parsed.service.bank || ""
          );
        }
      }

      // Furniture Details priority: rCfg.furnitureDetails -> room.furniture
      if (
        Array.isArray(rCfg.furnitureDetails) &&
        rCfg.furnitureDetails.length > 0
      ) {
        setFurnitureItems(rCfg.furnitureDetails);
      } else {
        let fList: string[] = (room as any)?.furniture || [];
        if ((!fList || fList.length === 0) && typeof window !== "undefined") {
          try {
            const cached = localStorage.getItem(`room_furniture_${room.id}`);
            if (cached) fList = JSON.parse(cached);
          } catch {}
        }
        setFurnitureItems(Array.isArray(fList) ? fList : []);
      }

      setSpecialTerms(
        Array.isArray(rCfg.specialTerms) ? rCfg.specialTerms : []
      );

      // Staged Pricing priority: rCfg.enableStagedPricing & rCfg.rentStages
      const isStaged = Boolean(rCfg.enableStagedPricing);
      setEnableStagedPricing(isStaged);
      if (Array.isArray(rCfg.rentStages) && rCfg.rentStages.length > 0) {
        setRentStages(rCfg.rentStages);
      } else {
        setRentStages(
          createDefaultRentStages(
            room.base_price || 2000000,
            effectiveLeaseMonths,
            6
          )
        );
      }
    };

    initModalData();

    return () => {
      cancelled = true;
    };
  }, [isOpen, room, leadTenant, settings]);

  // Fetch saved contracts for this room
  useEffect(() => {
    if (!isOpen || !room?.id) return;
    (async () => {
      const { contracts } = await getContractsByRoom(room.id);
      setSavedContracts(contracts);
    })();
  }, [isOpen, room?.id]);

  // Format staged pricing summary if enabled
  const stagedPricingSummary =
    enableStagedPricing && rentStages.length > 0
      ? rentStages
          .map(
            (s) =>
              `${s.label}${s.months ? ` (${s.months} tháng)` : ""}: ${formatVND(
                s.price
              )} VNĐ/tháng${s.note ? ` (${s.note})` : ""}`
          )
          .join("; ")
      : "";

  // Variables map for interpolateContractText
  const interpolationVars: Record<string, string | number | undefined> = {
    "{{TEN_NHA_TRO}}": innName,
    "{{MA_PHONG}}": room.code,
    "{{DIEN_TICH}}": roomArea,
    "{{GIA_THUE}}":
      enableStagedPricing && rentStages.length > 0
        ? stagedPricingSummary
        : `${formatVND(monthlyPrice)} VNĐ/tháng`,
    "{{LO_TRINH_GIA_THUE}}": stagedPricingSummary,
    "{{TIEN_COC}}": `${formatVND(depositAmount)} VNĐ`,
    "{{GIA_DIEN}}": `${formatVND(electricPrice)} VNĐ/kWh`,
    "{{GIA_NUOC}}": `${formatVND(waterPrice)} VNĐ/m³`,
    "{{TEN_BEN_A}}": partyAName,
    "{{SDT_BEN_A}}": partyAPhone,
    "{{TEN_BEN_B}}": partyBName || "Bên B",
    "{{SDT_BEN_B}}": partyBPhone,
    "{{THOI_HAN_THUE}}": `${leaseMonths} tháng`,
    "{{NGAY_BAT_DAU}}": leaseStartDate,
    "{{NGAY_KET_THUC}}": leaseEndDate,
    "{{NGAY_THANH_TOAN}}": paymentDueDay,
  };

  // Collect all form state into a serializable object
  const collectFormData = () => ({
    contractDay,
    contractMonth,
    contractYear,
    innName,
    contractTitle,
    signatureHeight,
    paymentDueDay,
    partyAName,
    partyACccd,
    partyACccdDate,
    partyACccdPlace,
    partyAAddress,
    partyAPhone,
    partyBName,
    partyBCccd,
    partyBCccdDate,
    partyBCccdPlace,
    partyBAddress,
    partyBPhone,
    roomAddress,
    roomArea,
    monthlyPrice,
    leaseMonths,
    leaseStartDate,
    leaseEndDate,
    depositAmount,
    electricPrice,
    waterPrice,
    bankOwner,
    bankAccount,
    bankName,
    serviceOwner,
    serviceAccount,
    serviceBank,
    furnitureItems,
    specialTerms,
    enableStagedPricing,
    rentStages,
  });

  // Restore form state from a saved snapshot
  const restoreFormData = (fd: Record<string, any>) => {
    if (fd.contractDay) setContractDay(fd.contractDay);
    if (fd.contractMonth) setContractMonth(fd.contractMonth);
    if (fd.contractYear) setContractYear(fd.contractYear);
    if (fd.innName !== undefined) setInnName(fd.innName);
    if (fd.contractTitle !== undefined) setContractTitle(fd.contractTitle);
    if (fd.signatureHeight) setSignatureHeight(fd.signatureHeight);
    if (fd.paymentDueDay) setPaymentDueDay(fd.paymentDueDay);
    if (fd.partyAName) setPartyAName(fd.partyAName);
    if (fd.partyACccd !== undefined) setPartyACccd(fd.partyACccd);
    if (fd.partyACccdDate) setPartyACccdDate(fd.partyACccdDate);
    if (fd.partyACccdPlace) setPartyACccdPlace(fd.partyACccdPlace);
    if (fd.partyAAddress) setPartyAAddress(fd.partyAAddress);
    if (fd.partyAPhone) setPartyAPhone(fd.partyAPhone);
    if (fd.partyBName !== undefined) setPartyBName(fd.partyBName);
    if (fd.partyBCccd !== undefined) setPartyBCccd(fd.partyBCccd);
    if (fd.partyBCccdDate) setPartyBCccdDate(fd.partyBCccdDate);
    if (fd.partyBCccdPlace) setPartyBCccdPlace(fd.partyBCccdPlace);
    if (fd.partyBAddress) setPartyBAddress(fd.partyBAddress);
    if (fd.partyBPhone !== undefined) setPartyBPhone(fd.partyBPhone);
    if (fd.roomAddress) setRoomAddress(fd.roomAddress);
    if (fd.roomArea) setRoomArea(fd.roomArea);
    if (fd.monthlyPrice !== undefined) setMonthlyPrice(fd.monthlyPrice);
    if (fd.leaseMonths) setLeaseMonths(fd.leaseMonths);
    if (fd.leaseStartDate) setLeaseStartDate(fd.leaseStartDate);
    if (fd.leaseEndDate) setLeaseEndDate(fd.leaseEndDate);
    if (fd.depositAmount !== undefined) setDepositAmount(fd.depositAmount);
    if (fd.electricPrice !== undefined) setElectricPrice(fd.electricPrice);
    if (fd.waterPrice !== undefined) setWaterPrice(fd.waterPrice);
    if (fd.bankOwner) setBankOwner(fd.bankOwner);
    if (fd.bankAccount !== undefined) setBankAccount(fd.bankAccount);
    if (fd.bankName !== undefined) setBankName(fd.bankName);
    if (fd.serviceOwner !== undefined) setServiceOwner(fd.serviceOwner);
    if (fd.serviceAccount !== undefined) setServiceAccount(fd.serviceAccount);
    if (fd.serviceBank !== undefined) setServiceBank(fd.serviceBank);
    if (Array.isArray(fd.furnitureItems)) setFurnitureItems(fd.furnitureItems);
    if (Array.isArray(fd.specialTerms)) setSpecialTerms(fd.specialTerms);
    if (fd.enableStagedPricing !== undefined) {
      setEnableStagedPricing(Boolean(fd.enableStagedPricing));
    }
    if (Array.isArray(fd.rentStages)) {
      setRentStages(fd.rentStages);
    }
  };

  // Save current contract
  const handleSaveContract = async () => {
    setIsSaving(true);
    setSaveMsg(null);

    const htmlContent =
      isEditable && editedHtml ? editedHtml : contractRef.current?.innerHTML || "";

    const { contract, error } = await saveContract({
      id: editingContractId || undefined,
      room_id: room.id,
      tenant_id: leadTenant?.id || null,
      tenant_name: partyBName.trim() || leadTenant?.name || "",
      title: contractFileName,
      html_content: htmlContent,
      form_data: collectFormData(),
      status: "draft",
    });

    if (error) {
      setSaveMsg(`❌ Lỗi: ${error}`);
    } else if (contract) {
      setEditingContractId(contract.id);
      setSaveMsg("✅ Đã lưu hợp đồng!");
      const { contracts } = await getContractsByRoom(room.id);
      setSavedContracts(contracts);
    }

    setIsSaving(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  // Load a saved contract
  const handleLoadContract = (c: Contract) => {
    setEditingContractId(c.id);
    setShowHistory(false);

    if (c.form_data) {
      restoreFormData(c.form_data);
    }

    if (c.html_content) {
      setEditedHtml(c.html_content);
      setIsEditable(true);
    } else {
      setIsEditable(false);
      setEditedHtml(null);
    }
  };

  // Delete a saved contract
  const handleDeleteContract = async (id: string) => {
    if (!confirm("Xoá hợp đồng này? Thao tác không thể hoàn tác.")) return;
    await deleteContract(id);
    if (editingContractId === id) {
      setEditingContractId(null);
      setEditedHtml(null);
      setIsEditable(false);
    }
    const { contracts } = await getContractsByRoom(room.id);
    setSavedContracts(contracts);
  };

  // Toggle contentEditable on preview
  const handleToggleEditable = () => {
    if (isEditable) {
      if (contractRef.current) {
        setEditedHtml(contractRef.current.innerHTML);
      }
      setIsEditable(false);
    } else {
      if (!editedHtml && contractRef.current) {
        setEditedHtml(contractRef.current.innerHTML);
      }
      setIsEditable(true);
      if (viewMode === "config") setViewMode("preview");
    }
  };

  // Reset back to form-generated content (discard inline edits)
  const handleResetToForm = () => {
    setEditedHtml(null);
    setIsEditable(false);
  };

  // Save Party A defaults directly to Supabase Contract Template
  const handleSavePartyADefaults = async () => {
    setSavingPartyA(true);
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
      } catch {}
    }

    const res = await saveContractTemplate({
      innName,
      contractTitle,
      partyAName,
      partyACccd,
      partyACccdDate,
      partyACccdPlace,
      partyAAddress,
      partyAPhone,
    });
    setSavingPartyA(false);

    if (res.success) {
      setSaveMsg("✅ Đã lưu mặc định Bên A vào hệ thống!");
      setTimeout(() => setSaveMsg(null), 3200);
    } else {
      alert(res.error || "Đã lưu tạm trên trình duyệt!");
    }
  };

  // Save Room-Specific Contract Defaults (Section 4) directly to Supabase
  const handleSaveRoomContractDefaults = async () => {
    setSavingRoomConfig(true);
    const res = await saveRoomContractConfig(room.id, {
      roomArea: roomArea.trim() || undefined,
      defaultLeaseMonths: leaseMonths,
      defaultDepositAmount: depositAmount,
      roomAddressOverride:
        roomAddress !== settings?.address ? roomAddress.trim() : undefined,
      furnitureDetails: furnitureItems.map((s) => s.trim()).filter(Boolean),
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
    });
    setSavingRoomConfig(false);

    if (res.success) {
      setSaveMsg(`✅ Đã lưu mặc định riêng cho Phòng ${room.code}!`);
      setTimeout(() => setSaveMsg(null), 3200);
    } else {
      setSaveMsg(`❌ Lỗi: ${res.error || "Không thể lưu cấu hình phòng"}`);
      setTimeout(() => setSaveMsg(null), 3200);
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

    const originalDocTitle = typeof document !== "undefined" ? document.title : "";
    if (typeof document !== "undefined") {
      document.title = contractFileName;
    }

    let iframe = document.getElementById("contract-print-iframe") as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }
    iframe = document.createElement("iframe");
    iframe.id = "contract-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

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
              margin: 0mm;
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
      {/* Section 1: Bên A */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            1. Thông tin Bên cho thuê (Bên A)
          </h3>
          <button
            type="button"
            disabled={savingPartyA}
            onClick={handleSavePartyADefaults}
            className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer disabled:opacity-50"
          >
            {savingPartyA ? "Đang lưu..." : "💾 Lưu mặc định Bên A"}
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

      {/* Section 2: Bên B */}
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

      {/* Section 3: Điều khoản phòng & Giá */}
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

        {/* Staged Pricing in Modal Config */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                Chia lộ trình giá thuê (6 tháng đầu / 6 tháng sau)
              </span>
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
                        monthlyPrice || 2000000,
                        leaseMonths || 12,
                        6
                      )
                    );
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600"></div>
              <span className="ml-1.5 text-[11px] font-bold text-amber-900">
                {enableStagedPricing ? "Bật" : "Tắt"}
              </span>
            </label>
          </div>

          {enableStagedPricing && (
            <div className="space-y-2 pt-1 border-t border-amber-200/80">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-[10px] font-semibold text-slate-600">
                  Tùy chỉnh giai đoạn:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setRentStages(
                        createDefaultRentStages(
                          monthlyPrice || 2000000,
                          leaseMonths || 12,
                          6
                        )
                      )
                    }
                    className="text-[10px] font-bold text-amber-800 bg-white hover:bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Mẫu 6th đầu / 6th sau
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
                          price: monthlyPrice || 2000000,
                          note: "",
                        },
                      ])
                    }
                    className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {rentStages.map((stg, sIdx) => (
                  <div
                    key={stg.id || sIdx}
                    className="p-2 bg-white rounded-lg border border-amber-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={stg.label}
                        onChange={(e) => {
                          const next = [...rentStages];
                          next[sIdx] = { ...next[sIdx], label: e.target.value };
                          setRentStages(next);
                        }}
                        placeholder="06 tháng đầu"
                        className="text-xs font-bold h-7 flex-1"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={stg.months || ""}
                        onChange={(e) => {
                          const next = [...rentStages];
                          next[sIdx] = {
                            ...next[sIdx],
                            months: Math.max(1, Number(e.target.value) || 1),
                          };
                          setRentStages(next);
                        }}
                        placeholder="Tháng"
                        className="text-xs font-bold text-center h-7 w-16"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={stg.price}
                        onChange={(e) => {
                          const next = [...rentStages];
                          next[sIdx] = {
                            ...next[sIdx],
                            price: Math.max(0, Number(e.target.value) || 0),
                          };
                          setRentStages(next);
                        }}
                        className="text-xs font-bold text-amber-700 h-7 w-28"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRentStages((prev) =>
                            prev.filter((_, i) => i !== sIdx)
                          )
                        }
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Input
                      value={stg.note || ""}
                      onChange={(e) => {
                        const next = [...rentStages];
                        next[sIdx] = { ...next[sIdx], note: e.target.value };
                        setRentStages(next);
                      }}
                      placeholder="Ghi chú (VD: Giá ưu đãi thời gian đầu / Đúng giá chuẩn HĐ)"
                      className="text-[11px] text-slate-600 bg-slate-50 h-6"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Địa chỉ khu nhà trọ
          </label>
          <Input value={roomAddress} onChange={(e) => setRoomAddress(e.target.value)} className="text-xs" />
        </div>

        {paymentConfig?.split ? (
          <div className="space-y-3 pt-1">
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-indigo-700 block uppercase tracking-wider">
                1. Tài khoản nhận TIỀN PHÒNG
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Chủ tài khoản</label>
                  <Input value={bankOwner} onChange={(e) => setBankOwner(e.target.value)} className="text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Số tài khoản</label>
                  <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Ngân hàng</label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="text-xs" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-emerald-700 block uppercase tracking-wider">
                2. Tài khoản nhận TIỀN ĐIỆN, NƯỚC & DỊCH VỤ
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Chủ tài khoản</label>
                  <Input value={serviceOwner} onChange={(e) => setServiceOwner(e.target.value)} className="text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Số tài khoản</label>
                  <Input value={serviceAccount} onChange={(e) => setServiceAccount(e.target.value)} className="text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Ngân hàng</label>
                  <Input value={serviceBank} onChange={(e) => setServiceBank(e.target.value)} className="text-xs" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Chủ tài khoản
              </label>
              <Input value={bankOwner} onChange={(e) => setBankOwner(e.target.value)} className="text-xs font-semibold" />
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
        )}
      </div>

      {/* Section 4: Cấu hình riêng của Phòng (Nội thất HĐ & Điều khoản riêng) */}
      <div className="p-4 bg-white rounded-2xl border border-indigo-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
            4. Cấu hình riêng của Phòng {room.code} (Nội thất HĐ & Điều khoản riêng)
          </h3>
          <button
            type="button"
            disabled={savingRoomConfig}
            onClick={handleSaveRoomContractDefaults}
            className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer disabled:opacity-50"
          >
            {savingRoomConfig
              ? "Đang lưu..."
              : `💾 Lưu làm mặc định cho Phòng ${room.code}`}
          </button>
        </div>

        {/* Furniture Items Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-700">
              Danh mục nội thất bàn giao trên Hợp đồng ({furnitureItems.length})
            </label>
            <button
              type="button"
              onClick={() =>
                setFurnitureItems((prev) => [
                  ...prev,
                  "Thiết bị mới: 01 cái, hoạt động bình thường.",
                ])
              }
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm nội thất</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {furnitureItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 w-5 text-right shrink-0">
                  {idx + 1}.
                </span>
                <Input
                  value={item}
                  onChange={(e) => {
                    const next = [...furnitureItems];
                    next[idx] = e.target.value;
                    setFurnitureItems(next);
                  }}
                  className="text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFurnitureItems((prev) =>
                      prev.filter((_, i) => i !== idx)
                    )
                  }
                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  title="Xóa dòng"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Special Terms Editor */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-700">
              Điều khoản / Thỏa thuận riêng của Phòng {room.code} ({specialTerms.length})
            </label>
            <button
              type="button"
              onClick={() => setSpecialTerms((prev) => [...prev, ""])}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm điều khoản riêng</span>
            </button>
          </div>

          {specialTerms.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">
              Chưa có điều khoản riêng bổ sung cho phòng này.
            </p>
          ) : (
            <div className="space-y-1.5">
              {specialTerms.map((term, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="mt-2 text-[11px] font-bold text-slate-400 w-4 text-right shrink-0">
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
                    placeholder="Nhập thỏa thuận riêng của phòng..."
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSpecialTerms((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="mt-1 p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Xóa điều khoản"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Banner showing edit status and guidance
  const renderPreviewBanner = () => (
    <>
      {isEditable && (
        <div className="flex items-center justify-between p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 text-xs mb-4 shadow-xs animate-fade-in max-w-[760px] mx-auto">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Chế độ Chỉnh sửa trực tiếp đang BẬT</p>
              <p className="text-[11px] text-amber-800">
                Click chuột vào bất kỳ chỗ nào trên trang hợp đồng bên dưới để sửa đổi hoặc gõ thêm nội dung. Xong bấm <strong>Lưu hợp đồng</strong> hoặc <strong>In PDF</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleEditable}
            className="text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1.5 rounded-lg shrink-0 ml-3 transition-colors"
          >
            Khóa lại
          </button>
        </div>
      )}

      {!isEditable && editedHtml !== null && (
        <div className="flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs mb-4 max-w-[760px] mx-auto">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Đang hiển thị <strong>bản chỉnh sửa trực tiếp</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetToForm}
            className="text-[11px] font-bold text-indigo-700 hover:underline shrink-0 ml-2"
          >
            Khôi phục từ form
          </button>
        </div>
      )}

      {!isEditable && editedHtml === null && (
        <div className="flex items-center gap-2 p-2 bg-amber-50/90 border border-amber-200/90 rounded-xl text-amber-900 text-xs mb-4 max-w-[760px] mx-auto">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Bản xem trước trực tiếp tương ứng 100% với file PDF và bản in thực tế. Chỉnh sửa bên trái sẽ cập nhật ngay tại đây.
          </span>
        </div>
      )}
    </>
  );

  // Reusable 3-Page Contract Document Component
  const renderContractDocument = () => {
    if (editedHtml !== null) {
      return (
        <div
          ref={contractRef}
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={() => {
            if (contractRef.current) {
              setEditedHtml(contractRef.current.innerHTML);
            }
          }}
          dangerouslySetInnerHTML={{ __html: editedHtml }}
          className={`space-y-6 transition-all ${
            isEditable
              ? "ring-4 ring-amber-400/60 rounded-2xl cursor-text select-text p-1 bg-amber-50/10"
              : ""
          }`}
        />
      );
    }

    const activeSpecialTerms = specialTerms.map((s) => s.trim()).filter(Boolean);

    return (
      <div
        ref={contractRef}
        contentEditable={isEditable}
        suppressContentEditableWarning
        onBlur={() => {
          if (isEditable && contractRef.current) {
            setEditedHtml(contractRef.current.innerHTML);
          }
        }}
        className={`space-y-6 transition-all ${
          isEditable
            ? "ring-4 ring-amber-400/60 rounded-2xl cursor-text select-text p-1 bg-amber-50/10"
            : ""
        }`}
      >
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
              {interpolateContractText(contractTitle, interpolationVars)}
            </p>
          </div>

          {/* Legal grounds */}
          <div className="space-y-1 text-justify mb-4 italic text-[12.5pt]">
            {templateConfig.legalBasis.map((line, idx) => (
              <p key={idx}>
                {interpolateContractText(line, interpolationVars)}
              </p>
            ))}
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
              {enableStagedPricing && rentStages.length > 0 ? (
                <>
                  <p>
                    - Giá thuê: áp dụng theo lộ trình giai đoạn thỏa thuận như sau (giá thuê không bao gồm tiền điện, tiền nước và các khoản chi phí khác phát sinh do bên thuê sử dụng):
                  </p>
                  <div className="pl-4 space-y-1">
                    {rentStages.map((stg, sIdx) => (
                      <p key={sIdx}>
                        + <strong>{stg.label}</strong>
                        {stg.months ? ` (${stg.months} tháng)` : ""}:{" "}
                        <strong>{formatVND(stg.price)} VNĐ/tháng</strong>
                        {stg.note ? ` (${stg.note})` : ""}.
                      </p>
                    ))}
                  </div>
                </>
              ) : (
                <p>
                  - Giá thuê: <strong>{formatVND(monthlyPrice)} VNĐ/tháng</strong>, giá thuê không bao gồm tiền điện, tiền nước và các khoản chi phí khác phát sinh do bên thuê sử dụng.
                </p>
              )}
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
              {templateConfig.maintenanceTerms.map((term, idx) => (
                <p key={idx}>
                  - {interpolateContractText(term, interpolationVars)}
                </p>
              ))}
              <p>
                - Hình thức thanh toán: Tiền mặt hoặc chuyển khoản vào thông tin sau:
              </p>
              {paymentConfig?.split ? (
                <div className="bank-box my-2 p-2.5 border border-black rounded text-[11.5pt] space-y-1">
                  <p>
                    • <strong>Tiền phòng:</strong> STK <strong>{bankAccount || "...................."}</strong> - Ngân hàng <strong>{bankName || "...................."}</strong> (Chủ TK: <strong>{bankOwner || "...................."}</strong>)
                  </p>
                  <p>
                    • <strong>Tiền điện, nước, dịch vụ:</strong> STK <strong>{serviceAccount || "...................."}</strong> - Ngân hàng <strong>{serviceBank || "...................."}</strong> (Chủ TK: <strong>{serviceOwner || "...................."}</strong>)
                  </p>
                </div>
              ) : (
                <div className="bank-box my-2 p-2.5 border border-black rounded">
                  <p>Họ và Tên: <strong>{bankOwner || "...................................."}</strong></p>
                  <p>Số tài khoản: <strong>{bankAccount || "...................................."}</strong> tại Ngân hàng <strong>{bankName || "...................................."}</strong></p>
                </div>
              )}
              <p>
                - {interpolateContractText(templateConfig.latePaymentRule, interpolationVars)}
              </p>

              {/* Furniture Items */}
              <p className="font-semibold pt-1">- Nội thất trang bị sẵn:</p>
              <div className="pl-4 space-y-1">
                {furnitureItems.length > 0 ? (
                  furnitureItems.map((item, idx) => (
                    <p key={idx}>
                      {idx + 1}.{" "}
                      {item.includes(":")
                        ? interpolateContractText(item, interpolationVars)
                        : `${item}: 01 cái, hoạt động bình thường.`}
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
              {templateConfig.partyAObligations.map((item, idx) => (
                <p key={idx}>
                  - {interpolateContractText(item, interpolationVars)}
                </p>
              ))}

              <p className="font-bold pt-1">2.2. Bên B có quyền và nghĩa vụ:</p>
              {templateConfig.partyBObligations.map((item, idx) => (
                <p key={idx}>
                  - {interpolateContractText(item, interpolationVars)}
                </p>
              ))}
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
              {templateConfig.houseRules.map((rule, idx) => (
                <p key={idx}>
                  - {interpolateContractText(rule, interpolationVars)}
                </p>
              ))}
            </div>
          </div>

          {/* Điều 4: Chấm dứt hợp đồng */}
          <div className="space-y-1 mb-3 text-justify">
            <p className="font-bold">Điều 4: Chấm dứt hợp đồng</p>
            <div className="pl-3 space-y-0.5">
              {templateConfig.terminationTerms.map((term, idx) => (
                <p key={idx}>
                  - {interpolateContractText(term, interpolationVars)}
                </p>
              ))}
            </div>
          </div>

          {/* Điều 5: Điều khoản chung */}
          <div className="space-y-1 mb-4 text-justify">
            <p className="font-bold">Điều 5: Điều khoản chung</p>
            <div className="pl-3 space-y-0.5">
              {templateConfig.generalTerms.map((term, idx) => (
                <p key={idx}>
                  - {interpolateContractText(term, interpolationVars)}
                </p>
              ))}
            </div>
          </div>

          {/* Điều khoản / Thỏa thuận bổ sung riêng cho Phòng (nếu có) */}
          {activeSpecialTerms.length > 0 && (
            <div className="space-y-1 mb-4 text-justify">
              <p className="font-bold">
                Điều khoản bổ sung riêng cho Phòng {room.code}:
              </p>
              <div className="pl-3 space-y-0.5">
                {activeSpecialTerms.map((term, idx) => (
                  <p key={idx}>
                    - {interpolateContractText(term, interpolationVars)}
                  </p>
                ))}
              </div>
            </div>
          )}

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
  };

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
            {saveMsg && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-xl animate-fade-in">
                {saveMsg}
              </span>
            )}

            {/* Shortcut to Global Contract Template Designer */}
            <Link
              href="/settings?tab=contract"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              title="Thiết kế Mẫu Hợp Đồng gốc chung cho toàn nhà trọ"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">⚙️ Thiết kế Template gốc</span>
              <span className="sm:hidden">Template</span>
            </Link>

            {/* Saved Contracts History Dropdown */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className={`text-xs font-bold gap-1.5 h-9 bg-white ${
                  editingContractId ? "border-indigo-400 text-indigo-700" : ""
                }`}
                title="Xem danh sách hợp đồng đã lưu của phòng này"
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span>Lịch sử ({savedContracts.length})</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showHistory ? "rotate-180" : ""}`} />
              </Button>

              {showHistory && (
                <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2.5 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1 mb-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Hợp đồng đã lưu ({savedContracts.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowHistory(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  {savedContracts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Chưa có hợp đồng nào được lưu cho phòng này
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {savedContracts.map((c) => {
                        const isCurrent = editingContractId === c.id;
                        return (
                          <div
                            key={c.id}
                            className={`p-2 rounded-xl flex items-center justify-between gap-2 text-xs transition-colors ${
                              isCurrent
                                ? "bg-indigo-50 border border-indigo-200"
                                : "hover:bg-slate-50 border border-transparent"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleLoadContract(c)}
                              className="text-left flex-1 min-w-0"
                            >
                              <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                                <span className="truncate">{c.tenant_name || "Khách thuê"}</span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold shrink-0">
                                    Đang mở
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(c.updated_at || c.created_at).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContract(c.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                              title="Xoá hợp đồng này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ContentEditable Toggle */}
            <Button
              type="button"
              variant={isEditable ? "primary" : "outline"}
              onClick={handleToggleEditable}
              className={`text-xs font-bold gap-1.5 h-9 ${
                isEditable
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  : "text-amber-800 border-amber-300 hover:bg-amber-50"
              }`}
              title="Click trực tiếp vào trang hợp đồng để chỉnh sửa từng chữ tùy ý"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>{isEditable ? "Khóa chỉnh sửa" : "Chỉnh trực tiếp"}</span>
            </Button>

            {/* Reset to Form if inline edited */}
            {editedHtml !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResetToForm}
                className="text-xs font-bold gap-1 h-9 text-slate-600 hover:text-slate-800"
                title="Khôi phục lại nội dung chuẩn từ form cấu hình"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khôi phục gốc</span>
              </Button>
            )}

            {/* Save Contract Button */}
            <Button
              type="button"
              onClick={handleSaveContract}
              disabled={isSaving}
              className="text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              title="Lưu bản hợp đồng này vào hệ thống để dùng lại"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Đang lưu..." : editingContractId ? "Cập nhật HĐ" : "Lưu hợp đồng"}</span>
            </Button>

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
                  <span>Sao chép</span>
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
                placeholder="Nhà trọ Anh Thư"
              />
            </div>
          </div>
        </div>

        {/* Content Area - Responsive Desktop Layout */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {/* Always keep contractRef rendered in DOM so print and copy always work */}
          {viewMode === "config" && (
            <div className="hidden" aria-hidden="true">
              {renderContractDocument()}
            </div>
          )}

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
                {renderPreviewBanner()}
                {renderContractDocument()}
              </div>
            </div>
          )}

          {/* Mode 2: Full Preview Only */}
          {viewMode === "preview" && (
            <div className="h-full overflow-y-auto p-4 bg-slate-200/90 border border-slate-300 rounded-2xl">
              {renderPreviewBanner()}
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

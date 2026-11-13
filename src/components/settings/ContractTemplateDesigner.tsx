"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  UserCheck,
  Sliders,
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  DEFAULT_CONTRACT_TEMPLATE,
  CONTRACT_TEMPLATE_VARIABLES,
  normalizeContractTemplate,
  type ContractTemplateConfig,
} from "@/lib/contracts/template";
import {
  getContractTemplate,
  saveContractTemplate,
} from "@/actions/contracts";

interface ClauseSectionProps {
  title: string;
  subtitle?: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

function ClauseListEditor({
  title,
  subtitle,
  items,
  onChange,
  placeholder = "Nhập nội dung điều khoản...",
}: ClauseSectionProps) {
  const handleItemChange = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const handleAddItem = () => {
    onChange([...items, ""]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-800">{title}</h4>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm dòng</span>
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="mt-2 text-[11px] font-bold text-slate-400 w-5 text-right shrink-0">
              {idx + 1}.
            </span>
            <textarea
              rows={2}
              value={item}
              onChange={(e) => handleItemChange(idx, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 leading-relaxed resize-y"
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(idx)}
              title="Xóa dòng này"
              aria-label={`Xóa dòng ${idx + 1}`}
              className="mt-1.5 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContractTemplateDesigner() {
  const [template, setTemplate] = useState<ContractTemplateConfig>({
    ...DEFAULT_CONTRACT_TEMPLATE,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    const res = await getContractTemplate();
    if (res.template) {
      setTemplate(res.template);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const updateField = <K extends keyof ContractTemplateConfig>(
    key: K,
    value: ContractTemplateConfig[K]
  ) => {
    setTemplate((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCopyVariable = async (varKey: string) => {
    try {
      await navigator.clipboard.writeText(varKey);
      setCopiedVar(varKey);
      setTimeout(() => setCopiedVar(null), 2200);
    } catch {
      setCopiedVar(varKey);
      setTimeout(() => setCopiedVar(null), 2200);
    }
  };

  const handleResetDefault = () => {
    if (
      !window.confirm(
        "Khôi phục toàn bộ nội dung Mẫu Hợp Đồng về bản chuẩn gốc của hệ thống?"
      )
    ) {
      return;
    }
    setTemplate(normalizeContractTemplate(DEFAULT_CONTRACT_TEMPLATE));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const res = await saveContractTemplate(template);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "contract_party_a",
          JSON.stringify({
            name: template.partyAName,
            cccd: template.partyACccd,
            cccdDate: template.partyACccdDate,
            cccdPlace: template.partyACccdPlace,
            address: template.partyAAddress,
            phone: template.partyAPhone,
            innName: template.innName,
          })
        );
      } catch {}
    }

    setSaving(false);

    if (res.success) {
      setTemplate(res.template);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);
    } else {
      setErrorMsg(res.error || "Không thể lưu mẫu hợp đồng");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Đang tải cấu hình Mẫu Hợp Đồng...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>
            Đã lưu Mẫu Hợp Đồng chung thành công! Mọi hợp đồng tạo mới cho các
            phòng sẽ tự động áp dụng mẫu này.
          </span>
        </div>
      )}

      {/* Top Grid: Part 1 (Party A) & Part 2 (Default Contract Params) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Part 1: Party A & Header Info */}
        <Card className="lg:col-span-7 p-4 bg-white border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Thông tin Bên cho thuê mặc định (Bên A) & Tiêu đề
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tự động điền sẵn khi tạo hợp đồng cho bất kỳ phòng nào
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên nhà trọ hiển thị trên HĐ
              </label>
              <Input
                value={template.innName}
                onChange={(e) => updateField("innName", e.target.value)}
                placeholder="Nhà trọ Anh Thư"
                required
                className="text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiêu đề hợp đồng
              </label>
              <Input
                value={template.contractTitle}
                onChange={(e) => updateField("contractTitle", e.target.value)}
                placeholder="HỢP ĐỒNG CHO THUÊ PHÒNG TRỌ"
                required
                className="text-xs font-bold uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên Đại diện Bên A (Chủ trọ)
              </label>
              <Input
                value={template.partyAName}
                onChange={(e) => updateField("partyAName", e.target.value)}
                placeholder="Bùi Thanh Tùng"
                required
                className="text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại Bên A
              </label>
              <Input
                value={template.partyAPhone}
                onChange={(e) => updateField("partyAPhone", e.target.value)}
                placeholder="0901 001 079"
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số CCCD Bên A
              </label>
              <Input
                value={template.partyACccd}
                onChange={(e) => updateField("partyACccd", e.target.value)}
                placeholder="086089000009"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày cấp CCCD
              </label>
              <Input
                value={template.partyACccdDate}
                onChange={(e) => updateField("partyACccdDate", e.target.value)}
                placeholder="13/08/2021"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nơi cấp CCCD
              </label>
              <Input
                value={template.partyACccdPlace}
                onChange={(e) => updateField("partyACccdPlace", e.target.value)}
                placeholder="Cục Cảnh sát QLHC về TTXH"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ thường trú Bên A
            </label>
            <Input
              value={template.partyAAddress}
              onChange={(e) => updateField("partyAAddress", e.target.value)}
              placeholder="Địa chỉ thường trú của chủ trọ..."
              className="text-xs"
            />
          </div>
        </Card>

        {/* Part 2: Default Contract Parameters */}
        <Card className="lg:col-span-5 p-4 bg-white border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Thông số Hợp đồng mặc định chung
              </h3>
              <p className="text-[11px] text-slate-500">
                Áp dụng chung nếu phòng chưa có cấu hình riêng
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diện tích phòng mặc định
              </label>
              <Input
                value={template.defaultRoomArea}
                onChange={(e) =>
                  updateField("defaultRoomArea", e.target.value)
                }
                placeholder="32m2"
                className="text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thời hạn thuê mặc định (tháng)
              </label>
              <Input
                type="number"
                min={1}
                value={template.defaultLeaseMonths}
                onChange={(e) =>
                  updateField(
                    "defaultLeaseMonths",
                    Math.max(1, Number(e.target.value) || 12)
                  )
                }
                className="text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hạn thanh toán hàng tháng
              </label>
              <Input
                value={template.paymentDueDay}
                onChange={(e) => updateField("paymentDueDay", e.target.value)}
                placeholder="ngày 05 hàng tháng"
                className="text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Độ cao khung ký tên (px)
              </label>
              <Input
                type="number"
                min={50}
                max={220}
                value={template.defaultSignatureHeight}
                onChange={(e) =>
                  updateField(
                    "defaultSignatureHeight",
                    Math.min(220, Math.max(50, Number(e.target.value) || 120))
                  )
                }
                className="text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-slate-600 space-y-1 leading-relaxed">
            <div className="font-bold text-indigo-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Cơ chế kế thừa thông minh 3 tầng</span>
            </div>
            <p>
              <strong>Tầng 1:</strong> Mẫu Hợp Đồng chung tại đây ➔{" "}
              <strong>Tầng 2:</strong> Cấu hình riêng của từng Phòng (Diện tích,
              Nội thất, Điều khoản riêng) ➔ <strong>Tầng 3:</strong> Chỉnh sửa
              trực tiếp khi xuất hợp đồng cho khách.
            </p>
          </div>
        </Card>
      </div>

      {/* Part 3: Contract Clauses & Dynamic Variables */}
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Thiết kế Nội dung các Điều khoản Hợp đồng
              </h3>
              <p className="text-[11px] text-slate-500">
                Tùy chỉnh các điều khoản pháp lý, nội quy nhà trọ và chèn biến tự động
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Variables Bar */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-slate-50 to-emerald-50/60 border border-indigo-100 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Biến tự động (Bấm để sao chép rồi dán vào điều khoản bất kỳ):</span>
            </span>
            {copiedVar && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Đã chép {copiedVar}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CONTRACT_TEMPLATE_VARIABLES.map((v) => {
              const isCopied = copiedVar === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => handleCopyVariable(v.key)}
                  title={`Ví dụ: ${v.example}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                    isCopied
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                  }`}
                >
                  <code className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1 rounded text-[10px]">
                    {v.key}
                  </code>
                  <span>{v.label}</span>
                  <Copy className="w-3 h-3 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Clauses Editors */}
        <div className="space-y-4">
          <ClauseListEditor
            title="Căn cứ pháp lý mở đầu"
            subtitle="Các dòng căn cứ in nghiêng ngay dưới tiêu đề hợp đồng"
            items={template.legalBasis}
            onChange={(next) => updateField("legalBasis", next)}
          />

          <ClauseListEditor
            title="Điều 1 — Quy định bảo trì máy lạnh & xử lý sự cố"
            subtitle="Quy định trách nhiệm vệ sinh máy lạnh, nghẹt cống, sửa chữa..."
            items={template.maintenanceTerms}
            onChange={(next) => updateField("maintenanceTerms", next)}
          />

          {/* Late Payment Rule */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                Điều 1 — Quy định hạn thanh toán & xử lý trễ hạn
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Có thể dùng biến{" "}
                <code className="font-mono font-bold text-indigo-700">
                  {"{{NGAY_THANH_TOAN}}"}
                </code>{" "}
                để tự động điền hạn thanh toán
              </p>
            </div>
            <textarea
              rows={3}
              value={template.latePaymentRule}
              onChange={(e) => updateField("latePaymentRule", e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 leading-relaxed resize-y"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ClauseListEditor
              title="Điều 2.1 — Quyền và nghĩa vụ của Bên A (Chủ trọ)"
              items={template.partyAObligations}
              onChange={(next) => updateField("partyAObligations", next)}
            />

            <ClauseListEditor
              title="Điều 2.2 — Quyền và nghĩa vụ của Bên B (Khách thuê)"
              items={template.partyBObligations}
              onChange={(next) => updateField("partyBObligations", next)}
            />
          </div>

          <ClauseListEditor
            title="Điều 3 — Nội quy thuê phòng chung"
            subtitle="Các quy định về giờ giấc, an ninh trật tự, vệ sinh, phòng cháy chữa cháy..."
            items={template.houseRules}
            onChange={(next) => updateField("houseRules", next)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ClauseListEditor
              title="Điều 4 — Chấm dứt hợp đồng & Hoàn cọc"
              items={template.terminationTerms}
              onChange={(next) => updateField("terminationTerms", next)}
            />

            <ClauseListEditor
              title="Điều 5 — Điều khoản chung"
              items={template.generalTerms}
              onChange={(next) => updateField("generalTerms", next)}
            />
          </div>
        </div>
      </Card>

      {/* Bottom Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
        <Button
          type="button"
          variant="outline"
          onClick={handleResetDefault}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Khôi phục mẫu chuẩn
        </Button>

        <Button
          type="submit"
          variant="primary"
          isLoading={saving}
          loadingText="Đang lưu mẫu hợp đồng..."
          leftIcon={<Save className="w-4 h-4" />}
        >
          Lưu Mẫu Hợp Đồng
        </Button>
      </div>
    </form>
  );
}

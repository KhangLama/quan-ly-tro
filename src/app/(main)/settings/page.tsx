"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Settings, Info, Sliders, FileText } from "lucide-react";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { ContractTemplateDesigner } from "@/components/settings/ContractTemplateDesigner";
import { Card } from "@/components/ui/Card";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab =
    searchParams.get("tab") === "contract" ? "contract" : "general";
  const [activeTab, setActiveTab] = useState<"general" | "contract">(
    initialTab
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "contract") {
      setActiveTab("contract");
    } else if (tabParam === "general") {
      setActiveTab("general");
    }
  }, [searchParams]);

  const handleSelectTab = (tab: "general" | "contract") => {
    setActiveTab(tab);
    const url = tab === "contract" ? "/settings?tab=contract" : "/settings";
    router.replace(url, { scroll: false });
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>Cài đặt hệ thống</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình đơn giá điện nước, tài khoản VietQR, bảo mật và thiết kế mẫu hợp đồng thuê trọ
          </p>
        </div>
      </div>

      {/* Accessible Single-Row Tab Bar */}
      <div
        role="tablist"
        aria-label="Phân mục cài đặt hệ thống"
        className="flex overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs gap-1.5"
      >
        <button
          type="button"
          role="tab"
          id="settings-tab-general"
          aria-selected={activeTab === "general"}
          onClick={() => handleSelectTab("general")}
          className={`flex-none inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === "general"
              ? "bg-indigo-50/90 text-indigo-700 border-b-2 border-indigo-600 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b-2 border-transparent"
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>Cài đặt chung & Bảo mật</span>
        </button>

        <button
          type="button"
          role="tab"
          id="settings-tab-contract"
          aria-selected={activeTab === "contract"}
          onClick={() => handleSelectTab("contract")}
          className={`flex-none inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === "contract"
              ? "bg-indigo-50/90 text-indigo-700 border-b-2 border-indigo-600 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b-2 border-transparent"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Mẫu Hợp đồng (Template)</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div
        role="tabpanel"
        aria-labelledby="settings-tab-general"
        hidden={activeTab !== "general"}
      >
        {activeTab === "general" && (
          <div className="space-y-4">
            <SettingsForm />
            <ChangePasswordCard />
          </div>
        )}
      </div>

      <div
        role="tabpanel"
        aria-labelledby="settings-tab-contract"
        hidden={activeTab !== "contract"}
      >
        {activeTab === "contract" && (
          <div className="space-y-4">
            <ContractTemplateDesigner />
          </div>
        )}
      </div>

      {/* System info card */}
      <Card className="p-4 bg-slate-50 border-slate-200/80 text-xs text-slate-500 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Info className="w-3.5 h-3.5 text-indigo-600" />
          <span>Thông tin ứng dụng</span>
        </div>
        <p>Phiên bản: 1.0.0 (Next.js 14 App Router, Supabase, Tailwind CSS)</p>
        <p>
          Bảo mật: Xác thực một mật khẩu quản trị viên qua Web Crypto HMAC
          session.
        </p>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải trang cài đặt...
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Settings, Info } from "lucide-react";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
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

      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>Cài đặt hệ thống</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Cấu hình đơn giá điện nước mặc định và thông tin chuyển khoản
        </p>
      </div>

      <SettingsForm />

      {/* System info card */}
      <Card className="p-4 bg-slate-50 border-slate-200/80 text-xs text-slate-500 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Info className="w-3.5 h-3.5 text-indigo-600" />
          <span>Thông tin ứng dụng</span>
        </div>
        <p>Phiên bản: 1.0.0 (Next.js 14 App Router, Supabase, Tailwind CSS)</p>
        <p>Bảo mật: Xác thực một mật khẩu quản trị viên qua Web Crypto HMAC session.</p>
      </Card>
    </div>
  );
}

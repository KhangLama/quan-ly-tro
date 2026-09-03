"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Zap } from "lucide-react";
import { InvoiceCalculator } from "@/components/invoices/InvoiceCalculator";

function InvoiceContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId") || undefined;
  const month = searchParams.get("month") || undefined;

  return <InvoiceCalculator initialRoomId={roomId} initialMonth={month} />;
}

export default function NewInvoicePage() {
  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-200">
      {/* Top Header */}
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
          <Zap className="w-5 h-5 text-amber-500" />
          <span>Chốt điện nước & Tính tiền</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tự động lấy số cũ từ tháng trước, tính tiền realtime và xuất tin nhắn Zalo
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải biểu mẫu...</div>}>
        <InvoiceContent />
      </Suspense>
    </div>
  );
}

"use client";

import React from "react";
import { DollarSign, CheckCircle2, AlertCircle, Home } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatVND } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface RevenueSummaryProps {
  stats: DashboardStats;
}

export function RevenueSummary({ stats }: RevenueSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {/* 1. Tổng dự thu */}
      <Card className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 border-indigo-100/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
            Tổng dự thu
          </span>
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-600">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="mt-2 text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {formatVND(stats.totalRevenue)}
          <span className="text-xs font-medium text-slate-500 ml-0.5">đ</span>
        </p>
        <p className="text-[11px] text-indigo-600/80 mt-0.5">
          Toàn bộ hóa đơn
        </p>
      </Card>

      {/* 2. Đã thu */}
      <Card className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 border-emerald-100/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Đã thu
          </span>
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="mt-2 text-lg sm:text-xl font-bold text-emerald-700 tracking-tight">
          {formatVND(stats.collectedAmount)}
          <span className="text-xs font-medium text-emerald-600/80 ml-0.5">đ</span>
        </p>
        <p className="text-[11px] text-emerald-600/80 mt-0.5">
          Tiền đã thanh toán
        </p>
      </Card>

      {/* 3. Chưa thu */}
      <Card className="p-3.5 bg-gradient-to-br from-amber-50/70 to-amber-100/40 border-amber-100/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Chưa thu
          </span>
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-600">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="mt-2 text-lg sm:text-xl font-bold text-amber-700 tracking-tight">
          {formatVND(stats.pendingAmount)}
          <span className="text-xs font-medium text-amber-600/80 ml-0.5">đ</span>
        </p>
        <p className="text-[11px] text-amber-600/80 mt-0.5">
          Cần theo dõi thu
        </p>
      </Card>

      {/* 4. Tỷ lệ lấp đầy */}
      <Card className="p-3.5 bg-gradient-to-br from-sky-50/70 to-sky-100/40 border-sky-100/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">
            Lấp đầy
          </span>
          <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-600">
            <Home className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="mt-2 text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {stats.occupancyRate}%
        </p>
        <p className="text-[11px] text-sky-600 mt-0.5">
          {stats.rentedRooms}/{stats.totalRooms} phòng có khách
        </p>
      </Card>
    </div>
  );
}

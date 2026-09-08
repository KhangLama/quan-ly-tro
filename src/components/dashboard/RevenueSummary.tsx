"use client";

import React from "react";
import Link from "next/link";
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Home,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowRight,
  Wallet,
  PieChart,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatVND } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface RevenueSummaryProps {
  stats: DashboardStats;
}

export function RevenueSummary({ stats }: RevenueSummaryProps) {
  const totalRevenue = stats.totalRevenue || 0;
  const totalExpenses = stats.totalExpenses || 0;
  const netProfit = stats.netProfit !== undefined ? stats.netProfit : totalRevenue - totalExpenses;
  const collectedAmount = stats.collectedAmount || 0;
  const paidExpenses = stats.paidExpenses || 0;
  const actualCashflow = stats.actualCashflow !== undefined ? stats.actualCashflow : collectedAmount - paidExpenses;

  // Expense to Revenue percentage
  const expenseRatio = totalRevenue > 0 ? Math.min(100, Math.round((totalExpenses / totalRevenue) * 100)) : 0;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* 4 Compact KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* 1. Tổng dự thu */}
        <Card className="p-3.5 sm:p-4 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 border-indigo-100/90 shadow-xs hover:-translate-y-1 hover:shadow-float hover:border-indigo-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
              Tổng dự thu
            </span>
            <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-600 shadow-2xs">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {formatVND(stats.totalRevenue)}
            <span className="text-xs font-semibold text-slate-500 ml-0.5">đ</span>
          </p>
          <p className="text-[11px] text-indigo-600/80 font-medium mt-0.5">
            Toàn bộ hóa đơn
          </p>
        </Card>

        {/* 2. Đã thu */}
        <Card className="p-3.5 sm:p-4 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border-emerald-100/90 shadow-xs hover:-translate-y-1 hover:shadow-float hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Đã thu
            </span>
            <div className="p-2 bg-emerald-600/10 rounded-xl text-emerald-600 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-emerald-700 tracking-tight">
            {formatVND(stats.collectedAmount)}
            <span className="text-xs font-semibold text-emerald-600/80 ml-0.5">đ</span>
          </p>
          <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">
            Tiền đã thanh toán
          </p>
        </Card>

        {/* 3. Chưa thu */}
        <Card className="p-3.5 sm:p-4 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-amber-100/90 shadow-xs hover:-translate-y-1 hover:shadow-float hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Chưa thu
            </span>
            <div className="p-2 bg-amber-600/10 rounded-xl text-amber-600 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-amber-700 tracking-tight">
            {formatVND(stats.pendingAmount)}
            <span className="text-xs font-semibold text-amber-600/80 ml-0.5">đ</span>
          </p>
          <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">
            Cần theo dõi thu
          </p>
        </Card>

        {/* 4. Tỷ lệ lấp đầy */}
        <Card className="p-3.5 sm:p-4 bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30 border-sky-100/90 shadow-xs hover:-translate-y-1 hover:shadow-float hover:border-sky-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
              Lấp đầy
            </span>
            <div className="p-2 bg-sky-600/10 rounded-xl text-sky-600 shadow-2xs">
              <Home className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {stats.occupancyRate}%
          </p>
          <p className="text-[11px] text-sky-600 font-medium mt-0.5">
            {stats.rentedRooms}/{stats.totalRooms} phòng có khách
          </p>
        </Card>
      </div>

      {/* NEW WIDGET: DOANH THU & CHI PHÍ & LỢI NHUẬN RÒNG THÁNG */}
      <Card className="p-4 bg-white/95 backdrop-blur-md border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-2xs">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Dòng tiền & Lợi nhuận tháng
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Tháng {stats.currentMonth}
              </p>
            </div>
          </div>

          <Link
            href="/expenses"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 group hover:underline"
          >
            <span>Sổ chi phí</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 3 Main Highlights: Thu - Chi - Lợi nhuận */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          {/* 1. Tổng Thu */}
          <div className="bg-gradient-to-b from-emerald-50/80 to-emerald-100/30 border border-emerald-100/90 p-2.5 sm:p-3 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Tổng Thu</span>
            </div>
            <div className="text-xs sm:text-base font-black text-emerald-700 mt-1">
              +{formatVND(totalRevenue)}đ
            </div>
            <div className="text-[10px] text-emerald-600/90 mt-0.5 font-medium">
              Đã thu: {formatVND(collectedAmount)}đ
            </div>
          </div>

          {/* 2. Tổng Chi */}
          <div className="bg-gradient-to-b from-rose-50/80 to-rose-100/30 border border-rose-100/90 p-2.5 sm:p-3 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800">
              <TrendingDown className="w-3 h-3 text-rose-600" />
              <span>Tổng Chi</span>
            </div>
            <div className="text-xs sm:text-base font-black text-rose-700 mt-1">
              -{formatVND(totalExpenses)}đ
            </div>
            <div className="text-[10px] text-rose-600/90 mt-0.5 font-medium">
              Đã chi: {formatVND(paidExpenses)}đ
            </div>
          </div>

          {/* 3. Lợi Nhuận Ròng */}
          <div className="bg-gradient-to-b from-indigo-50/90 to-indigo-100/40 border border-indigo-100/90 p-2.5 sm:p-3 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-800">
              <Wallet className="w-3 h-3 text-indigo-600" />
              <span>Lợi Nhuận</span>
            </div>
            <div className={`text-xs sm:text-base font-black mt-1 ${netProfit >= 0 ? "text-indigo-700" : "text-rose-600"}`}>
              {netProfit >= 0 ? "+" : ""}{formatVND(netProfit)}đ
            </div>
            <div className="text-[10px] text-indigo-600/90 mt-0.5 font-semibold">
              Tỷ suất: {profitMargin}%
            </div>
          </div>
        </div>

        {/* Visual Progress Bar: Chi phí / Doanh thu */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Tỷ trọng chi phí / Doanh thu</span>
            <span className="font-extrabold text-slate-800">{expenseRatio}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - expenseRatio)}%` }}
              title="Lợi nhuận"
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${expenseRatio}%` }}
              title="Chi phí"
            />
          </div>
        </div>

        {/* Actual Cashflow footer note */}
        <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Dòng tiền thực nhận hiện tại (Đã thu - Đã chi):
          </span>
          <strong className={`font-black tracking-tight ${actualCashflow >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {actualCashflow >= 0 ? "+" : ""}{formatVND(actualCashflow)} đ
          </strong>
        </div>
      </Card>
    </div>
  );
}

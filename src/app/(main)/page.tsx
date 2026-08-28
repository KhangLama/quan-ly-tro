"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Zap, Building2, RefreshCw } from "lucide-react";
import { RevenueSummary } from "@/components/dashboard/RevenueSummary";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { RoomStatusGrid } from "@/components/dashboard/RoomStatusGrid";
import { Button } from "@/components/ui/Button";
import { getDashboardData, type DashboardDataResult } from "@/actions/dashboard";

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );
  const [data, setData] = useState<DashboardDataResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (month: string) => {
    setLoading(true);
    const res = await getDashboardData(month);
    setData(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth, loadData]);

  return (
    <div className="space-y-4 pb-4 animate-in fade-in duration-200">
      {/* Error alert if any */}
      {data?.error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
          Lỗi tải dữ liệu: {data.error}
        </div>
      )}

      {/* Top Banner & Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Tổng quan thu chi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi dòng tiền và tình trạng phòng
          </p>
        </div>

        <Link href="/invoices/new">
          <Button size="sm" className="gap-1.5 shadow-sm">
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Chốt điện nước</span>
          </Button>
        </Link>
      </div>

      {/* Month Selector */}
      <MonthSelector
        currentMonth={selectedMonth}
        onMonthChange={(m) => setSelectedMonth(m)}
      />

      {/* Financial KPIs */}
      {data && <RevenueSummary stats={data.stats} />}

      {/* Room Status Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Danh sách phòng ({data?.rooms.length || 0})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => loadData(selectedMonth)}
            disabled={loading}
            className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {loading && !data ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Đang tải dữ liệu...
          </div>
        ) : (
          <RoomStatusGrid
            rooms={data?.rooms || []}
            selectedMonth={selectedMonth}
          />
        )}
      </div>
    </div>
  );
}

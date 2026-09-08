"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { User, ChevronRight, Search, CheckCircle2, AlertCircle, Home, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatVND, compareRoomCodes } from "@/lib/utils";
import type { DashboardRoomCard } from "@/actions/dashboard";

interface RoomStatusGridProps {
  rooms: DashboardRoomCard[];
  selectedMonth: string;
}

type FilterStatus = "all" | "pending" | "paid" | "empty";

export function RoomStatusGrid({ rooms, selectedMonth }: RoomStatusGridProps) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const sortedRooms = useMemo(() => {
    return [...rooms].sort(compareRoomCodes);
  }, [rooms]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let empty = 0;
    sortedRooms.forEach((r) => {
      if (r.billingBadgeLabel === "Chưa thu") pending++;
      else if (r.billingBadgeLabel === "Đã thu") paid++;
      else if (r.billingBadgeLabel === "Trống") empty++;
    });
    return { all: sortedRooms.length, pending, paid, empty };
  }, [sortedRooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    let list = sortedRooms;

    if (filter === "pending") {
      list = list.filter((r) => r.billingBadgeLabel === "Chưa thu");
    } else if (filter === "paid") {
      list = list.filter((r) => r.billingBadgeLabel === "Đã thu");
    } else if (filter === "empty") {
      list = list.filter((r) => r.billingBadgeLabel === "Trống");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          (r.leadTenantName && r.leadTenantName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [sortedRooms, filter, searchQuery]);

  if (sortedRooms.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-200 p-8 text-center shadow-xs">
        <p className="text-sm text-slate-500 font-medium">Chưa có phòng nào trong hệ thống</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
              filter === "all"
                ? "bg-slate-900 text-white shadow-xs -translate-y-0.5"
                : "bg-white/80 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
            }`}
          >
            Tất cả ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === "pending"
                ? "bg-amber-500 text-white shadow-xs -translate-y-0.5"
                : "bg-amber-50/70 hover:bg-amber-100/70 text-amber-800 border border-amber-200/80"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Chưa thu ({counts.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("paid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === "paid"
                ? "bg-emerald-600 text-white shadow-xs -translate-y-0.5"
                : "bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200/80"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã thu ({counts.paid})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("empty")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filter === "empty"
                ? "bg-slate-600 text-white shadow-xs -translate-y-0.5"
                : "bg-white/80 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
            }`}
          >
            <Home className="w-3 h-3" />
            <span>Trống ({counts.empty})</span>
          </button>
        </div>

        {/* Quick Search */}
        {sortedRooms.length > 4 && (
          <div className="relative sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm phòng, tên khách..."
              className="w-full h-8.5 pl-8 pr-3 text-xs bg-white/90 rounded-xl border border-slate-200/90 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        )}
      </div>

      {/* Grid of Rooms */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-200 p-8 text-center shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Không tìm thấy phòng phù hợp với bộ lọc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredRooms.map((room) => {
            const isPaid = room.billingBadgeLabel === "Đã thu";
            const isPending = room.billingBadgeLabel === "Chưa thu";
            const isEmpty = room.billingBadgeLabel === "Trống";

            let badgeVariant: "success" | "warning" | "secondary" = "secondary";
            if (isPaid) badgeVariant = "success";
            else if (isPending) badgeVariant = "warning";

            return (
              <Link key={room.id} href={`/rooms/${room.id}`} className="block group select-none">
                <Card
                  hoverable
                  className={`p-4 transition-all duration-300 relative border ${
                    isPending
                      ? "hover:border-amber-300/90 bg-gradient-to-b from-white via-white to-amber-50/20"
                      : isPaid
                      ? "hover:border-emerald-300/90 bg-gradient-to-b from-white via-white to-emerald-50/20"
                      : "hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          Phòng {room.code}
                        </span>
                        <Badge variant={badgeVariant} size="sm">
                          {room.billingBadgeLabel}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-600 mt-1">
                        {formatVND(room.base_price)}đ
                        <span className="text-[11px] font-normal text-slate-400">/tháng</span>
                      </p>
                    </div>

                    <div className="p-1 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Tenant info or empty indicator */}
                  <div className="mt-3 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs text-slate-500">
                    {!isEmpty && room.leadTenantName ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {room.leadTenantName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700 truncate">
                          {room.leadTenantName}
                        </span>
                        {room.activeTenantsCount > 1 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full shrink-0 font-bold">
                            +{room.activeTenantsCount - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Phòng trống</span>
                    )}

                    {room.invoice && (
                      <span className="text-slate-700 font-bold text-xs shrink-0 ml-2">
                        {formatVND(room.invoice.total_amount)}đ
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

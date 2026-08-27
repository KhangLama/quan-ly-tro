"use client";

import React from "react";
import Link from "next/link";
import { User, Phone, ChevronRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatVND } from "@/lib/utils";
import type { DashboardRoomCard } from "@/actions/dashboard";

interface RoomStatusGridProps {
  rooms: DashboardRoomCard[];
  selectedMonth: string;
}

export function RoomStatusGrid({ rooms, selectedMonth }: RoomStatusGridProps) {
  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-500 font-medium">Chưa có phòng nào trong hệ thống</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {rooms.map((room) => {
        const isPaid = room.billingBadgeLabel === "Đã thu";
        const isPending = room.billingBadgeLabel === "Chưa thu";
        const isEmpty = room.billingBadgeLabel === "Trống";

        let badgeVariant: "success" | "warning" | "secondary" = "secondary";
        if (isPaid) badgeVariant = "success";
        else if (isPending) badgeVariant = "warning";

        return (
          <Link key={room.id} href={`/rooms/${room.id}`} className="block group">
            <Card
              hoverable
              className="p-4 transition-all duration-150 group-hover:border-indigo-200 group-hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Phòng {room.code}
                    </span>
                    <Badge variant={badgeVariant} size="sm">
                      {room.billingBadgeLabel}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    {formatVND(room.base_price)}đ/tháng
                  </p>
                </div>

                <div className="p-1 text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* Tenant info or empty indicator */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                {!isEmpty && room.leadTenantName ? (
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">
                      {room.leadTenantName}
                    </span>
                    {room.activeTenantsCount > 1 && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full shrink-0 font-medium">
                        +{room.activeTenantsCount - 1}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Phòng trống</span>
                )}

                {room.invoice && (
                  <span className="text-slate-600 font-medium shrink-0 ml-2">
                    {formatVND(room.invoice.total_amount)}đ
                  </span>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

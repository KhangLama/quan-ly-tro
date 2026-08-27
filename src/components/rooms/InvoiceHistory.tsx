"use client";

import React from "react";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatVND } from "@/lib/utils";
import type { Invoice } from "@/types";

interface InvoiceHistoryProps {
  invoices: Invoice[];
  roomCode: string;
}

export function InvoiceHistory({ invoices, roomCode }: InvoiceHistoryProps) {
  if (invoices.length === 0) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
        Chưa có hóa đơn nào được tạo cho phòng {roomCode}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => {
        const isPaid = inv.status === "paid";
        return (
          <Card key={inv.id} className="p-3.5 bg-white border-slate-200/80 shadow-xs text-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">
                    Hóa đơn {inv.month}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Điện: {inv.old_electric} → {inv.new_electric} ({inv.new_electric - inv.old_electric} số) | Nước: {inv.old_water} → {inv.new_water} ({inv.new_water - inv.old_water} m³)
                  </div>
                </div>
              </div>

              <div className="text-right">
                <Badge variant={isPaid ? "success" : "warning"} size="sm">
                  {isPaid ? "Đã thu" : "Chưa thu"}
                </Badge>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatVND(inv.total_amount)}đ
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

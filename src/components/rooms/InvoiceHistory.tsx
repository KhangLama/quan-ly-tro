"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Download, Sparkles, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReceiptModal, type ReceiptData } from "@/components/invoices/ReceiptModal";
import { formatVND } from "@/lib/utils";
import type { Invoice } from "@/types";

interface InvoiceHistoryProps {
  invoices: Invoice[];
  roomCode: string;
}

export function InvoiceHistory({ invoices, roomCode }: InvoiceHistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  if (invoices.length === 0) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
        Chưa có hóa đơn nào được tạo cho phòng {roomCode}
      </div>
    );
  }

  const handleOpenReceipt = (inv: Invoice) => {
    const electricUsage = Math.max(0, Number(inv.new_electric) - Number(inv.old_electric));
    const waterUsage = Math.max(0, Number(inv.new_water) - Number(inv.old_water));
    const electricCost = Math.round(electricUsage * Number(inv.electric_price));
    const waterCost = Math.round(waterUsage * Number(inv.water_price));

    setSelectedReceipt({
      roomCode,
      month: inv.month,
      address: "325B Kv. Phú Mỹ, Thường Thạnh, Cái Răng, Cần Thơ",
      oldElectric: Number(inv.old_electric),
      newElectric: Number(inv.new_electric),
      electricPrice: Number(inv.electric_price),
      electricCost,
      electricUsage,
      oldWater: Number(inv.old_water),
      newWater: Number(inv.new_water),
      waterPrice: Number(inv.water_price),
      waterCost,
      waterUsage,
      basePrice: Number(inv.base_price),
      servicePrice: Number(inv.service_price),
      totalAmount: Number(inv.total_amount),
    });
  };

  return (
    <>
      <div className="space-y-2">
        {invoices.map((inv) => {
          const isPaid = inv.status === "paid";
          return (
            <Card key={inv.id} className="p-3.5 bg-white border-slate-200/80 shadow-xs text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900">
                      Hóa đơn {inv.month}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Điện: {inv.old_electric} → {inv.new_electric} ({inv.new_electric - inv.old_electric} số) | Nước: {inv.old_water} → {inv.new_water} ({inv.new_water - inv.old_water} m³)
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Badge variant={isPaid ? "success" : "warning"} size="sm">
                    {isPaid ? "Đã thu" : "Chưa thu"}
                  </Badge>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatVND(inv.total_amount)}đ
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenReceipt(inv)}
                  className="gap-1.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 py-1 h-auto"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Xem & Tải ảnh biên lai</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        data={selectedReceipt}
      />
    </>
  );
}

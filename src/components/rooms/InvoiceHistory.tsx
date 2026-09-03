"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Download, Sparkles, Image as ImageIcon, Trash2, Edit2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReceiptModal, type ReceiptData } from "@/components/invoices/ReceiptModal";
import { deleteInvoice } from "@/actions/invoices";
import { formatVND } from "@/lib/utils";
import type { Invoice } from "@/types";

interface InvoiceHistoryProps {
  invoices: Invoice[];
  roomCode: string;
  customerName?: string;
  customerPhone?: string;
  onRefresh?: () => void;
}

export function InvoiceHistory({
  invoices,
  roomCode,
  customerName,
  customerPhone,
  onRefresh,
}: InvoiceHistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (invoices.length === 0) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
        Chưa có hóa đơn nào được tạo cho phòng {roomCode}
      </div>
    );
  }

  const handleDelete = async (inv: Invoice) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa vĩnh viễn hóa đơn tháng ${inv.month} của phòng ${roomCode}?`
    );
    if (!confirmed) return;

    setDeletingId(inv.id);
    const res = await deleteInvoice(inv.id);
    setDeletingId(null);

    if (res.success) {
      onRefresh?.();
    } else {
      alert(res.error || "Không thể xóa hóa đơn");
    }
  };

  const handleOpenReceipt = (inv: Invoice) => {
    const electricUsage = Math.max(0, Number(inv.new_electric) - Number(inv.old_electric));
    const waterUsage = Math.max(0, Number(inv.new_water) - Number(inv.old_water));
    const electricCost = Math.round(electricUsage * Number(inv.electric_price));
    const waterCost = Math.round(waterUsage * Number(inv.water_price));
    const basePrice = Number(inv.base_price) || 0;
    const servicePrice = Number(inv.service_price) || 0;
    const totalAmount = Number(inv.total_amount) || 0;

    const subtotal = basePrice + electricCost + waterCost + servicePrice;
    const rawDiscount = (inv as any).discount;
    const discount =
      rawDiscount !== undefined && rawDiscount !== null
        ? Number(rawDiscount)
        : Math.max(0, subtotal - totalAmount);

    let discountReason = (inv as any).discount_reason;
    if (!discountReason && typeof window !== "undefined") {
      try {
        discountReason = localStorage.getItem(`inv_reason_${inv.room_id}_${inv.month}`);
      } catch {}
    }
    if (!discountReason && discount > 0) {
      discountReason = "Event giảm giá tháng";
    }

    let receiptNote = (inv as any).note || (inv as any).receipt_note;
    if (!receiptNote && typeof window !== "undefined") {
      try {
        receiptNote = localStorage.getItem(`inv_note_${inv.room_id}_${inv.month}`);
      } catch {}
    }

    setSelectedReceipt({
      roomCode,
      month: inv.month,
      customerName,
      customerPhone,
      receiptNote: receiptNote || undefined,
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
      basePrice,
      servicePrice,
      discount,
      discountReason,
      totalAmount,
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
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(inv)}
                  disabled={deletingId === inv.id}
                  className="gap-1 text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50 py-1 h-7"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingId === inv.id ? "Đang xóa..." : "Xóa"}</span>
                </Button>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/invoices/new?roomId=${inv.room_id}&month=${inv.month}`}
                    className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-2.5 py-1 rounded-xl font-bold transition-colors h-7 whitespace-nowrap shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenReceipt(inv)}
                    className="gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 py-1 h-7 whitespace-nowrap"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Xem biên lai</span>
                  </Button>
                </div>
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

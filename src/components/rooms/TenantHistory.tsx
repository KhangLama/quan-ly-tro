"use client";

import React, { useState } from "react";
import { History, ChevronDown, ChevronUp, UserCheck, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatVND } from "@/lib/utils";
import type { Tenant } from "@/types";

interface TenantHistoryProps {
  tenants: Tenant[];
}

export function TenantHistory({ tenants }: TenantHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (tenants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-slate-800 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          <History className="w-4 h-4 text-slate-500" />
          <span>Lịch sử khách đã chuyển đi ({tenants.length})</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-2 pt-1 animate-in fade-in duration-200">
          {tenants.map((t) => (
            <Card key={t.id} className="p-3 bg-slate-50 border-slate-200 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-slate-800">{t.name}</span>
                  {t.phone && <p className="text-slate-500">{t.phone}</p>}
                  {t.cccd && <p className="text-slate-400 font-mono text-[11px]">CCCD: {t.cccd}</p>}
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <div>Ở: {t.start_date}</div>
                  <div>Rời: {t.end_date || "—"}</div>
                </div>
              </div>
              {t.deposit_amount > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 text-slate-600 flex justify-between">
                  <span>Tiền cọc lúc vào:</span>
                  <span className="font-semibold">{formatVND(t.deposit_amount)}đ</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Phone, Shield, Calendar, DollarSign, LogOut, User, Check, Edit2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatVND } from "@/lib/utils";
import { markTenantMovedOut } from "@/actions/tenants";
import { EditTenantModal } from "./EditTenantModal";
import type { Tenant } from "@/types";

interface TenantCardProps {
  tenant: Tenant;
  onRefresh: () => void;
}

export function TenantCard({ tenant, onRefresh }: TenantCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    const res = await markTenantMovedOut(tenant.id, endDate);
    setLoading(false);
    if (res.success) {
      setShowCheckoutModal(false);
      onRefresh();
    }
  };

  const [copiedCCCD, setCopiedCCCD] = useState(false);

  const handleCopyCCCD = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tenant.cccd) return;
    navigator.clipboard.writeText(tenant.cccd);
    setCopiedCCCD(true);
    setTimeout(() => setCopiedCCCD(false), 2000);
  };

  return (
    <>
      <Card className="p-4 bg-white/95 backdrop-blur-xs border-slate-200/80 shadow-xs hover:-translate-y-0.5 hover:shadow-float hover:border-indigo-200/80 transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Avatar Pill with Initial */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-indigo-500/20 shrink-0">
              {tenant.name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-black text-slate-900 tracking-tight">{tenant.name}</span>
                {tenant.is_lead && (
                  <Badge variant="info" size="sm">
                    Người đại diện
                  </Badge>
                )}
              </div>
              {tenant.cccd && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-mono">
                    CCCD: {tenant.cccd}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCCCD}
                    title="Sao chép CCCD"
                    className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    {copiedCCCD ? "Đã chép!" : "Chép"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-xs px-2.5 py-1.5 h-auto whitespace-nowrap shrink-0 gap-1 font-bold"
            >
              <Edit2 className="w-3.5 h-3.5 shrink-0" />
              <span>Sửa</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCheckoutModal(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-xs px-2.5 py-1.5 h-auto whitespace-nowrap shrink-0 gap-1 font-bold"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Trả phòng</span>
            </Button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100/90 grid grid-cols-2 gap-2 text-xs">
          {tenant.phone ? (
            <a
              href={`tel:${tenant.phone}`}
              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold truncate"
            >
              <Phone className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
              <span>{tenant.phone}</span>
            </a>
          ) : (
            <div className="text-slate-400 italic text-[11px]">Chưa có SĐT</div>
          )}

          <div className="flex items-center gap-1.5 text-slate-500 justify-end">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Từ: {tenant.start_date}</span>
          </div>

          {tenant.deposit_amount > 0 && (
            <div className="col-span-2 flex items-center justify-between text-slate-700 bg-slate-50/90 p-2.5 rounded-xl mt-1 border border-slate-100">
              <span className="flex items-center gap-1.5 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Tiền cọc phòng:
              </span>
              <strong className="text-emerald-700 font-black">{formatVND(tenant.deposit_amount)}đ</strong>
            </div>
          )}
        </div>
      </Card>

      {/* Checkout confirmation modal */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title="Xác nhận trả phòng"
        description={`Đánh dấu khách thuê ${tenant.name} chuyển đi`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Khách thuê sẽ được chuyển vào mục <strong>Lịch sử khách đã chuyển đi</strong>. Nếu phòng không còn ai ở, trạng thái phòng sẽ tự động chuyển thành <strong>Trống</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày trả phòng
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckoutModal(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleCheckout}
              isLoading={loading}
              className="gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Xác nhận chuyển đi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit tenant modal */}
      <EditTenantModal
        tenant={tenant}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onRefresh();
        }}
      />
    </>
  );
}

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

  return (
    <>
      <Card className="p-4 bg-white border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900">{tenant.name}</span>
              {tenant.is_lead && (
                <Badge variant="info" size="sm">
                  Đại diện
                </Badge>
              )}
            </div>
            {tenant.cccd && (
              <p className="text-xs text-slate-500 font-mono">
                CCCD: {tenant.cccd}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-xs px-2.5 py-1 h-auto"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Sửa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCheckoutModal(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-xs px-2.5 py-1 h-auto"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Trả phòng
            </Button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          {tenant.phone ? (
            <a
              href={`tel:${tenant.phone}`}
              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold truncate"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>{tenant.phone}</span>
            </a>
          ) : (
            <div className="text-slate-400 italic">Chưa có SĐT</div>
          )}

          <div className="flex items-center gap-1.5 text-slate-600 justify-end">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Ở từ: {tenant.start_date}</span>
          </div>

          {tenant.deposit_amount > 0 && (
            <div className="col-span-2 flex items-center gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-xl mt-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Tiền cọc: <strong className="text-slate-800">{formatVND(tenant.deposit_amount)}đ</strong>
              </span>
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

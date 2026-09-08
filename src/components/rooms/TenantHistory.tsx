"use client";

import React, { useState } from "react";
import { History, ChevronDown, ChevronUp, Edit2, Trash2, AlertTriangle, Check, BookmarkCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatVND } from "@/lib/utils";
import { deleteTenant, updateTenant } from "@/actions/tenants";
import { EditTenantModal } from "./EditTenantModal";
import type { Tenant } from "@/types";

interface TenantHistoryProps {
  tenants: Tenant[];
  onRefresh?: () => void;
}

export function TenantHistory({ tenants, onRefresh }: TenantHistoryProps) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (tenants.length === 0) {
    return null;
  }

  const handleToggleDepositOnly = async (t: Tenant) => {
    const nextVal = !t.deposit_only;
    try {
      const res = await updateTenant(t.id, { deposit_only: nextVal });
      if (res.success) {
        showToast(
          nextVal
            ? `Đã đánh dấu ${t.name} chỉ đặt cọc (không tính vào người ở trên Tổng quan)`
            : `Đã bỏ đánh dấu chỉ cọc cho ${t.name}`,
          "success"
        );
        if (onRefresh) onRefresh();
      } else {
        showToast(res.error || "Lỗi khi cập nhật", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi cập nhật", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTenant) return;
    setIsDeleting(true);
    try {
      const res = await deleteTenant(deletingTenant.id);
      if (res.success) {
        showToast(`Đã xóa khách ${deletingTenant.name} khỏi lịch sử chuyển đi`, "success");
        setDeletingTenant(null);
        if (onRefresh) onRefresh();
      } else {
        showToast(res.error || "Lỗi khi xóa khách thuê", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi xóa khách thuê", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
              <Card key={t.id} className="p-3.5 bg-slate-50/80 border-slate-200 text-xs">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{t.name}</span>
                      {t.deposit_only && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <BookmarkCheck className="w-3 h-3 text-amber-600" />
                          <span>Chỉ cọc, không ở</span>
                        </span>
                      )}
                    </div>
                    {t.phone && <p className="text-slate-600 font-medium">{t.phone}</p>}
                    {t.cccd && (
                      <p className="text-slate-400 font-mono text-[11px]">CCCD: {t.cccd}</p>
                    )}
                  </div>

                  {/* Actions: Toggle deposit_only, Edit, Delete */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleDepositOnly(t)}
                      className={`text-xs px-2.5 py-1 h-7 whitespace-nowrap shrink-0 gap-1 font-semibold ${
                        t.deposit_only
                          ? "text-slate-600 border-slate-200 hover:bg-slate-100"
                          : "text-amber-700 border-amber-200 bg-amber-50/60 hover:bg-amber-100 hover:border-amber-300"
                      }`}
                      title={t.deposit_only ? "Bỏ đánh dấu cọc không ở" : "Đánh dấu khách này chỉ đặt cọc, không vào ở"}
                    >
                      <BookmarkCheck className="w-3 h-3 shrink-0" />
                      <span>{t.deposit_only ? "Bỏ chỉ cọc" : "Chỉ cọc không ở"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTenant(t)}
                      className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-xs px-2.5 py-1 h-7 whitespace-nowrap shrink-0 gap-1 font-semibold"
                    >
                      <Edit2 className="w-3 h-3 shrink-0" />
                      <span>Sửa</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingTenant(t)}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-xs px-2.5 py-1 h-7 whitespace-nowrap shrink-0 gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3 shrink-0" />
                      <span>Xóa</span>
                    </Button>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>Ở từ: <strong className="text-slate-700">{t.start_date}</strong></span>
                    <span>Rời: <strong className="text-slate-700">{t.end_date || "—"}</strong></span>
                  </div>

                  {t.deposit_amount > 0 && (
                    <div className="text-right">
                      <span>Cọc: </span>
                      <strong className="text-slate-800 font-semibold">{formatVND(t.deposit_amount)}đ</strong>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Moved-out Tenant Modal */}
      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          isOpen={true}
          onClose={() => setEditingTenant(null)}
          onSuccess={() => {
            setEditingTenant(null);
            showToast("Đã cập nhật thông tin khách thuê", "success");
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingTenant)}
        onClose={() => setDeletingTenant(null)}
        title={
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Xóa khách khỏi lịch sử</span>
          </div>
        }
        description="Thao tác này sẽ xóa vĩnh viễn dữ liệu khách thuê khỏi lịch sử chuyển đi."
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <p>
              Bạn có chắc chắn muốn xóa hồ sơ khách{" "}
              <strong>{deletingTenant?.name}</strong>?
            </p>
            <p className="text-[11px] text-rose-600">
              * Dữ liệu hóa đơn cũ đã xuất trước đây (nếu có) sẽ không bị ảnh hưởng.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingTenant(null)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Xác nhận xóa</span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

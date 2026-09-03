"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  UserPlus,
  Zap,
  Building2,
  Users,
  History,
  FileText,
  Trash2,
  Phone,
  DollarSign,
  Armchair,
  Check,
  Edit2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TenantCard } from "@/components/rooms/TenantCard";
import { TenantHistory } from "@/components/rooms/TenantHistory";
import { InvoiceHistory } from "@/components/rooms/InvoiceHistory";
import { AddTenantModal } from "@/components/rooms/AddTenantModal";
import { EditRoomModal } from "@/components/rooms/EditRoomModal";
import { getRoomById, deleteRoom, type GetRoomDetailsResult } from "@/actions/rooms";
import { formatVND } from "@/lib/utils";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [data, setData] = useState<GetRoomDetailsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    const res = await getRoomById(roomId);
    setData(res);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    if (roomId) {
      fetchDetails();
    }
  }, [roomId, fetchDetails]);

  const handleDeleteRoom = async () => {
    if (!data?.room) return;
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa Phòng ${data.room.code}? Thao tác này sẽ xóa toàn bộ khách thuê và hóa đơn liên quan.`
    );
    if (confirmDelete) {
      const res = await deleteRoom(roomId);
      if (res.success) {
        router.push("/rooms");
      } else {
        alert(res.error || "Không thể xóa phòng");
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Đang tải thông tin phòng...
      </div>
    );
  }

  if (!data?.room) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-slate-600 font-semibold">
          {data?.error || "Không tìm thấy phòng"}
        </p>
        <Link href="/rooms">
          <Button variant="outline" size="sm">
            ← Quay lại danh sách phòng
          </Button>
        </Link>
      </div>
    );
  }

  const { room, activeTenants, movedOutTenants, leadTenant, invoices } = data;
  const isRented = room.status === "rented";

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-200">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Danh sách phòng</span>
        </Link>

        <Link href={`/invoices/new?roomId=${room.id}`}>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 whitespace-nowrap">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Chốt điện nước</span>
          </Button>
        </Link>
      </div>

      {/* Room Header Card */}
      <Card className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-md border-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">
                Phòng {room.code}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isRented
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-700 text-slate-300 border border-slate-600"
                }`}
              >
                {isRented ? "Đang thuê" : "Phòng trống"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Giá thuê cơ bản: <strong className="text-white text-sm">{formatVND(room.base_price)}đ</strong>/tháng
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditRoomModalOpen(true)}
              title="Sửa phòng"
              aria-label="Sửa thông tin phòng"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Edit2 className="w-4 h-4 text-sky-300" />
              <span className="hidden sm:inline">Sửa phòng</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteRoom}
              title="Xóa phòng"
              aria-label="Xóa phòng"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Furniture / Amenities Card */}
      {(() => {
        let furnitureList: string[] = (room as any)?.furniture || [];
        if ((!furnitureList || furnitureList.length === 0) && typeof window !== "undefined") {
          try {
            const cached = localStorage.getItem("room_furniture_" + room.id);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed)) furnitureList = parsed;
            }
          } catch {}
        }

        return (
          <Card className="p-3.5 bg-white border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Armchair className="w-4 h-4 text-indigo-600" />
                <span>Nội thất & Tiện ích trong phòng ({furnitureList.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditRoomModalOpen(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Sửa nội thất</span>
              </button>
            </div>

            {furnitureList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {furnitureList.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50/80 text-indigo-800 border border-indigo-100"
                  >
                    <Check className="w-3 h-3 text-indigo-600 stroke-[2.5]" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-1 flex items-center justify-between">
                <span>Chưa thiết lập danh sách nội thất cho phòng này.</span>
                <button
                  type="button"
                  onClick={() => setIsEditRoomModalOpen(true)}
                  className="text-indigo-600 font-semibold hover:underline not-italic ml-2"
                >
                  + Thêm nội thất ngay
                </button>
              </div>
            )}
          </Card>
        );
      })()}

      {/* Desktop 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tenants & History */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Tenants Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Khách đang ở ({activeTenants.length})
                </h2>
              </div>

              <Button
                size="sm"
                onClick={() => setIsAddTenantModalOpen(true)}
                className="gap-1 text-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm khách / Ở ghép</span>
              </Button>
            </div>

            {activeTenants.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-xs text-slate-500">Phòng hiện chưa có khách thuê</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddTenantModalOpen(true)}
                  className="mt-2.5 gap-1.5 text-xs text-indigo-600"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Thêm khách nhận phòng
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeTenants.map((tenant) => (
                  <TenantCard
                    key={tenant.id}
                    tenant={tenant}
                    onRefresh={fetchDetails}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Moved Out Tenant History */}
          <TenantHistory tenants={movedOutTenants} />
        </div>

        {/* Right Column: Invoices History */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Lịch sử hóa đơn ({invoices.length})
              </h2>
            </div>

            <InvoiceHistory
              invoices={invoices}
              roomCode={room.code}
              customerName={leadTenant?.name || undefined}
              customerPhone={leadTenant?.phone || undefined}
              onRefresh={fetchDetails}
            />
          </div>
        </div>
      </div>

      {/* Add Tenant Modal */}
      <AddTenantModal
        roomId={room.id}
        roomCode={room.code}
        isOpen={isAddTenantModalOpen}
        onClose={() => setIsAddTenantModalOpen(false)}
        onSuccess={fetchDetails}
      />

      {/* Edit Room Modal */}
      <EditRoomModal
        room={room}
        isOpen={isEditRoomModalOpen}
        onClose={() => setIsEditRoomModalOpen(false)}
        onSuccess={fetchDetails}
      />
    </div>
  );
}

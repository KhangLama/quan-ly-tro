"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Building2, Plus, User, ChevronRight, Phone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AddRoomModal } from "@/components/rooms/AddRoomModal";
import { getRooms } from "@/actions/rooms";
import { formatVND } from "@/lib/utils";
import type { RoomWithDetails } from "@/types";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const res = await getRooms();
    setRooms(res.rooms || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchRooms();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchRooms]);

  const rentedCount = rooms.filter((r) => r.status === "rented").length;
  const emptyCount = rooms.filter((r) => r.status === "empty").length;

  return (
    <div className="space-y-4 pb-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Quản lý phòng trọ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {rentedCount} đang thuê • {emptyCount} phòng trống
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm phòng</span>
        </Button>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải danh sách phòng...
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500">Chưa có phòng nào</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-3 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm phòng đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rooms.map((room) => {
            const isRented = room.status === "rented";
            return (
              <Link key={room.id} href={`/rooms/${room.id}`} className="block group">
                <Card hoverable className="p-4 transition-all duration-150 group-hover:border-indigo-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          Phòng {room.code}
                        </span>
                        <Badge variant={isRented ? "success" : "secondary"} size="sm">
                          {isRented ? "Đang thuê" : "Trống"}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-1">
                        {formatVND(room.base_price)}đ/tháng
                      </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    {isRented && room.leadTenant ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">
                          {room.leadTenant.name}
                        </span>
                        {room.activeTenants.length > 1 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">
                            +{room.activeTenants.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Chưa có người ở</span>
                    )}

                    <span className="text-indigo-600 font-medium text-[11px] group-hover:underline">
                      Xem chi tiết →
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchRooms}
      />
    </div>
  );
}

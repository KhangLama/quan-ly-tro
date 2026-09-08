"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Building2, Plus, User, ChevronRight, Search, Home, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AddRoomModal } from "@/components/rooms/AddRoomModal";
import { getRooms } from "@/actions/rooms";
import { formatVND, compareRoomCodes } from "@/lib/utils";
import type { RoomWithDetails } from "@/types";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "rented" | "empty">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const res = await getRooms();
    const list = (res.rooms || []).slice().sort(compareRoomCodes);
    setRooms(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const rentedCount = rooms.filter((r) => r.status === "rented").length;
  const emptyCount = rooms.filter((r) => r.status === "empty").length;

  const filteredRooms = useMemo(() => {
    let list = rooms;
    if (filter === "rented") list = list.filter((r) => r.status === "rented");
    if (filter === "empty") list = list.filter((r) => r.status === "empty");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          (r.leadTenant?.name && r.leadTenant.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [rooms, filter, searchQuery]);

  return (
    <div className="space-y-4 pb-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản lý phòng trọ
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              {rentedCount} đang thuê
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
              {emptyCount} phòng trống
            </span>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm phòng mới</span>
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              filter === "all"
                ? "bg-slate-900 text-white shadow-xs -translate-y-0.5"
                : "bg-white/80 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
            }`}
          >
            Tất cả ({rooms.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("rented")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              filter === "rented"
                ? "bg-emerald-600 text-white shadow-xs -translate-y-0.5"
                : "bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200/80"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Đang thuê ({rentedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("empty")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              filter === "empty"
                ? "bg-slate-600 text-white shadow-xs -translate-y-0.5"
                : "bg-white/80 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
            }`}
          >
            <Home className="w-3 h-3" />
            <span>Phòng trống ({emptyCount})</span>
          </button>
        </div>

        {rooms.length > 3 && (
          <div className="relative sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã phòng, người ở..."
              className="w-full h-8.5 pl-8 pr-3 text-xs bg-white/90 rounded-xl border border-slate-200/90 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        )}
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Đang tải danh sách phòng...
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-200 p-8 text-center shadow-xs">
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
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-200 p-8 text-center shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Không tìm thấy phòng phù hợp với tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredRooms.map((room) => {
            const isRented = room.status === "rented";
            return (
              <Link key={room.id} href={`/rooms/${room.id}`} className="block group select-none">
                <Card
                  hoverable
                  className={`p-4 transition-all duration-300 relative border ${
                    isRented
                      ? "hover:border-emerald-300/90 bg-gradient-to-b from-white via-white to-emerald-50/20"
                      : "hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          Phòng {room.code}
                        </span>
                        <Badge variant={isRented ? "success" : "secondary"} size="sm">
                          {isRented ? "Đang thuê" : "Trống"}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-600 mt-1">
                        {formatVND(room.base_price)}đ
                        <span className="text-[11px] font-normal text-slate-400">/tháng</span>
                      </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100/90 flex items-center justify-between text-xs text-slate-500">
                    {isRented && room.leadTenant ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {room.leadTenant.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700 truncate">
                          {room.leadTenant.name}
                        </span>
                        {room.activeTenants.length > 1 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                            +{room.activeTenants.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Chưa có người ở</span>
                    )}

                    <span className="text-indigo-600 font-bold text-[11px] group-hover:underline">
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

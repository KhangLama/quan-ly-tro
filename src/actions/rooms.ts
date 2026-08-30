"use server";

async function safeRevalidatePath(path: string) {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(path);
  } catch {}
}

import { createClient } from "../lib/supabase/server.ts";
import type { Room, RoomInsert, RoomUpdate, RoomWithDetails, Tenant, Invoice } from "../types/index.ts";
import { compareRoomCodes } from "../lib/utils.ts";

export interface GetRoomDetailsResult {
  room: Room | null;
  activeTenants: Tenant[];
  movedOutTenants: Tenant[];
  leadTenant: Tenant | null;
  invoices: Invoice[];
  error?: string;
}

/**
 * Fetch all rooms with their active tenant counts and lead tenant info
 */
export async function getRooms(): Promise<{ rooms: RoomWithDetails[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Fetch rooms and active tenants in parallel
    const [{ data: rooms, error: roomsError }, { data: tenants }] = await Promise.all([
      supabase.from("rooms").select("*").order("code", { ascending: true }),
      supabase.from("tenants").select("*").eq("status", "active").order("created_at", { ascending: true }),
    ]);

    if (roomsError) {
      return { rooms: [], error: roomsError.message };
    }

    const allTenants: Tenant[] = tenants || [];

    const roomsWithDetails: RoomWithDetails[] = (rooms || []).map((room: Room) => {
      const roomTenants = allTenants.filter((t) => t.room_id === room.id);
      const lead = roomTenants.find((t) => t.is_lead) || roomTenants[0] || null;
      return {
        ...room,
        activeTenants: roomTenants,
        leadTenant: lead,
      };
    });

    roomsWithDetails.sort(compareRoomCodes);

    return { rooms: roomsWithDetails };
  } catch (err: any) {
    return { rooms: [], error: err.message || "Không thể tải danh sách phòng" };
  }
}

/**
 * Fetch a single room by ID with all active/moved-out tenants and invoices
 */
export async function getRoomById(id: string): Promise<GetRoomDetailsResult> {
  try {
    const supabase = await createClient();

    // Fetch room, tenants, and invoices in parallel
    const [
      { data: room, error: roomError },
      { data: tenants },
      { data: invoices },
    ] = await Promise.all([
      supabase.from("rooms").select("*").eq("id", id).single(),
      supabase.from("tenants").select("*").eq("room_id", id).order("created_at", { ascending: true }),
      supabase.from("invoices").select("*").eq("room_id", id).order("month", { ascending: false }),
    ]);

    if (roomError || !room) {
      return {
        room: null,
        activeTenants: [],
        movedOutTenants: [],
        leadTenant: null,
        invoices: [],
        error: roomError?.message || "Không tìm thấy phòng",
      };
    }

    const allTenants: Tenant[] = tenants || [];
    const activeTenants = allTenants.filter((t) => t.status === "active");
    const movedOutTenants = allTenants
      .filter((t) => t.status === "moved_out")
      .sort((a, b) => (b.end_date || "").localeCompare(a.end_date || ""));
    const leadTenant = activeTenants.find((t) => t.is_lead) || activeTenants[0] || null;

    return {
      room,
      activeTenants,
      movedOutTenants,
      leadTenant,
      invoices: invoices || [],
    };
  } catch (err: any) {
    return {
      room: null,
      activeTenants: [],
      movedOutTenants: [],
      leadTenant: null,
      invoices: [],
      error: err.message || "Lỗi khi tải chi tiết phòng",
    };
  }
}

/**
 * Create a new room
 */
export async function createRoom(data: { code: string; base_price: number }): Promise<{ room?: Room; error?: string }> {
  try {
    if (!data.code || !data.code.trim()) {
      return { error: "Vui lòng nhập mã phòng (e.g. P101)" };
    }
    if (data.base_price === undefined || data.base_price < 0) {
      return { error: "Giá phòng không hợp lệ" };
    }

    const supabase = await createClient();
    const { data: newRoom, error } = await supabase
      .from("rooms")
      .insert({
        code: data.code.trim(),
        base_price: Number(data.base_price),
        status: "empty",
      })
      .select()
      .single();

    if (error) {
      if (error.message && error.message.includes("unique constraint")) {
        return { error: "Mã phòng đã tồn tại, vui lòng chọn mã khác" };
      }
      return { error: error.message };
    }

    safeRevalidatePath("/");
    safeRevalidatePath("/rooms");
    return { room: newRoom };
  } catch (err: any) {
    return { error: err.message || "Lỗi khi tạo phòng" };
  }
}

/**
 * Update an existing room
 */
export async function updateRoom(id: string, data: Partial<RoomUpdate>): Promise<{ room?: Room; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("rooms")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    safeRevalidatePath("/");
    safeRevalidatePath("/rooms");
    safeRevalidatePath(`/rooms/${id}`);
    return { room: updated };
  } catch (err: any) {
    return { error: err.message || "Lỗi khi cập nhật phòng" };
  }
}

/**
 * Delete a room and cascade its tenants and invoices
 */
export async function deleteRoom(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("rooms").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/");
    safeRevalidatePath("/rooms");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi xóa phòng" };
  }
}

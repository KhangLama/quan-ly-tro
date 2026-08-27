async function revalidatePath(path: string) {
  try {
    const nextCache = await import("next/cache");
    if (nextCache && typeof nextCache.revalidatePath === "function") {
      nextCache.revalidatePath(path);
    }
  } catch {}
}

import { createClient } from "../lib/supabase/server.ts";
import { calculateInvoice } from "../lib/calculations/invoice.ts";
import type { Invoice, InvoiceInsert, Room, Setting } from "../types/index.ts";

export interface InvoiceFormDataResult {
  settings: Setting | null;
  rooms: Room[];
  selectedRoom: Room | null;
  leadTenant?: { id: string; name: string; phone?: string | null } | null;
  previousReading: {
    old_electric: number;
    old_water: number;
    hasPreviousInvoice: boolean;
    previousMonth?: string;
  };
  existingInvoice: Invoice | null;
  error?: string;
}

export interface SaveInvoiceResult {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

/**
 * Fetch settings, rooms, and previous readings for a given room and month
 */
export async function getInvoiceFormData(
  roomId?: string,
  targetMonth?: string
): Promise<InvoiceFormDataResult> {
  try {
    const month = targetMonth || new Date().toISOString().substring(0, 7);
    const supabase = await createClient();

    // 1. Fetch settings
    const { data: settingsData } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    // 2. Fetch all rooms
    const { data: roomsData } = await supabase
      .from("rooms")
      .select("*")
      .order("code", { ascending: true });

    const rooms: Room[] = roomsData || [];
    const selectedRoom = rooms.find((r) => r.id === roomId) || rooms[0] || null;

    if (!selectedRoom) {
      return {
        settings: settingsData,
        rooms: [],
        selectedRoom: null,
        previousReading: { old_electric: 0, old_water: 0, hasPreviousInvoice: false },
        existingInvoice: null,
      };
    }

    // 3. Fetch invoices for the selected room
    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*")
      .eq("room_id", selectedRoom.id)
      .order("month", { ascending: false });

    const roomInvoices: Invoice[] = invoicesData || [];

    // Check if an invoice already exists for the target month
    const existingInvoice = roomInvoices.find((inv) => inv.month === month) || null;

    // Find the latest invoice strictly prior to target month, or most recent invoice overall
    const priorInvoices = roomInvoices
      .filter((inv) => inv.month < month)
      .sort((a, b) => b.month.localeCompare(a.month));

    const latestPrior = priorInvoices[0] || (roomInvoices.length > 0 && existingInvoice ? null : roomInvoices[0]);

    const old_electric = latestPrior ? Number(latestPrior.new_electric) : 0;
    const old_water = latestPrior ? Number(latestPrior.new_water) : 0;

    // 4. Fetch lead tenant for this room
    const { data: tenantsData } = await supabase
      .from("tenants")
      .select("id, name, phone, is_lead")
      .eq("room_id", selectedRoom.id)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    const activeTenants = tenantsData || [];
    const leadTenant = activeTenants.find((t: any) => t.is_lead) || activeTenants[0] || null;

    return {
      settings: settingsData,
      rooms,
      selectedRoom,
      leadTenant: leadTenant ? { id: leadTenant.id, name: leadTenant.name, phone: leadTenant.phone } : null,
      previousReading: {
        old_electric,
        old_water,
        hasPreviousInvoice: !!latestPrior,
        previousMonth: latestPrior?.month,
      },
      existingInvoice,
    };
  } catch (err: any) {
    return {
      settings: null,
      rooms: [],
      selectedRoom: null,
      previousReading: { old_electric: 0, old_water: 0, hasPreviousInvoice: false },
      existingInvoice: null,
      error: err.message || "Lỗi khi tải dữ liệu lập hóa đơn",
    };
  }
}

/**
 * Save / Create / Update monthly invoice with calculated totals
 */
export async function saveInvoice(data: {
  room_id: string;
  month: string;
  old_electric: number;
  new_electric: number;
  old_water: number;
  new_water: number;
  base_price: number;
  electric_price: number;
  water_price: number;
  service_price: number;
  status?: "pending" | "paid";
}): Promise<SaveInvoiceResult> {
  try {
    if (!data.room_id || !data.month) {
      return { success: false, error: "Thiếu thông tin phòng hoặc tháng lập hóa đơn" };
    }

    const calculation = calculateInvoice({
      basePrice: Number(data.base_price) || 0,
      oldElectric: Number(data.old_electric) || 0,
      newElectric: Number(data.new_electric) || 0,
      oldWater: Number(data.old_water) || 0,
      newWater: Number(data.new_water) || 0,
      electricPrice: Number(data.electric_price) || 0,
      waterPrice: Number(data.water_price) || 0,
      servicePrice: Number(data.service_price) || 0,
    });

    const supabase = await createClient();

    // Check if invoice exists for this (room_id, month)
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("room_id", data.room_id)
      .eq("month", data.month)
      .maybeSingle();

    let savedInvoice: Invoice | null = null;
    const invoiceStatus = data.status || "pending";

    if (existing) {
      // Update existing
      const { data: updated, error } = await supabase
        .from("invoices")
        .update({
          old_electric: Number(data.old_electric) || 0,
          new_electric: Number(data.new_electric) || 0,
          old_water: Number(data.old_water) || 0,
          new_water: Number(data.new_water) || 0,
          base_price: calculation.basePrice,
          electric_price: Number(data.electric_price) || 0,
          water_price: Number(data.water_price) || 0,
          service_price: calculation.servicePrice,
          total_amount: calculation.totalAmount,
          status: invoiceStatus,
          paid_at: invoiceStatus === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      savedInvoice = updated;
    } else {
      // Insert new
      const { data: inserted, error } = await supabase
        .from("invoices")
        .insert({
          room_id: data.room_id,
          month: data.month,
          old_electric: Number(data.old_electric) || 0,
          new_electric: Number(data.new_electric) || 0,
          old_water: Number(data.old_water) || 0,
          new_water: Number(data.new_water) || 0,
          base_price: calculation.basePrice,
          electric_price: Number(data.electric_price) || 0,
          water_price: Number(data.water_price) || 0,
          service_price: calculation.servicePrice,
          total_amount: calculation.totalAmount,
          status: invoiceStatus,
          paid_at: invoiceStatus === "paid" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      savedInvoice = inserted;
    }

    revalidatePath("/");
    revalidatePath("/rooms");
    revalidatePath(`/rooms/${data.room_id}`);
    revalidatePath("/invoices/new");

    return { success: true, invoice: savedInvoice ?? undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi lưu hóa đơn" };
  }
}

/**
 * Toggle payment status between "pending" and "paid"
 */
export async function toggleInvoiceStatus(invoiceId: string): Promise<SaveInvoiceResult> {
  try {
    const supabase = await createClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      return { success: false, error: "Không tìm thấy hóa đơn" };
    }

    const nextStatus = invoice.status === "paid" ? "pending" : "paid";
    const paidAt = nextStatus === "paid" ? new Date().toISOString() : null;

    const { data: updated, error } = await supabase
      .from("invoices")
      .update({
        status: nextStatus,
        paid_at: paidAt,
      })
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/rooms");
    revalidatePath(`/rooms/${invoice.room_id}`);

    return { success: true, invoice: updated ?? undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi cập nhật trạng thái hóa đơn" };
  }
}

/**
 * Delete invoice
 */
export async function deleteInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
    if (error) return { success: false, error: error.message };

    revalidatePath("/");
    revalidatePath("/rooms");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi xóa hóa đơn" };
  }
}

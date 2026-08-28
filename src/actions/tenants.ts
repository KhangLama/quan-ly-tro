"use server";

async function safeRevalidatePath(path: string) {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(path);
  } catch {}
}

import { createClient } from "../lib/supabase/server.ts";
import type { Tenant, TenantInsert, TenantUpdate } from "../types/index.ts";

export interface TenantActionResult {
  success: boolean;
  tenant?: Tenant;
  error?: string;
}

/**
 * Add a new tenant or roommate to a room.
 * Auto-syncs room status to "rented".
 */
export async function addTenant(data: {
  room_id: string;
  name: string;
  phone?: string | null;
  cccd?: string | null;
  is_lead?: boolean;
  start_date?: string;
  deposit_amount?: number;
}): Promise<TenantActionResult> {
  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Vui lòng nhập họ và tên khách thuê" };
    }
    if (!data.room_id) {
      return { success: false, error: "Thiếu thông tin phòng" };
    }

    const supabase = await createClient();

    // Check if room has existing active tenants
    const { data: existingTenants } = await supabase
      .from("tenants")
      .select("id, is_lead")
      .eq("room_id", data.room_id)
      .eq("status", "active");

    const hasActiveTenants = existingTenants && existingTenants.length > 0;
    const isFirstTenant = !hasActiveTenants;

    // Determine is_lead: if explicitly true or if this is the first resident in the room
    const isLead = data.is_lead !== undefined ? Boolean(data.is_lead) : isFirstTenant;

    // If new tenant is lead, unset is_lead on existing tenants
    if (isLead && hasActiveTenants) {
      for (const t of existingTenants) {
        if (t.is_lead) {
          await supabase
            .from("tenants")
            .update({ is_lead: false })
            .eq("id", t.id);
        }
      }
    }

    const startDate = data.start_date || new Date().toISOString().split("T")[0];
    const deposit = data.deposit_amount !== undefined ? Number(data.deposit_amount) : 0;

    const { data: newTenant, error: insertError } = await supabase
      .from("tenants")
      .insert({
        room_id: data.room_id,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        cccd: data.cccd?.trim() || null,
        is_lead: isLead,
        start_date: startDate,
        end_date: null,
        deposit_amount: deposit,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Auto-sync room status to "rented"
    await supabase
      .from("rooms")
      .update({ status: "rented" })
      .eq("id", data.room_id);

    safeRevalidatePath("/");
    safeRevalidatePath("/rooms");
    safeRevalidatePath(`/rooms/${data.room_id}`);

    return { success: true, tenant: newTenant };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi thêm khách thuê" };
  }
}

/**
 * Mark a tenant as moved out.
 * Auto-syncs room status to "empty" if 0 active tenants remain.
 */
export async function markTenantMovedOut(
  tenantId: string,
  endDate?: string
): Promise<TenantActionResult> {
  try {
    const supabase = await createClient();

    // 1. Fetch the tenant to find room_id
    const { data: tenant, error: fetchError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (fetchError || !tenant) {
      return { success: false, error: "Không tìm thấy khách thuê" };
    }

    const actualEndDate = endDate || new Date().toISOString().split("T")[0];

    // 2. Update tenant status to moved_out
    const { data: updatedTenant, error: updateError } = await supabase
      .from("tenants")
      .update({
        status: "moved_out",
        end_date: actualEndDate,
        is_lead: false,
      })
      .eq("id", tenantId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 3. Query remaining active tenants in this room
    const { data: remainingActive } = await supabase
      .from("tenants")
      .select("*")
      .eq("room_id", tenant.room_id)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    const activeList = remainingActive || [];

    if (activeList.length === 0) {
      // 0 active tenants left -> mark room as empty
      await supabase
        .from("rooms")
        .update({ status: "empty" })
        .eq("id", tenant.room_id);
    } else {
      // If the departed tenant was the lead tenant, designate the next active tenant as lead
      const hasLead = activeList.some((t: Tenant) => t.is_lead);
      if (!hasLead && activeList.length > 0) {
        await supabase
          .from("tenants")
          .update({ is_lead: true })
          .eq("id", activeList[0].id);
      }
    }

    safeRevalidatePath("/");
    safeRevalidatePath("/rooms");
    safeRevalidatePath(`/rooms/${tenant.room_id}`);

    return { success: true, tenant: updatedTenant };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi cập nhật trả phòng" };
  }
}

/**
 * Update tenant information
 */
export async function updateTenant(
  tenantId: string,
  data: Partial<TenantUpdate>
): Promise<TenantActionResult> {
  try {
    const supabase = await createClient();

    const { data: currentTenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (!currentTenant) {
      return { success: false, error: "Không tìm thấy thông tin khách thuê" };
    }

    // If making this tenant lead, unset other leads in the room
    if (data.is_lead === true) {
      const { data: otherTenants } = await supabase
        .from("tenants")
        .select("id")
        .eq("room_id", currentTenant.room_id)
        .eq("status", "active")
        .neq("id", tenantId);

      if (otherTenants) {
        for (const ot of otherTenants) {
          await supabase
            .from("tenants")
            .update({ is_lead: false })
            .eq("id", ot.id);
        }
      }
    }

    const { data: updated, error } = await supabase
      .from("tenants")
      .update(data)
      .eq("id", tenantId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/");
    safeRevalidatePath("/rooms");
    safeRevalidatePath(`/rooms/${currentTenant.room_id}`);

    return { success: true, tenant: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi cập nhật khách thuê" };
  }
}

/**
 * Delete a tenant record completely
 */
export async function deleteTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: tenant } = await supabase
      .from("tenants")
      .select("room_id, status")
      .eq("id", tenantId)
      .single();

    const { error } = await supabase.from("tenants").delete().eq("id", tenantId);
    if (error) {
      return { success: false, error: error.message };
    }

    if (tenant) {
      // Re-check active tenants
      const { data: remaining } = await supabase
        .from("tenants")
        .select("id")
        .eq("room_id", tenant.room_id)
        .eq("status", "active");

      if (!remaining || remaining.length === 0) {
        await supabase.from("rooms").update({ status: "empty" }).eq("id", tenant.room_id);
      }

      safeRevalidatePath("/");
      safeRevalidatePath("/rooms");
      safeRevalidatePath(`/rooms/${tenant.room_id}`);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi xóa khách thuê" };
  }
}

"use server";

async function safeRevalidatePath(path: string) {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(path);
  } catch {}
}

import { createClient } from "../lib/supabase/server.ts";
import type { Setting, SettingUpdate } from "../types/index.ts";

export interface SettingsActionResult {
  success: boolean;
  settings?: Setting;
  error?: string;
}

/**
 * Get current system settings
 */
export async function getSettings(): Promise<{ settings: Setting | null; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) return { settings: null, error: error.message };
    return { settings: data };
  } catch (err: any) {
    return { settings: null, error: err.message || "Lỗi khi tải cài đặt" };
  }
}

/**
 * Update system utility rates and bank info
 */
export async function updateSettings(data: {
  electric_price?: number;
  water_price?: number;
  service_price?: number;
  bank_info?: string;
  address?: string;
  service_description?: string;
  receipt_note?: string;
}): Promise<SettingsActionResult> {
  try {
    const supabase = await createClient();

    const updatePayload: Partial<SettingUpdate> = {};
    if (data.electric_price !== undefined) updatePayload.electric_price = Number(data.electric_price);
    if (data.water_price !== undefined) updatePayload.water_price = Number(data.water_price);
    if (data.service_price !== undefined) updatePayload.service_price = Number(data.service_price);
    if (data.bank_info !== undefined) updatePayload.bank_info = data.bank_info.trim();
    if (data.address !== undefined) updatePayload.address = data.address.trim();
    if (data.service_description !== undefined) updatePayload.service_description = data.service_description.trim();
    if (data.receipt_note !== undefined) updatePayload.receipt_note = data.receipt_note.trim();

    let { data: updated, error } = await supabase
      .from("settings")
      .upsert({
        id: 1,
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    // If Supabase table is missing optional receipt columns (PGRST204), fallback to core fields
    if (error && (error.code === "PGRST204" || error.message?.includes("Could not find"))) {
      const corePayload: any = {
        id: 1,
        updated_at: new Date().toISOString(),
      };
      if (updatePayload.electric_price !== undefined) corePayload.electric_price = updatePayload.electric_price;
      if (updatePayload.water_price !== undefined) corePayload.water_price = updatePayload.water_price;
      if (updatePayload.service_price !== undefined) corePayload.service_price = updatePayload.service_price;
      if (updatePayload.bank_info !== undefined) corePayload.bank_info = updatePayload.bank_info;

      const fallbackRes = await supabase
        .from("settings")
        .upsert(corePayload)
        .select()
        .single();

      if (!fallbackRes.error) {
        updated = {
          ...fallbackRes.data,
          address: updatePayload.address,
          service_description: updatePayload.service_description,
          receipt_note: updatePayload.receipt_note,
        };
        error = null;
      }
    }

    if (error) return { success: false, error: error.message };

    safeRevalidatePath("/settings");
    safeRevalidatePath("/invoices/new");
    safeRevalidatePath("/");

    return { success: true, settings: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi cập nhật cài đặt" };
  }
}

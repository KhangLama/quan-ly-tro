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
}): Promise<SettingsActionResult> {
  try {
    const supabase = await createClient();

    const updatePayload: Partial<SettingUpdate> = {};
    if (data.electric_price !== undefined) updatePayload.electric_price = Number(data.electric_price);
    if (data.water_price !== undefined) updatePayload.water_price = Number(data.water_price);
    if (data.service_price !== undefined) updatePayload.service_price = Number(data.service_price);
    if (data.bank_info !== undefined) updatePayload.bank_info = data.bank_info.trim();

    const { data: updated, error } = await supabase
      .from("settings")
      .upsert({
        id: 1,
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    safeRevalidatePath("/settings");
    safeRevalidatePath("/invoices/new");
    safeRevalidatePath("/");

    return { success: true, settings: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi cập nhật cài đặt" };
  }
}

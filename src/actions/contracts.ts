"use server";

import { createClient } from "../lib/supabase/server.ts";
import { parsePaymentAccounts } from "../lib/vietqr.ts";
import {
  DEFAULT_CONTRACT_TEMPLATE,
  normalizeContractTemplate,
  ROOM_CONFIG_CONTRACT_TITLE,
  type ContractTemplateConfig,
  type RoomContractConfig,
} from "../lib/contracts/template.ts";
import type { Contract, ContractInsert, ContractUpdate } from "../types/index.ts";

async function safeRevalidatePath(path: string) {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(path);
  } catch {}
}

/**
 * Save (create or update) a contract
 */
export async function saveContract(data: ContractInsert & { id?: string }): Promise<{
  contract: Contract | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    if (data.id) {
      // Update existing contract
      const updateData: ContractUpdate = {
        tenant_name: data.tenant_name,
        title: data.title,
        html_content: data.html_content,
        form_data: data.form_data,
        status: data.status,
        updated_at: new Date().toISOString(),
      };

      const { data: contract, error } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", data.id)
        .select()
        .single();

      if (error) return { contract: null, error: error.message };
      return { contract };
    } else {
      // Create new contract
      const insertData: ContractInsert = {
        room_id: data.room_id,
        tenant_id: data.tenant_id || null,
        tenant_name: data.tenant_name || "",
        title: data.title || "",
        html_content: data.html_content || "",
        form_data: data.form_data || null,
        status: data.status || "draft",
      };

      const { data: contract, error } = await supabase
        .from("contracts")
        .insert(insertData)
        .select()
        .single();

      if (error) return { contract: null, error: error.message };
      return { contract };
    }
  } catch (err: any) {
    return { contract: null, error: err.message || "Không thể lưu hợp đồng" };
  }
}

/**
 * Get all contracts for a specific room, newest first (excludes internal room config record)
 */
export async function getContractsByRoom(roomId: string): Promise<{
  contracts: Contract[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("room_id", roomId)
      .order("updated_at", { ascending: false });

    if (error) return { contracts: [], error: error.message };
    const filtered = (data || []).filter(
      (c: any) => c.title !== ROOM_CONFIG_CONTRACT_TITLE
    );
    return { contracts: filtered };
  } catch (err: any) {
    return { contracts: [], error: err.message || "Không thể tải danh sách hợp đồng" };
  }
}

/**
 * Get a single contract by ID
 */
export async function getContract(id: string): Promise<{
  contract: Contract | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return { contract: null, error: error.message };
    return { contract: data };
  } catch (err: any) {
    return { contract: null, error: err.message || "Không thể tải hợp đồng" };
  }
}

/**
 * Delete a contract by ID
 */
export async function deleteContract(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("contracts").delete().eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (err: any) {
    return { error: err.message || "Không thể xoá hợp đồng" };
  }
}

/**
 * Get global contract template from `settings` (id = 1).
 * Reads `contract_template` column if available, or falls back to `_contract_template` inside `bank_info` JSON.
 */
export async function getContractTemplate(): Promise<{
  template: ContractTemplateConfig;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return {
        template: { ...DEFAULT_CONTRACT_TEMPLATE },
        error: error?.message,
      };
    }

    const explicitCol = (data as any)?.contract_template;
    if (explicitCol && typeof explicitCol === "object") {
      return {
        template: normalizeContractTemplate(explicitCol),
      };
    }

    const rawBankInfo = (data as any)?.bank_info;
    if (typeof rawBankInfo === "string" && rawBankInfo.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(rawBankInfo.trim());
        if (parsed && typeof parsed._contract_template === "object") {
          return {
            template: normalizeContractTemplate(parsed._contract_template),
          };
        }
      } catch {
        // Ignore invalid JSON
      }
    }

    return { template: { ...DEFAULT_CONTRACT_TEMPLATE } };
  } catch (err: any) {
    return {
      template: { ...DEFAULT_CONTRACT_TEMPLATE },
      error: err?.message || "Không thể tải mẫu hợp đồng",
    };
  }
}

/**
 * Save global contract template into `settings` (id = 1).
 * Saves to `contract_template` column AND embeds `_contract_template` into `bank_info` JSON
 * so it persists reliably even when the database migration has not been run yet.
 */
export async function saveContractTemplate(
  partialTemplate: Partial<ContractTemplateConfig>
): Promise<{
  success: boolean;
  template: ContractTemplateConfig;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { template: current } = await getContractTemplate();
    const merged = normalizeContractTemplate({
      ...current,
      ...partialTemplate,
    });

    const { data: currentSettings } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    const rawBankInfo = (currentSettings as any)?.bank_info || "";
    const parsedAccounts = parsePaymentAccounts(rawBankInfo);
    const enrichedBankJson = JSON.stringify({
      split: parsedAccounts.split,
      room: parsedAccounts.room,
      service: parsedAccounts.service,
      _contract_template: merged,
    });

    const nowIso = new Date().toISOString();

    const { error: colErr } = await supabase
      .from("settings")
      .update({
        contract_template: merged,
        bank_info: enrichedBankJson,
        updated_at: nowIso,
      } as any)
      .eq("id", 1);

    if (
      colErr &&
      (colErr.code === "PGRST204" ||
        colErr.message?.includes("contract_template") ||
        colErr.message?.includes("Could not find"))
    ) {
      const { error: fallbackErr } = await supabase
        .from("settings")
        .update({
          bank_info: enrichedBankJson,
          updated_at: nowIso,
        })
        .eq("id", 1);

      if (fallbackErr) {
        return {
          success: false,
          template: merged,
          error: fallbackErr.message || "Không thể lưu mẫu hợp đồng",
        };
      }
    } else if (colErr) {
      return {
        success: false,
        template: merged,
        error: colErr.message || "Không thể lưu mẫu hợp đồng",
      };
    }

    safeRevalidatePath("/settings");
    safeRevalidatePath("/rooms");

    return {
      success: true,
      template: merged,
    };
  } catch (err: any) {
    return {
      success: false,
      template: { ...DEFAULT_CONTRACT_TEMPLATE },
      error: err?.message || "Lỗi khi lưu mẫu hợp đồng",
    };
  }
}

/**
 * Get per-room contract configuration (`RoomContractConfig`) for a specific room.
 * Checks `rooms.contract_settings` first, then falls back to the special record in `contracts`.
 */
export async function getRoomContractConfig(roomId: string): Promise<{
  config: RoomContractConfig;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    const roomSettings = (roomData as any)?.contract_settings;
    if (
      roomSettings &&
      typeof roomSettings === "object" &&
      Object.keys(roomSettings).length > 0
    ) {
      return { config: roomSettings as RoomContractConfig };
    }

    const { data: configRecord } = await supabase
      .from("contracts")
      .select("*")
      .eq("room_id", roomId)
      .eq("title", ROOM_CONFIG_CONTRACT_TITLE)
      .maybeSingle();

    if (configRecord && configRecord.form_data && typeof configRecord.form_data === "object") {
      return { config: configRecord.form_data as RoomContractConfig };
    }

    return { config: {} };
  } catch (err: any) {
    return {
      config: {},
      error: err?.message || "Không thể tải cài đặt hợp đồng của phòng",
    };
  }
}

/**
 * Save per-room contract configuration (`RoomContractConfig`) for a specific room.
 * Persists both to `rooms.contract_settings` (when column exists) and to the `contracts` table
 * under title `ROOM_CONFIG_CONTRACT_TITLE` for 100% compatibility without migration.
 */
export async function saveRoomContractConfig(
  roomId: string,
  config: RoomContractConfig
): Promise<{
  success: boolean;
  config: RoomContractConfig;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const cleanedConfig: RoomContractConfig = {
      roomArea: config.roomArea?.trim() || undefined,
      defaultLeaseMonths:
        typeof config.defaultLeaseMonths === "number" && config.defaultLeaseMonths > 0
          ? Math.round(config.defaultLeaseMonths)
          : undefined,
      defaultDepositAmount:
        typeof config.defaultDepositAmount === "number" && config.defaultDepositAmount >= 0
          ? Math.round(config.defaultDepositAmount)
          : undefined,
      roomAddressOverride: config.roomAddressOverride?.trim() || undefined,
      furnitureDetails: Array.isArray(config.furnitureDetails)
        ? config.furnitureDetails.map((s) => s.trim()).filter(Boolean)
        : undefined,
      specialTerms: Array.isArray(config.specialTerms)
        ? config.specialTerms.map((s) => s.trim()).filter(Boolean)
        : undefined,
      enableStagedPricing:
        config.enableStagedPricing !== undefined
          ? Boolean(config.enableStagedPricing)
          : undefined,
      rentStages: Array.isArray(config.rentStages)
        ? config.rentStages
            .filter((st) => st && typeof st === "object")
            .map((st, idx) => ({
              id: st.id || `stage-${idx + 1}`,
              label: (st.label || `Giai đoạn ${idx + 1}`).trim(),
              months:
                typeof st.months === "number" && st.months > 0
                  ? Math.round(st.months)
                  : undefined,
              price: Math.max(0, Math.round(Number(st.price) || 0)),
              note: st.note ? st.note.trim() : undefined,
            }))
        : undefined,
    };

    // 1. Try updating `rooms.contract_settings` if column exists
    await supabase
      .from("rooms")
      .update({ contract_settings: cleanedConfig } as any)
      .eq("id", roomId);

    // 2. Also store in `contracts` table with title ROOM_CONFIG_CONTRACT_TITLE
    const { data: existing } = await supabase
      .from("contracts")
      .select("id")
      .eq("room_id", roomId)
      .eq("title", ROOM_CONFIG_CONTRACT_TITLE)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    if (existing?.id) {
      const { error: updErr } = await supabase
        .from("contracts")
        .update({
          form_data: cleanedConfig as any,
          updated_at: nowIso,
        })
        .eq("id", existing.id);

      if (updErr) {
        return {
          success: false,
          config: cleanedConfig,
          error: updErr.message,
        };
      }
    } else {
      const { error: insErr } = await supabase.from("contracts").insert({
        room_id: roomId,
        tenant_id: null,
        tenant_name: "__CONFIG__",
        title: ROOM_CONFIG_CONTRACT_TITLE,
        html_content: "",
        form_data: cleanedConfig as any,
        status: "draft",
      });

      if (insErr) {
        return {
          success: false,
          config: cleanedConfig,
          error: insErr.message,
        };
      }
    }

    safeRevalidatePath(`/rooms/${roomId}`);
    safeRevalidatePath("/rooms");

    return {
      success: true,
      config: cleanedConfig,
    };
  } catch (err: any) {
    return {
      success: false,
      config,
      error: err?.message || "Không thể lưu cài đặt hợp đồng của phòng",
    };
  }
}

"use server";

import { createClient } from "../lib/supabase/server.ts";
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
 * Get all contracts for a specific room, newest first
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
    return { contracts: data || [] };
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

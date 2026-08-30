"use server";

async function safeRevalidatePath(path: string) {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(path);
  } catch {}
}

import { createClient } from "@/lib/supabase/server";
import type { Expense, ExpenseStatus } from "@/types";

export interface ExpenseListResult {
  expenses: Expense[];
  totalAmount: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  error?: string;
}

export interface ExpenseActionResult {
  success: boolean;
  expense?: Expense;
  error?: string;
}

export interface CreateExpenseInput {
  month: string; // e.g. '2026-08'
  date: string; // e.g. '2026-08-26' or '26/08/2026'
  item_name: string;
  category?: string;
  status?: ExpenseStatus;
  unit_price: number;
  quantity?: number;
  notes?: string;
}

/**
 * Fetch expenses for a specific month
 */
export async function getExpenses(targetMonth?: string): Promise<ExpenseListResult> {
  try {
    const month = targetMonth || new Date().toISOString().substring(0, 7);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("month", month)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      // Table may not exist yet or empty
      return {
        expenses: [],
        totalAmount: 0,
        totalPendingAmount: 0,
        totalPaidAmount: 0,
        error: error.message,
      };
    }

    const expenses: Expense[] = (data || []).map((exp: any) => ({
      ...exp,
      unit_price: Number(exp.unit_price) || 0,
      quantity: Number(exp.quantity) || 1,
      total_amount: Number(exp.total_amount) || (Number(exp.unit_price) || 0) * (Number(exp.quantity) || 1),
    }));

    let totalAmount = 0;
    let totalPendingAmount = 0;
    let totalPaidAmount = 0;

    for (const exp of expenses) {
      totalAmount += exp.total_amount;
      if (exp.status === "paid") {
        totalPaidAmount += exp.total_amount;
      } else {
        totalPendingAmount += exp.total_amount;
      }
    }

    return {
      expenses,
      totalAmount,
      totalPendingAmount,
      totalPaidAmount,
    };
  } catch (err: any) {
    return {
      expenses: [],
      totalAmount: 0,
      totalPendingAmount: 0,
      totalPaidAmount: 0,
      error: err.message || "Lỗi khi tải danh sách chi phí",
    };
  }
}

/**
 * Add a new expense
 */
export async function addExpense(data: CreateExpenseInput): Promise<ExpenseActionResult> {
  try {
    if (!data.item_name || !data.item_name.trim()) {
      return { success: false, error: "Vui lòng nhập tên hạng mục chi phí" };
    }

    const supabase = await createClient();
    const unitPrice = Number(data.unit_price) || 0;
    const quantity = Number(data.quantity) || 1;
    const totalAmount = unitPrice * quantity;

    const insertPayload = {
      month: data.month,
      date: data.date || new Date().toISOString().substring(0, 10),
      item_name: data.item_name.trim(),
      category: (data.category || "Khác").trim(),
      status: data.status || "pending",
      unit_price: unitPrice,
      quantity: quantity,
      total_amount: totalAmount,
      notes: (data.notes || "").trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/expenses");
    safeRevalidatePath("/");

    return { success: true, expense: inserted };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi thêm chi phí" };
  }
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  id: string,
  data: Partial<CreateExpenseInput>
): Promise<ExpenseActionResult> {
  try {
    const supabase = await createClient();

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.month !== undefined) updatePayload.month = data.month;
    if (data.date !== undefined) updatePayload.date = data.date;
    if (data.item_name !== undefined) updatePayload.item_name = data.item_name.trim();
    if (data.category !== undefined) updatePayload.category = data.category.trim();
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes.trim();

    if (data.unit_price !== undefined || data.quantity !== undefined) {
      const unitPrice = data.unit_price !== undefined ? Number(data.unit_price) : undefined;
      const quantity = data.quantity !== undefined ? Number(data.quantity) : undefined;
      if (unitPrice !== undefined) updatePayload.unit_price = unitPrice;
      if (quantity !== undefined) updatePayload.quantity = quantity;

      // If both or either present, compute total_amount
      if (unitPrice !== undefined && quantity !== undefined) {
        updatePayload.total_amount = unitPrice * quantity;
      }
    }

    const { data: updated, error } = await supabase
      .from("expenses")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/expenses");
    safeRevalidatePath("/");

    return { success: true, expense: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi cập nhật chi phí" };
  }
}

/**
 * Toggle payment status of an expense between 'pending' and 'paid'
 */
export async function toggleExpenseStatus(id: string): Promise<ExpenseActionResult> {
  try {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("expenses")
      .select("status")
      .eq("id", id)
      .single();

    if (!existing) {
      return { success: false, error: "Không tìm thấy khoản chi" };
    }

    const nextStatus = existing.status === "paid" ? "pending" : "paid";

    const { data: updated, error } = await supabase
      .from("expenses")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/expenses");
    safeRevalidatePath("/");

    return { success: true, expense: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi đổi trạng thái chi phí" };
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    safeRevalidatePath("/expenses");
    safeRevalidatePath("/");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi xóa khoản chi" };
  }
}

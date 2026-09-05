"use server";

import { createClient } from "../lib/supabase/server.ts";
import type { Room, Tenant, Invoice, DashboardStats } from "../types/index.ts";
import { compareRoomCodes } from "../lib/utils.ts";

export interface DashboardRoomCard {
  id: string;
  code: string;
  base_price: number;
  status: "rented" | "empty";
  activeTenantsCount: number;
  leadTenantName: string | null;
  leadTenantPhone: string | null;
  invoice: Invoice | null;
  billingStatus: "paid" | "pending" | "empty";
  billingBadgeLabel: "Đã thu" | "Chưa thu" | "Trống";
}

export interface DashboardDataResult {
  stats: DashboardStats;
  rooms: DashboardRoomCard[];
  error?: string;
}

export async function getDashboardData(month?: string): Promise<DashboardDataResult> {
  try {
    const currentMonth = month || new Date().toISOString().substring(0, 7);
    const supabase = await createClient();

    // Fetch rooms, all tenants (including moved out), invoices, and expenses in parallel
    const [
      { data: roomsData, error: roomsError },
      { data: tenantsData },
      { data: invoicesData },
      { data: expensesData },
    ] = await Promise.all([
      supabase.from("rooms").select("*").order("code", { ascending: true }),
      supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase.from("invoices").select("*").eq("month", currentMonth),
      supabase.from("expenses").select("*").eq("month", currentMonth),
    ]);

    if (roomsError) {
      return {
        stats: {
          currentMonth,
          totalRevenue: 0,
          collectedAmount: 0,
          pendingAmount: 0,
          totalRooms: 0,
          rentedRooms: 0,
          emptyRooms: 0,
          occupancyRate: 0,
          totalExpenses: 0,
          paidExpenses: 0,
          pendingExpenses: 0,
          netProfit: 0,
          actualCashflow: 0,
        },
        rooms: [],
        error: roomsError.message,
      };
    }

    const rooms: Room[] = roomsData || [];
    const allTenants: Tenant[] = tenantsData || [];
    const invoices: Invoice[] = invoicesData || [];
    const expenses: any[] = expensesData || [];

    // Compute financial income KPIs
    let totalRevenue = 0;
    let collectedAmount = 0;
    let pendingAmount = 0;

    for (const inv of invoices) {
      const amt = Number(inv.total_amount) || 0;
      totalRevenue += amt;
      if (inv.status === "paid") {
        collectedAmount += amt;
      } else {
        pendingAmount += amt;
      }
    }

    // Compute expenses KPIs
    let totalExpenses = 0;
    let paidExpenses = 0;
    let pendingExpenses = 0;

    for (const exp of expenses) {
      const amt = Number(exp.total_amount) || 0;
      totalExpenses += amt;
      if (exp.status === "paid") {
        paidExpenses += amt;
      } else {
        pendingExpenses += amt;
      }
    }

    const netProfit = totalRevenue - totalExpenses;
    const actualCashflow = collectedAmount - paidExpenses;

    // Calculate time boundaries for the selected month to evaluate historical occupancy
    const [yearStr, monthStr] = currentMonth.split("-");
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const lastDay = new Date(year, monthNum, 0).getDate();
    const monthStartDate = `${currentMonth}-01`;
    const monthEndDate = `${currentMonth}-${String(lastDay).padStart(2, "0")}`;
    const todayMonth = new Date().toISOString().substring(0, 7);
    const isCurrentOrFuture = currentMonth >= todayMonth;

    // Build room cards with historical occupancy and billing badge for currentMonth
    const roomCards: DashboardRoomCard[] = rooms.map((room) => {
      // 1. Invoice of this room in selected month
      const invoice = invoices.find((inv) => inv.room_id === room.id) || null;

      // 2. Tenants residing in this room during currentMonth
      const monthTenants = allTenants.filter((t) => {
        if (t.room_id !== room.id) return false;
        const tStart = t.start_date
          ? t.start_date.substring(0, 10)
          : t.created_at
          ? t.created_at.substring(0, 10)
          : "";
        const tEnd = t.end_date ? t.end_date.substring(0, 10) : null;

        // Tenant must have moved in on or before the end of the selected month
        const hasMovedIn = !tStart || tStart <= monthEndDate;
        // Tenant must not have moved out before the start of the selected month
        const hasNotMovedOut = !tEnd
          ? t.status === "active" || (!isCurrentOrFuture && hasMovedIn)
          : tEnd >= monthStartDate;

        return hasMovedIn && hasNotMovedOut;
      });

      // 3. Evaluate whether room was occupied in this specific month
      let isRoomOccupied = false;
      if (invoice !== null) {
        // An invoice in this month confirms the room was occupied/billed
        isRoomOccupied = true;
      } else if (monthTenants.length > 0) {
        isRoomOccupied = true;
      } else if (isCurrentOrFuture && room.status === "rented") {
        isRoomOccupied = true;
      } else {
        isRoomOccupied = false;
      }

      // 4. Identify lead tenant for this specific month
      const lead =
        monthTenants.find((t) => t.is_lead) ||
        monthTenants[0] ||
        (isRoomOccupied
          ? allTenants.filter((t) => t.room_id === room.id).find((t) => t.is_lead) ||
            allTenants.filter((t) => t.room_id === room.id)[0] ||
            null
          : null);

      let billingStatus: "paid" | "pending" | "empty" = "empty";
      let billingBadgeLabel: "Đã thu" | "Chưa thu" | "Trống" = "Trống";

      if (!isRoomOccupied) {
        billingStatus = "empty";
        billingBadgeLabel = "Trống";
      } else if (invoice) {
        if (invoice.status === "paid") {
          billingStatus = "paid";
          billingBadgeLabel = "Đã thu";
        } else {
          billingStatus = "pending";
          billingBadgeLabel = "Chưa thu";
        }
      } else {
        // Room was rented/occupied in this month, but invoice has not been generated yet
        billingStatus = "pending";
        billingBadgeLabel = "Chưa thu";
      }

      const tenantsCount = isRoomOccupied ? Math.max(monthTenants.length, lead ? 1 : 0) : 0;

      return {
        id: room.id,
        code: room.code,
        base_price: room.base_price,
        status: isRoomOccupied ? "rented" : "empty",
        activeTenantsCount: tenantsCount,
        leadTenantName: isRoomOccupied && lead ? lead.name : null,
        leadTenantPhone: isRoomOccupied && lead ? lead.phone : null,
        invoice,
        billingStatus,
        billingBadgeLabel,
      };
    });

    // Compute room occupancy KPIs based on room cards in this specific month
    const totalRooms = rooms.length;
    const rentedRooms = roomCards.filter((r) => r.status === "rented").length;
    const emptyRooms = Math.max(0, totalRooms - rentedRooms);
    const occupancyRate = totalRooms > 0 ? Math.round((rentedRooms / totalRooms) * 100) : 0;

    roomCards.sort(compareRoomCodes);

    return {
      stats: {
        currentMonth,
        totalRevenue,
        collectedAmount,
        pendingAmount,
        totalRooms,
        rentedRooms,
        emptyRooms,
        occupancyRate,
        totalExpenses,
        paidExpenses,
        pendingExpenses,
        netProfit,
        actualCashflow,
      },
      rooms: roomCards,
    };
  } catch (err: any) {
    return {
      stats: {
        currentMonth: month || new Date().toISOString().substring(0, 7),
        totalRevenue: 0,
        collectedAmount: 0,
        pendingAmount: 0,
        totalRooms: 0,
        rentedRooms: 0,
        emptyRooms: 0,
        occupancyRate: 0,
        totalExpenses: 0,
        paidExpenses: 0,
        pendingExpenses: 0,
        netProfit: 0,
        actualCashflow: 0,
      },
      rooms: [],
      error: err.message || "Lỗi khi tải dữ liệu tổng quan",
    };
  }
}

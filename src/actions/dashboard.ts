"use server";

import { createClient } from "../lib/supabase/server.ts";
import type { Room, Tenant, Invoice, DashboardStats } from "../types/index.ts";

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

    // Fetch all rooms
    const { data: roomsData, error: roomsError } = await supabase
      .from("rooms")
      .select("*")
      .order("code", { ascending: true });

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
        },
        rooms: [],
        error: roomsError.message,
      };
    }

    const rooms: Room[] = roomsData || [];

    // Fetch all active tenants
    const { data: tenantsData } = await supabase
      .from("tenants")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true });

    const allTenants: Tenant[] = tenantsData || [];

    // Fetch all invoices for the selected month
    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*")
      .eq("month", currentMonth);

    const invoices: Invoice[] = invoicesData || [];

    // Compute financial KPIs
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

    // Compute room occupancy
    const totalRooms = rooms.length;
    const rentedRooms = rooms.filter((r) => r.status === "rented").length;
    const emptyRooms = rooms.filter((r) => r.status === "empty").length;
    const occupancyRate = totalRooms > 0 ? Math.round((rentedRooms / totalRooms) * 100) : 0;

    // Build room cards with billing badge
    const roomCards: DashboardRoomCard[] = rooms.map((room) => {
      const roomTenants = allTenants.filter((t) => t.room_id === room.id);
      const lead = roomTenants.find((t) => t.is_lead) || roomTenants[0] || null;
      const invoice = invoices.find((inv) => inv.room_id === room.id) || null;

      let billingStatus: "paid" | "pending" | "empty" = "empty";
      let billingBadgeLabel: "Đã thu" | "Chưa thu" | "Trống" = "Trống";

      if (room.status === "empty" || roomTenants.length === 0) {
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
        // Room is rented, but no invoice billed yet this month
        billingStatus = "pending";
        billingBadgeLabel = "Chưa thu";
      }

      return {
        id: room.id,
        code: room.code,
        base_price: room.base_price,
        status: room.status,
        activeTenantsCount: roomTenants.length,
        leadTenantName: lead ? lead.name : null,
        leadTenantPhone: lead ? lead.phone : null,
        invoice,
        billingStatus,
        billingBadgeLabel,
      };
    });

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
      },
      rooms: [],
      error: err.message || "Lỗi khi tải dữ liệu tổng quan",
    };
  }
}

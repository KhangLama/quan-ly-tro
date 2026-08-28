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

    // Fetch rooms, active tenants, and invoices in parallel for maximum speed
    const [
      { data: roomsData, error: roomsError },
      { data: tenantsData },
      { data: invoicesData },
    ] = await Promise.all([
      supabase.from("rooms").select("*").order("code", { ascending: true }),
      supabase
        .from("tenants")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: true }),
      supabase.from("invoices").select("*").eq("month", currentMonth),
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
        },
        rooms: [],
        error: roomsError.message,
      };
    }

    const rooms: Room[] = roomsData || [];
    const allTenants: Tenant[] = tenantsData || [];
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

    // Compute room occupancy based on actual active tenants
    const totalRooms = rooms.length;
    const rentedRooms = rooms.filter((r) => {
      const roomTenants = allTenants.filter((t) => t.room_id === r.id);
      return roomTenants.length > 0 || r.status === "rented";
    }).length;
    const emptyRooms = Math.max(0, totalRooms - rentedRooms);
    const occupancyRate = totalRooms > 0 ? Math.round((rentedRooms / totalRooms) * 100) : 0;

    // Build room cards with billing badge
    const roomCards: DashboardRoomCard[] = rooms.map((room) => {
      const roomTenants = allTenants.filter((t) => t.room_id === room.id);
      const isRoomOccupied = roomTenants.length > 0;
      const lead = roomTenants.find((t) => t.is_lead) || roomTenants[0] || null;
      const invoice = invoices.find((inv) => inv.room_id === room.id) || null;

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
        // Room is rented / occupied, but no invoice billed yet this month
        billingStatus = "pending";
        billingBadgeLabel = "Chưa thu";
      }

      return {
        id: room.id,
        code: room.code,
        base_price: room.base_price,
        status: isRoomOccupied ? "rented" : "empty",
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

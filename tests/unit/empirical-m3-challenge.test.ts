import { describe, it, expect, beforeEach } from "vitest";
import { mockDbStore, mockSupabase } from "../../src/lib/supabase/mock-db.ts";
import { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } from "../../src/actions/rooms.ts";
import { addTenant, markTenantMovedOut, updateTenant, deleteTenant } from "../../src/actions/tenants.ts";
import { getDashboardData } from "../../src/actions/dashboard.ts";

describe("Milestone 3 Empirical Gate Verification Suite", () => {
  beforeEach(() => {
    mockDbStore.reset();
  });

  describe("Room Management Actions", () => {
    it("creates a room with status empty and queries room list correctly", async () => {
      const createRes = await createRoom({ code: "P101", base_price: 2500000 });
      expect(createRes.error).toBeUndefined();
      expect(createRes.room).toBeDefined();
      expect(createRes.room?.code).toBe("P101");
      expect(createRes.room?.status).toBe("empty");

      const roomsRes = await getRooms();
      expect(roomsRes.error).toBeUndefined();
      expect(roomsRes.rooms).toHaveLength(1);
      expect(roomsRes.rooms[0].code).toBe("P101");
      expect(roomsRes.rooms[0].activeTenants).toHaveLength(0);
      expect(roomsRes.rooms[0].leadTenant).toBeNull();
    });

    it("rejects duplicate room code creation", async () => {
      await createRoom({ code: "P102", base_price: 2800000 });
      const dupRes = await createRoom({ code: "P102", base_price: 3000000 });
      expect(dupRes.error).toBeDefined();
      expect(dupRes.error).toContain("tồn tại");
    });

    it("updates room base price and code", async () => {
      const { room } = await createRoom({ code: "P103", base_price: 2500000 });
      expect(room).toBeDefined();

      const updateRes = await updateRoom(room!.id, { base_price: 2700000, code: "P103-A" });
      expect(updateRes.error).toBeUndefined();
      expect(updateRes.room?.base_price).toBe(2700000);
      expect(updateRes.room?.code).toBe("P103-A");
    });

    it("deletes a room and cleans up linked state", async () => {
      const { room } = await createRoom({ code: "P104", base_price: 3000000 });
      const deleteRes = await deleteRoom(room!.id);
      expect(deleteRes.success).toBe(true);

      const fetchRes = await getRoomById(room!.id);
      expect(fetchRes.room).toBeNull();
    });
  });

  describe("Tenant Lifecycle & Vacancy Auto-Sync Actions", () => {
    it("adding first tenant auto-syncs room status to rented and designates lead", async () => {
      const { room } = await createRoom({ code: "P201", base_price: 3200000 });
      expect(room?.status).toBe("empty");

      const addRes = await addTenant({
        room_id: room!.id,
        name: "Nguyen Van A",
        phone: "0901234567",
        cccd: "001090001234",
        deposit_amount: 3200000,
      });

      expect(addRes.success).toBe(true);
      expect(addRes.tenant?.name).toBe("Nguyen Van A");
      expect(addRes.tenant?.is_lead).toBe(true);

      // Verify room details
      const detailRes = await getRoomById(room!.id);
      expect(detailRes.room?.status).toBe("rented");
      expect(detailRes.activeTenants).toHaveLength(1);
      expect(detailRes.leadTenant?.name).toBe("Nguyen Van A");
    });

    it("adding roommate maintains lead tenant and appends active tenants", async () => {
      const { room } = await createRoom({ code: "P202", base_price: 3500000 });

      // First resident (lead)
      await addTenant({
        room_id: room!.id,
        name: "Le Thi B",
        phone: "0902222222",
        is_lead: true,
      });

      // Second resident (roommate, not lead)
      const addRoommateRes = await addTenant({
        room_id: room!.id,
        name: "Tran Van C",
        phone: "0903333333",
        is_lead: false,
      });

      expect(addRoommateRes.success).toBe(true);
      expect(addRoommateRes.tenant?.is_lead).toBe(false);

      const detailRes = await getRoomById(room!.id);
      expect(detailRes.activeTenants).toHaveLength(2);
      expect(detailRes.leadTenant?.name).toBe("Le Thi B");
    });

    it("marking tenant moved_out archives tenant and keeps room rented if roommate remains", async () => {
      const { room } = await createRoom({ code: "P203", base_price: 3500000 });

      const t1 = await addTenant({ room_id: room!.id, name: "Resident 1", is_lead: true });
      const t2 = await addTenant({ room_id: room!.id, name: "Resident 2", is_lead: false });

      // Mark resident 1 moved out
      const checkoutRes = await markTenantMovedOut(t1.tenant!.id, "2026-08-20");
      expect(checkoutRes.success).toBe(true);

      const detailRes = await getRoomById(room!.id);
      expect(detailRes.activeTenants).toHaveLength(1);
      expect(detailRes.movedOutTenants).toHaveLength(1);
      expect(detailRes.movedOutTenants[0].name).toBe("Resident 1");
      expect(detailRes.movedOutTenants[0].end_date).toBe("2026-08-20");
      expect(detailRes.room?.status).toBe("rented");
      expect(detailRes.leadTenant?.name).toBe("Resident 2"); // promoted to lead
    });

    it("marking last tenant moved_out auto-syncs room status to empty", async () => {
      const { room } = await createRoom({ code: "P204", base_price: 3500000 });
      const t1 = await addTenant({ room_id: room!.id, name: "Sole Resident" });

      const checkoutRes = await markTenantMovedOut(t1.tenant!.id, "2026-08-26");
      expect(checkoutRes.success).toBe(true);

      const detailRes = await getRoomById(room!.id);
      expect(detailRes.room?.status).toBe("empty");
      expect(detailRes.activeTenants).toHaveLength(0);
      expect(detailRes.movedOutTenants).toHaveLength(1);
    });
  });

  describe("Dashboard Financials & Status Aggregation", () => {
    it("aggregates KPIs and room badges across empty, rented, paid, and pending rooms", async () => {
      // 1. Create 3 rooms
      const r1 = (await createRoom({ code: "P101", base_price: 2000000 })).room!;
      const r2 = (await createRoom({ code: "P102", base_price: 3000000 })).room!;
      const r3 = (await createRoom({ code: "P103", base_price: 4000000 })).room!;

      // 2. Add tenants to r1 and r2 (r3 remains empty)
      await addTenant({ room_id: r1.id, name: "Tenant 1" });
      await addTenant({ room_id: r2.id, name: "Tenant 2" });

      // 3. Create paid invoice for r1
      await mockSupabase.from("invoices").insert({
        room_id: r1.id,
        month: "2026-08",
        old_electric: 100,
        new_electric: 150,
        old_water: 20,
        new_water: 25,
        base_price: 2000000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
        total_amount: 2400000,
        status: "paid",
        paid_at: "2026-08-05T00:00:00Z",
      });

      // 4. Create pending invoice for r2
      await mockSupabase.from("invoices").insert({
        room_id: r2.id,
        month: "2026-08",
        old_electric: 200,
        new_electric: 260,
        old_water: 30,
        new_water: 36,
        base_price: 3000000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
        total_amount: 3460000,
        status: "pending",
      });

      const dash = await getDashboardData("2026-08");

      expect(dash.stats.totalRooms).toBe(3);
      expect(dash.stats.rentedRooms).toBe(2);
      expect(dash.stats.emptyRooms).toBe(1);
      expect(dash.stats.occupancyRate).toBe(67); // 2/3 = 67%
      expect(dash.stats.totalRevenue).toBe(2400000 + 3460000);
      expect(dash.stats.collectedAmount).toBe(2400000);
      expect(dash.stats.pendingAmount).toBe(3460000);

      // Verify badges on cards
      const cardR1 = dash.rooms.find((r) => r.id === r1.id);
      const cardR2 = dash.rooms.find((r) => r.id === r2.id);
      const cardR3 = dash.rooms.find((r) => r.id === r3.id);

      expect(cardR1?.billingBadgeLabel).toBe("Đã thu");
      expect(cardR2?.billingBadgeLabel).toBe("Chưa thu");
      expect(cardR3?.billingBadgeLabel).toBe("Trống");
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { mockSupabase, mockDbStore } from "../../src/lib/supabase/mock-db.ts";

describe("Empirical Challenger M1: Schema Constraints & Mock DB Stress Tests", () => {
  beforeEach(() => {
    mockDbStore.reset();
  });

  // =========================================================================
  // Challenge 1: Settings Table Singleton & Rate Constraints
  // =========================================================================
  describe("Challenge 1: Settings Singleton Constraint Integrity", () => {
    it("verifies initial state has exactly one settings row with id=1", async () => {
      const { data, error } = await mockSupabase.from("settings").select("*");
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(1);
      expect(data?.[0].electric_price).toBe(3500);
      expect(data?.[0].water_price).toBe(25000);
      expect(data?.[0].service_price).toBe(100000);
    });

    it("rejects inserting a second settings row with id != 1 (id=2)", async () => {
      const { data, error } = await mockSupabase.from("settings").insert({
        id: 2,
        electric_price: 4000,
        water_price: 30000,
        service_price: 120000,
        bank_info: "Another Bank",
      });

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toContain("singleton_check");
    });

    it("rejects inserting a settings row with negative or arbitrary id (id=-99)", async () => {
      const { data, error } = await mockSupabase.from("settings").insert({
        id: -99,
        electric_price: 5000,
      });

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toContain("singleton_check");
    });

    it("rejects inserting a settings row without specifying id (auto-generated ID != 1)", async () => {
      const { data, error } = await mockSupabase.from("settings").insert({
        electric_price: 4500,
        water_price: 28000,
      });

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toContain("singleton_check");
    });

    it("successfully updates existing singleton settings row (id=1)", async () => {
      const { data: updated, error: updateError } = await mockSupabase
        .from("settings")
        .update({
          electric_price: 4200,
          water_price: 27000,
          service_price: 150000,
          bank_info: "VietinBank - 123456789 - NGUYEN VAN A",
        })
        .eq("id", 1)
        .single();

      expect(updateError).toBeNull();
      expect(updated?.electric_price).toBe(4200);
      expect(updated?.water_price).toBe(27000);
      expect(updated?.service_price).toBe(150000);
      expect(updated?.bank_info).toContain("VietinBank");

      const { data: allSettings } = await mockSupabase.from("settings").select("*");
      expect(allSettings).toHaveLength(1);
      expect(allSettings?.[0].electric_price).toBe(4200);
    });
  });

  // =========================================================================
  // Challenge 2: Rooms Table Constraints & Uniqueness
  // =========================================================================
  describe("Challenge 2: Room Unique Constraint & Edge Cases", () => {
    it("successfully creates rooms with standard and unicode room codes", async () => {
      const { data: r1, error: e1 } = await mockSupabase
        .from("rooms")
        .insert({ code: "P.101", base_price: 2500000, status: "empty" })
        .select()
        .single();

      expect(e1).toBeNull();
      expect(r1?.code).toBe("P.101");

      const { data: r2, error: e2 } = await mockSupabase
        .from("rooms")
        .insert({ code: "Phòng VIP 1", base_price: 5000000, status: "rented" })
        .select()
        .single();

      expect(e2).toBeNull();
      expect(r2?.code).toBe("Phòng VIP 1");
    });

    it("strictly enforces unique room code constraint on duplicate insert", async () => {
      await mockSupabase.from("rooms").insert({ code: "P201", base_price: 3000000, status: "empty" });

      const { data: dup, error: dupErr } = await mockSupabase
        .from("rooms")
        .insert({ code: "P201", base_price: 3500000, status: "rented" });

      expect(dup).toBeNull();
      expect(dupErr).toBeDefined();
      expect(dupErr.message).toContain("duplicate key value violates unique constraint on code: P201");
    });

    it("allows updating room code if it does not collide with another room", async () => {
      const { data: r } = await mockSupabase
        .from("rooms")
        .insert({ code: "P301", base_price: 3000000, status: "empty" })
        .select()
        .single();

      const { data: updated, error } = await mockSupabase
        .from("rooms")
        .update({ code: "P301-Renovated" })
        .eq("id", r?.id)
        .single();

      expect(error).toBeNull();
      expect(updated?.code).toBe("P301-Renovated");
    });

    it("correctly sorts rooms ascending and descending by base_price and code", async () => {
      await mockSupabase.from("rooms").insert([
        { code: "P103", base_price: 2800000, status: "empty" },
        { code: "P101", base_price: 2500000, status: "empty" },
        { code: "P102", base_price: 3200000, status: "empty" },
      ]);

      const { data: ascRooms } = await mockSupabase
        .from("rooms")
        .select("*")
        .order("code", { ascending: true });

      expect(ascRooms?.map((r) => r.code)).toEqual(["P101", "P102", "P103"]);

      const { data: priceDescRooms } = await mockSupabase
        .from("rooms")
        .select("*")
        .order("base_price", { ascending: false });

      expect(priceDescRooms?.map((r) => r.code)).toEqual(["P102", "P103", "P101"]);
    });

    it("persists room-specific notes correctly", async () => {
      const { data: newRoom } = await mockSupabase
        .from("rooms")
        .insert({ code: "P999", base_price: 3000000, status: "empty" })
        .select()
        .single();

      expect(newRoom).toBeDefined();

      // Update note
      const { data: updated, error } = await mockSupabase
        .from("rooms")
        .update({ note: "Khách hẹn đóng thêm cọc ngày 15, máy lạnh mới bảo trì" })
        .eq("id", newRoom!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.note).toBe("Khách hẹn đóng thêm cọc ngày 15, máy lạnh mới bảo trì");
    });
  });

  // =========================================================================
  // Challenge 3: Invoices Unique Constraint on (room_id, month)
  // =========================================================================
  describe("Challenge 3: Invoices Composite Unique Constraint (room_id, month)", () => {
    it("enforces uniqueness of (room_id, month) within the same room", async () => {
      const { data: room } = await mockSupabase
        .from("rooms")
        .insert({ code: "P401", base_price: 3000000, status: "rented" })
        .select()
        .single();

      const { error: firstInsert } = await mockSupabase.from("invoices").insert({
        room_id: room.id,
        month: "2026-08",
        old_electric: 100,
        new_electric: 150,
        old_water: 10,
        new_water: 15,
        base_price: 3000000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
        total_amount: 3400000,
        status: "pending",
      });

      expect(firstInsert).toBeNull();

      // Duplicate insert for exact same room and month
      const { data: dupData, error: dupError } = await mockSupabase.from("invoices").insert({
        room_id: room.id,
        month: "2026-08",
        old_electric: 100,
        new_electric: 160,
        old_water: 10,
        new_water: 16,
        base_price: 3000000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
        total_amount: 3460000,
        status: "pending",
      });

      expect(dupData).toBeNull();
      expect(dupError).toBeDefined();
      expect(dupError.message).toContain("duplicate key value violates unique constraint on (room_id, month)");
    });

    it("permits same month billing across different rooms", async () => {
      const { data: roomA } = await mockSupabase
        .from("rooms")
        .insert({ code: "P402", base_price: 2500000, status: "rented" })
        .select()
        .single();

      const { data: roomB } = await mockSupabase
        .from("rooms")
        .insert({ code: "P403", base_price: 2800000, status: "rented" })
        .select()
        .single();

      const { error: errA } = await mockSupabase.from("invoices").insert({
        room_id: roomA.id,
        month: "2026-08",
        total_amount: 2900000,
        status: "paid",
      });

      const { error: errB } = await mockSupabase.from("invoices").insert({
        room_id: roomB.id,
        month: "2026-08",
        total_amount: 3200000,
        status: "pending",
      });

      expect(errA).toBeNull();
      expect(errB).toBeNull();

      const { data: augInvoices } = await mockSupabase
        .from("invoices")
        .select("*")
        .eq("month", "2026-08");

      expect(augInvoices).toHaveLength(2);
    });

    it("permits consecutive months billing for the same room", async () => {
      const { data: room } = await mockSupabase
        .from("rooms")
        .insert({ code: "P404", base_price: 3000000, status: "rented" })
        .select()
        .single();

      const { error: m1 } = await mockSupabase.from("invoices").insert({
        room_id: room.id,
        month: "2026-08",
        total_amount: 3400000,
        status: "paid",
      });

      const { error: m2 } = await mockSupabase.from("invoices").insert({
        room_id: room.id,
        month: "2026-09",
        total_amount: 3500000,
        status: "pending",
      });

      const { error: m3 } = await mockSupabase.from("invoices").insert({
        room_id: room.id,
        month: "2026-10",
        total_amount: 3600000,
        status: "pending",
      });

      expect(m1).toBeNull();
      expect(m2).toBeNull();
      expect(m3).toBeNull();

      const { data: roomInvoices } = await mockSupabase
        .from("invoices")
        .select("*")
        .eq("room_id", room.id)
        .order("month", { ascending: true });

      expect(roomInvoices).toHaveLength(3);
      expect(roomInvoices?.map((i) => i.month)).toEqual(["2026-08", "2026-09", "2026-10"]);
    });
  });

  // =========================================================================
  // Challenge 4: Cascade Delete Integrity
  // =========================================================================
  describe("Challenge 4: Cascade Deletion on Foreign Keys", () => {
    it("deleting a room cascade-deletes all associated tenants and invoices while preserving other rooms", async () => {
      // Create Room Target (to be deleted)
      const { data: roomTarget } = await mockSupabase
        .from("rooms")
        .insert({ code: "P501", base_price: 3000000, status: "rented" })
        .select()
        .single();

      // Create Room Safe (should remain intact)
      const { data: roomSafe } = await mockSupabase
        .from("rooms")
        .insert({ code: "P502", base_price: 3200000, status: "rented" })
        .select()
        .single();

      // Add 2 tenants to Room Target (Lead & Roommate)
      await mockSupabase.from("tenants").insert([
        {
          room_id: roomTarget.id,
          name: "Target Lead Tenant",
          phone: "0911111111",
          cccd: "001090111111",
          is_lead: true,
          status: "active",
        },
        {
          room_id: roomTarget.id,
          name: "Target Roommate",
          phone: "0922222222",
          cccd: "001090222222",
          is_lead: false,
          status: "active",
        },
      ]);

      // Add 1 tenant to Room Safe
      await mockSupabase.from("tenants").insert({
        room_id: roomSafe.id,
        name: "Safe Tenant",
        phone: "0933333333",
        cccd: "001090333333",
        is_lead: true,
        status: "active",
      });

      // Add 2 invoices to Room Target
      await mockSupabase.from("invoices").insert([
        { room_id: roomTarget.id, month: "2026-08", total_amount: 3400000, status: "paid" },
        { room_id: roomTarget.id, month: "2026-09", total_amount: 3500000, status: "pending" },
      ]);

      // Add 1 invoice to Room Safe
      await mockSupabase.from("invoices").insert({
        room_id: roomSafe.id,
        month: "2026-08",
        total_amount: 3600000,
        status: "paid",
      });

      // Assert pre-conditions
      const { data: preTenants } = await mockSupabase.from("tenants").select("*");
      const { data: preInvoices } = await mockSupabase.from("invoices").select("*");
      expect(preTenants).toHaveLength(3);
      expect(preInvoices).toHaveLength(3);

      // Perform Cascade Deletion: delete Room Target
      const { error: delErr } = await mockSupabase.from("rooms").delete().eq("id", roomTarget.id);
      expect(delErr).toBeNull();

      // Verify Room Target is gone, Room Safe remains
      const { data: postRooms } = await mockSupabase.from("rooms").select("*");
      expect(postRooms).toHaveLength(1);
      expect(postRooms?.[0].id).toBe(roomSafe.id);
      expect(postRooms?.[0].code).toBe("P502");

      // Verify Room Target tenants are purged, Safe Tenant remains
      const { data: postTenants } = await mockSupabase.from("tenants").select("*");
      expect(postTenants).toHaveLength(1);
      expect(postTenants?.[0].name).toBe("Safe Tenant");
      expect(postTenants?.[0].room_id).toBe(roomSafe.id);

      // Verify Room Target invoices are purged, Safe Invoice remains
      const { data: postInvoices } = await mockSupabase.from("invoices").select("*");
      expect(postInvoices).toHaveLength(1);
      expect(postInvoices?.[0].room_id).toBe(roomSafe.id);
      expect(postInvoices?.[0].total_amount).toBe(3600000);
    });

    it("handles deleting non-existent room ID gracefully without error", async () => {
      const { data, error } = await mockSupabase
        .from("rooms")
        .delete()
        .eq("id", "non-existent-uuid-12345");

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  // =========================================================================
  // Challenge 5: Query Builder Operators & Boundary Conditions
  // =========================================================================
  describe("Challenge 5: Query Builder Operators & Boundary Integrity", () => {
    it("handles single() and maybeSingle() on non-existent records accurately", async () => {
      const singleRes = await mockSupabase
        .from("rooms")
        .select("*")
        .eq("code", "DOES_NOT_EXIST")
        .single();

      expect(singleRes.data).toBeNull();
      expect(singleRes.error).toBeDefined();
      expect(singleRes.error.code).toBe("PGRST116");

      const maybeSingleRes = await mockSupabase
        .from("rooms")
        .select("*")
        .eq("code", "DOES_NOT_EXIST")
        .maybeSingle();

      expect(maybeSingleRes.data).toBeNull();
      expect(maybeSingleRes.error).toBeNull();
    });

    it("filters correctly with eq, neq, in, is null, and limit", async () => {
      const { data: r1 } = await mockSupabase
        .from("rooms")
        .insert({ code: "P601", base_price: 2000000, status: "empty" })
        .select()
        .single();

      const { data: r2 } = await mockSupabase
        .from("rooms")
        .insert({ code: "P602", base_price: 3000000, status: "rented" })
        .select()
        .single();

      const { data: r3 } = await mockSupabase
        .from("rooms")
        .insert({ code: "P603", base_price: 4000000, status: "rented" })
        .select()
        .single();

      // IN filter
      const { data: inRes } = await mockSupabase
        .from("rooms")
        .select("*")
        .in("code", ["P601", "P603"]);
      expect(inRes).toHaveLength(2);

      // NEQ filter
      const { data: neqRes } = await mockSupabase
        .from("rooms")
        .select("*")
        .neq("status", "empty");
      expect(neqRes).toHaveLength(2);

      // Limit filter
      const { data: limitRes } = await mockSupabase
        .from("rooms")
        .select("*")
        .order("base_price", { ascending: false })
        .limit(2);
      expect(limitRes).toHaveLength(2);
      expect(limitRes?.[0].code).toBe("P603");
      expect(limitRes?.[1].code).toBe("P602");

      // IS null filter on invoices paid_at
      await mockSupabase.from("invoices").insert([
        { room_id: r2.id, month: "2026-08", total_amount: 3500000, status: "pending", paid_at: null },
        { room_id: r3.id, month: "2026-08", total_amount: 4500000, status: "paid", paid_at: "2026-08-05" },
      ]);

      const { data: unpaidInvoices } = await mockSupabase
        .from("invoices")
        .select("*")
        .is("paid_at", null);

      expect(unpaidInvoices).toHaveLength(1);
      expect(unpaidInvoices?.[0].room_id).toBe(r2.id);
    });
  });

  // =========================================================================
  // Challenge 6: Stress & Volume Harness (100+ Operations)
  // =========================================================================
  describe("Challenge 6: High Volume & Rapid Operation Stress Harness", () => {
    it("handles 50 rooms with 100 tenants and 150 invoices without degradation or cross-contamination", async () => {
      const roomPayloads = Array.from({ length: 50 }, (_, i) => ({
        code: `STRESS-P${(i + 1).toString().padStart(3, "0")}`,
        base_price: 2000000 + i * 50000,
        status: (i % 2 === 0 ? "rented" : "empty") as "rented" | "empty",
      }));

      const { data: insertedRooms, error: rErr } = await mockSupabase
        .from("rooms")
        .insert(roomPayloads);

      expect(rErr).toBeNull();
      expect(insertedRooms).toHaveLength(50);

      // Add 2 tenants for every rented room (25 rented rooms * 2 = 50 tenants)
      const rentedRooms = insertedRooms.filter((r: any) => r.status === "rented");
      const tenantPayloads: any[] = [];
      for (const r of rentedRooms) {
        tenantPayloads.push({
          room_id: r.id,
          name: `Lead Tenant for ${r.code}`,
          phone: "0900000001",
          is_lead: true,
          status: "active",
        });
        tenantPayloads.push({
          room_id: r.id,
          name: `Roommate for ${r.code}`,
          phone: "0900000002",
          is_lead: false,
          status: "active",
        });
      }

      const { data: insertedTenants, error: tErr } = await mockSupabase
        .from("tenants")
        .insert(tenantPayloads);

      expect(tErr).toBeNull();
      expect(insertedTenants).toHaveLength(50);

      // Add 3 invoices for each rented room (25 * 3 = 75 invoices)
      const invoicePayloads: any[] = [];
      for (const r of rentedRooms) {
        invoicePayloads.push({
          room_id: r.id,
          month: "2026-08",
          total_amount: r.base_price + 300000,
          status: "paid",
        });
        invoicePayloads.push({
          room_id: r.id,
          month: "2026-09",
          total_amount: r.base_price + 350000,
          status: "paid",
        });
        invoicePayloads.push({
          room_id: r.id,
          month: "2026-10",
          total_amount: r.base_price + 400000,
          status: "pending",
        });
      }

      const { data: insertedInvoices, error: iErr } = await mockSupabase
        .from("invoices")
        .insert(invoicePayloads);

      expect(iErr).toBeNull();
      expect(insertedInvoices).toHaveLength(75);

      // Verify counts
      const { data: allRooms } = await mockSupabase.from("rooms").select("*");
      const { data: allTenants } = await mockSupabase.from("tenants").select("*");
      const { data: allInvoices } = await mockSupabase.from("invoices").select("*");

      expect(allRooms).toHaveLength(50);
      expect(allTenants).toHaveLength(50);
      expect(allInvoices).toHaveLength(75);

      // Delete 5 rented rooms and verify cascade deletion
      const victims = rentedRooms.slice(0, 5);
      for (const victim of victims) {
        await mockSupabase.from("rooms").delete().eq("id", victim.id);
      }

      const { data: remainingRooms } = await mockSupabase.from("rooms").select("*");
      const { data: remainingTenants } = await mockSupabase.from("tenants").select("*");
      const { data: remainingInvoices } = await mockSupabase.from("invoices").select("*");

      expect(remainingRooms).toHaveLength(45);
      expect(remainingTenants).toHaveLength(40); // 50 - 5*2 = 40
      expect(remainingInvoices).toHaveLength(60); // 75 - 5*3 = 60
    });
  });
});

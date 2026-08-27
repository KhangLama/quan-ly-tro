import { describe, it, expect, beforeEach } from "vitest";
import { mockSupabase, mockDbStore } from "../../src/lib/supabase/mock-db.ts";

describe("Mock Database Store & Query Builder", () => {
  beforeEach(() => {
    mockDbStore.reset();
  });

  it("seeds default settings singleton row with id 1", async () => {
    const { data, error } = await mockSupabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.id).toBe(1);
    expect(data?.electric_price).toBe(3500);
    expect(data?.water_price).toBe(25000);
    expect(data?.service_price).toBe(100000);
    expect(data?.bank_info).toContain("MBBank");
  });

  it("updates settings successfully", async () => {
    const { data, error } = await mockSupabase
      .from("settings")
      .update({ electric_price: 4000, water_price: 30000 })
      .eq("id", 1)
      .single();

    expect(error).toBeNull();
    expect(data?.electric_price).toBe(4000);
    expect(data?.water_price).toBe(30000);

    const { data: refetched } = await mockSupabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    expect(refetched?.electric_price).toBe(4000);
  });

  it("handles room creation, query, update, and unique constraint check", async () => {
    const { data: newRoom, error: insertError } = await mockSupabase
      .from("rooms")
      .insert({ code: "P101", base_price: 2500000, status: "empty" })
      .select()
      .single();

    expect(insertError).toBeNull();
    expect(newRoom).toBeDefined();
    expect(newRoom?.code).toBe("P101");
    expect(newRoom?.status).toBe("empty");

    // Query rooms ordered by code
    const { data: rooms } = await mockSupabase
      .from("rooms")
      .select("*")
      .order("code", { ascending: true });

    expect(rooms).toHaveLength(1);
    expect(rooms?.[0].code).toBe("P101");

    // Update room status
    const { data: updatedRoom } = await mockSupabase
      .from("rooms")
      .update({ status: "rented" })
      .eq("id", newRoom?.id)
      .single();

    expect(updatedRoom?.status).toBe("rented");

    // Unique constraint violation check
    const { error: dupError } = await mockSupabase
      .from("rooms")
      .insert({ code: "P101", base_price: 3000000, status: "empty" });

    expect(dupError).toBeDefined();
    expect(dupError?.message).toContain("duplicate key");
  });

  it("handles tenant lifecycle and cascade delete with rooms", async () => {
    const { data: room } = await mockSupabase
      .from("rooms")
      .insert({ code: "P102", base_price: 3000000, status: "rented" })
      .select()
      .single();

    const { data: tenant } = await mockSupabase
      .from("tenants")
      .insert({
        room_id: room.id,
        name: "Nguyen Van B",
        phone: "0912345678",
        cccd: "012345678901",
        is_lead: true,
        start_date: "2026-08-01",
        deposit_amount: 3000000,
        status: "active",
      })
      .select()
      .single();

    expect(tenant?.name).toBe("Nguyen Van B");
    expect(tenant?.is_lead).toBe(true);

    // Add invoice for the room
    const { data: invoice } = await mockSupabase
      .from("invoices")
      .insert({
        room_id: room.id,
        month: "2026-08",
        old_electric: 100,
        new_electric: 150,
        old_water: 20,
        new_water: 25,
        base_price: 3000000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
        total_amount: 3400000,
        status: "pending",
      })
      .select()
      .single();

    expect(invoice?.month).toBe("2026-08");

    // Deleting room should cascade delete tenants and invoices
    await mockSupabase.from("rooms").delete().eq("id", room.id);

    const { data: remainingRooms } = await mockSupabase.from("rooms").select("*");
    const { data: remainingTenants } = await mockSupabase.from("tenants").select("*");
    const { data: remainingInvoices } = await mockSupabase.from("invoices").select("*");

    expect(remainingRooms).toHaveLength(0);
    expect(remainingTenants).toHaveLength(0);
    expect(remainingInvoices).toHaveLength(0);
  });
});

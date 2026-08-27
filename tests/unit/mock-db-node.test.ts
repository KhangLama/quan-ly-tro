import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { mockSupabase, mockDbStore } from "../../src/lib/supabase/mock-db.ts";

describe("Mock Database Store & Query Builder (Node Test Runner)", () => {
  beforeEach(() => {
    mockDbStore.reset();
  });

  it("seeds default settings singleton row with id 1", async () => {
    const { data, error } = await mockSupabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    assert.strictEqual(error, null);
    assert.ok(data);
    assert.strictEqual(data.id, 1);
    assert.strictEqual(data.electric_price, 3500);
    assert.strictEqual(data.water_price, 25000);
    assert.strictEqual(data.service_price, 100000);
    assert.ok(data.bank_info.includes("MBBank"));
  });

  it("updates settings successfully", async () => {
    const { data, error } = await mockSupabase
      .from("settings")
      .update({ electric_price: 4000, water_price: 30000 })
      .eq("id", 1)
      .single();

    assert.strictEqual(error, null);
    assert.strictEqual(data.electric_price, 4000);
    assert.strictEqual(data.water_price, 30000);

    const { data: refetched } = await mockSupabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    assert.strictEqual(refetched.electric_price, 4000);
  });

  it("handles room creation, query, update, and unique constraint check", async () => {
    const { data: newRoom, error: insertError } = await mockSupabase
      .from("rooms")
      .insert({ code: "P101", base_price: 2500000, status: "empty" })
      .select()
      .single();

    assert.strictEqual(insertError, null);
    assert.ok(newRoom);
    assert.strictEqual(newRoom.code, "P101");
    assert.strictEqual(newRoom.status, "empty");

    // Query rooms ordered by code
    const { data: rooms } = await mockSupabase
      .from("rooms")
      .select("*")
      .order("code", { ascending: true });

    assert.strictEqual(rooms.length, 1);
    assert.strictEqual(rooms[0].code, "P101");

    // Update room status
    const { data: updatedRoom } = await mockSupabase
      .from("rooms")
      .update({ status: "rented" })
      .eq("id", newRoom.id)
      .single();

    assert.strictEqual(updatedRoom.status, "rented");

    // Unique constraint violation check
    const { error: dupError } = await mockSupabase
      .from("rooms")
      .insert({ code: "P101", base_price: 3000000, status: "empty" });

    assert.ok(dupError);
    assert.ok(dupError.message.includes("duplicate key"));
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

    assert.strictEqual(tenant.name, "Nguyen Van B");
    assert.strictEqual(tenant.is_lead, true);

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

    assert.strictEqual(invoice.month, "2026-08");

    // Deleting room should cascade delete tenants and invoices
    await mockSupabase.from("rooms").delete().eq("id", room.id);

    const { data: remainingRooms } = await mockSupabase.from("rooms").select("*");
    const { data: remainingTenants } = await mockSupabase.from("tenants").select("*");
    const { data: remainingInvoices } = await mockSupabase.from("invoices").select("*");

    assert.strictEqual(remainingRooms.length, 0);
    assert.strictEqual(remainingTenants.length, 0);
    assert.strictEqual(remainingInvoices.length, 0);
  });
});

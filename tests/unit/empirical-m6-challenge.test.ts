import { describe, it, expect, beforeEach } from "vitest";
import { mockDbStore, mockSupabase } from "../../src/lib/supabase/mock-db.ts";
import { createRoom, getRoomById, getRooms } from "../../src/actions/rooms.ts";
import { addTenant, markTenantMovedOut, updateTenant, deleteTenant } from "../../src/actions/tenants.ts";
import { getInvoiceFormData, saveInvoice, toggleInvoiceStatus } from "../../src/actions/invoices.ts";
import { getSettings, updateSettings } from "../../src/actions/settings.ts";
import { calculateInvoice } from "../../src/lib/calculations/invoice.ts";
import { buildZaloMessage } from "../../src/lib/zalo/template.ts";
import { createAuthToken, verifyAuthToken } from "../../src/lib/auth/session.ts";

describe("Milestone 6: Tier 5 White-Box Adversarial Hardening Suite", () => {
  beforeEach(() => {
    mockDbStore.reset();
  });

  describe("Adversarial Test 1: Historical Rate Snapshot Invariance", () => {
    it("changing settings rate in month 3 does NOT mutate month 1 and month 2 saved invoices", async () => {
      // 1. Create Room P101
      const { room } = await createRoom({ code: "P101", base_price: 2500000 });

      // 2. Initial Settings (Electric 3500, Water 25000)
      const { invoice: inv1 } = await saveInvoice({
        room_id: room!.id,
        month: "2026-08",
        old_electric: 0,
        new_electric: 100,
        old_water: 0,
        new_water: 10,
        base_price: 2500000,
        electric_price: 3500,
        water_price: 25000,
        service_price: 100000,
      });

      expect(inv1?.total_amount).toBe(2500000 + 100 * 3500 + 10 * 25000 + 100000); // 3,200,000

      // 3. Update Settings for Month 2 (Electric 4000, Water 30000)
      await updateSettings({ electric_price: 4000, water_price: 30000 });

      const formM2 = await getInvoiceFormData(room!.id, "2026-09");
      expect(formM2.previousReading.old_electric).toBe(100);
      expect(formM2.previousReading.old_water).toBe(10);
      expect(formM2.settings?.electric_price).toBe(4000);

      const { invoice: inv2 } = await saveInvoice({
        room_id: room!.id,
        month: "2026-09",
        old_electric: formM2.previousReading.old_electric,
        new_electric: 180,
        old_water: formM2.previousReading.old_water,
        new_water: 18,
        base_price: 2500000,
        electric_price: formM2.settings!.electric_price,
        water_price: formM2.settings!.water_price,
        service_price: 100000,
      });

      // Usage in month 2: 80 electric, 8 water
      expect(inv2?.total_amount).toBe(2500000 + 80 * 4000 + 8 * 30000 + 100000); // 3,160,000

      // 4. Update Settings again for Month 3 (Electric 5000, Water 35000)
      await updateSettings({ electric_price: 5000, water_price: 35000 });

      // 5. Invariant Assertion: Month 1 and Month 2 invoice rows MUST retain exact historical amounts and rate snapshots
      const { data: storedInvoices } = await mockSupabase
        .from("invoices")
        .select("*")
        .eq("room_id", room!.id)
        .order("month", { ascending: true });

      expect(storedInvoices).toHaveLength(2);
      expect(storedInvoices![0].month).toBe("2026-08");
      expect(storedInvoices![0].electric_price).toBe(3500);
      expect(storedInvoices![0].total_amount).toBe(3200000);

      expect(storedInvoices![1].month).toBe("2026-09");
      expect(storedInvoices![1].electric_price).toBe(4000);
      expect(storedInvoices![1].total_amount).toBe(3160000);
    });
  });

  describe("Adversarial Test 2: Complex Multi-Roommate Lifecycle & Vacancy Churn", () => {
    it("handles 4 roommates entering, lead departing, second lead departing, and final tenant leaving", async () => {
      const { room } = await createRoom({ code: "P201", base_price: 4000000 });
      expect(room?.status).toBe("empty");

      // Resident A (Lead)
      const a = await addTenant({ room_id: room!.id, name: "Alice", is_lead: true });
      // Resident B
      const b = await addTenant({ room_id: room!.id, name: "Bob", is_lead: false });
      // Resident C
      const c = await addTenant({ room_id: room!.id, name: "Charlie", is_lead: false });
      // Resident D
      const d = await addTenant({ room_id: room!.id, name: "David", is_lead: false });

      let details = await getRoomById(room!.id);
      expect(details.room?.status).toBe("rented");
      expect(details.activeTenants).toHaveLength(4);
      expect(details.leadTenant?.name).toBe("Alice");

      // 1. Alice (Lead) moves out -> Bob should be promoted to lead
      await markTenantMovedOut(a.tenant!.id);
      details = await getRoomById(room!.id);
      expect(details.activeTenants).toHaveLength(3);
      expect(details.leadTenant?.name).toBe("Bob");
      expect(details.room?.status).toBe("rented");

      // 2. Bob (new Lead) moves out -> Charlie should become lead
      await markTenantMovedOut(b.tenant!.id);
      details = await getRoomById(room!.id);
      expect(details.activeTenants).toHaveLength(2);
      expect(details.leadTenant?.name).toBe("Charlie");
      expect(details.room?.status).toBe("rented");

      // 3. Charlie moves out -> David is only resident and lead
      await markTenantMovedOut(c.tenant!.id);
      details = await getRoomById(room!.id);
      expect(details.activeTenants).toHaveLength(1);
      expect(details.leadTenant?.name).toBe("David");
      expect(details.room?.status).toBe("rented");

      // 4. David moves out -> 0 active tenants -> room status MUST auto-sync to empty
      await markTenantMovedOut(d.tenant!.id);
      details = await getRoomById(room!.id);
      expect(details.activeTenants).toHaveLength(0);
      expect(details.movedOutTenants).toHaveLength(4);
      expect(details.room?.status).toBe("empty");
    });
  });

  describe("Adversarial Test 3: Vietnamese Accents, Diacritics & Punctuation Integrity", () => {
    it("handles full Vietnamese unicode diacritics in tenant names, room codes, and notes without garbling", async () => {
      const roomCode = "P101 (Tầng 1 - Mặt Tiền)";
      const { room } = await createRoom({ code: roomCode, base_price: 3500000 });

      const tenantName = "Nguyễn Đỗ Hoàng Hải Đăng";
      const { tenant } = await addTenant({
        room_id: room!.id,
        name: tenantName,
        phone: "0988.777.666",
        cccd: "079095012345",
      });

      expect(tenant?.name).toBe(tenantName);

      const msg = buildZaloMessage({
        roomCode,
        month: "2026-08",
        totalAmount: 3850000,
        electricUsage: 100,
        electricCost: 350000,
        waterUsage: 10,
        waterCost: 250000,
        serviceCost: 100000,
      });

      expect(msg).toContain("Phòng P101 (Tầng 1 - Mặt Tiền)");
      expect(msg).toContain("3.850.000đ");
      expect(msg).toContain("Vui lòng thanh toán trước ngày 05. Xin cảm ơn!");
    });
  });

  describe("Adversarial Test 4: Web Crypto Auth Robustness", () => {
    it("creates valid tokens and resists replay/tampering attacks", async () => {
      const token = await createAuthToken();
      expect(typeof token).toBe("string");
      expect(token.includes(".")).toBe(true);

      const isValid = await verifyAuthToken(token);
      expect(isValid).toBe(true);

      // Tampered signature
      const [ts, sig] = token.split(".");
      const badSigToken = `${ts}.${sig.slice(0, -2)}00`;
      expect(await verifyAuthToken(badSigToken)).toBe(false);

      // Expired token (8 days in past)
      const expiredTs = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const expiredToken = `${expiredTs}.${sig}`;
      expect(await verifyAuthToken(expiredToken)).toBe(false);
    });
  });
});

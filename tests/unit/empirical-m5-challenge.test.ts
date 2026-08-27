import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import { mockDbStore, mockSupabase } from "../../src/lib/supabase/mock-db.ts";
import { getSettings, updateSettings } from "../../src/actions/settings.ts";

describe("Milestone 5 Empirical Gate Verification Suite", () => {
  beforeEach(() => {
    mockDbStore.reset();
  });

  describe("Settings Configuration Actions", () => {
    it("retrieves system settings singleton row with default rates", async () => {
      const res = await getSettings();
      expect(res.error).toBeUndefined();
      expect(res.settings).toBeDefined();
      expect(res.settings?.id).toBe(1);
      expect(res.settings?.electric_price).toBe(3500);
      expect(res.settings?.water_price).toBe(25000);
      expect(res.settings?.service_price).toBe(100000);
      expect(res.settings?.bank_info).toContain("MBBank");
    });

    it("updates electricity, water, service rates and bank info successfully", async () => {
      const updateRes = await updateSettings({
        electric_price: 4000,
        water_price: 30000,
        service_price: 120000,
        bank_info: "Vietcombank - 1234567890 - TRAN VAN B",
      });

      expect(updateRes.success).toBe(true);
      expect(updateRes.settings?.electric_price).toBe(4000);
      expect(updateRes.settings?.water_price).toBe(30000);
      expect(updateRes.settings?.service_price).toBe(120000);
      expect(updateRes.settings?.bank_info).toBe("Vietcombank - 1234567890 - TRAN VAN B");

      // Verify persistence
      const fetchRes = await getSettings();
      expect(fetchRes.settings?.electric_price).toBe(4000);
      expect(fetchRes.settings?.bank_info).toBe("Vietcombank - 1234567890 - TRAN VAN B");
    });
  });

  describe("Documentation & Environment Blueprint Verification", () => {
    it(".env.example contains all mandatory environment variables", () => {
      const envExample = fs.readFileSync(".env.example", "utf8");
      expect(envExample).toContain("ADMIN_PASSWORD");
      expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    });

    it("README.md provides complete setup, migration, build and testing guide in Vietnamese", () => {
      const readme = fs.readFileSync("README.md", "utf8");
      expect(readme).toContain("Web App Quản Lý Nhà Trọ");
      expect(readme).toContain("npm install");
      expect(readme).toContain("npm run dev");
      expect(readme).toContain("npm run build");
      expect(readme).toContain("npm test");
      expect(readme).toContain("20260826000000_init_schema.sql");
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory mock state so unit tests never touch the real production Supabase DB
const mockState: {
  settingsRow: Record<string, any>;
  roomsById: Record<string, Record<string, any>>;
  contractsList: Array<Record<string, any>>;
  simulateMissingContractTemplateCol: boolean;
  simulateMissingRoomContractSettingsCol: boolean;
} = {
  settingsRow: {
    id: 1,
    bank_info: "MB - 0901001079 - BUI THANH TUNG",
    contract_template: null,
  },
  roomsById: {},
  contractsList: [],
  simulateMissingContractTemplateCol: false,
  simulateMissingRoomContractSettingsCol: false,
};

vi.mock("../../src/lib/supabase/server.ts", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === "settings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { ...mockState.settingsRow },
                error: null,
              })),
            })),
          })),
          update: vi.fn((payload: Record<string, any>) => ({
            eq: vi.fn(async () => {
              if (
                "contract_template" in payload &&
                mockState.simulateMissingContractTemplateCol
              ) {
                return {
                  data: null,
                  error: {
                    code: "PGRST204",
                    message:
                      "Could not find the 'contract_template' column of 'settings' in the schema cache",
                  },
                };
              }
              Object.assign(mockState.settingsRow, payload);
              return { data: { ...mockState.settingsRow }, error: null };
            }),
          })),
        };
      }

      if (table === "rooms") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, roomId: string) => ({
              single: vi.fn(async () => ({
                data: mockState.roomsById[roomId]
                  ? { ...mockState.roomsById[roomId] }
                  : null,
                error: null,
              })),
            })),
          })),
          update: vi.fn((payload: Record<string, any>) => ({
            eq: vi.fn(async (_col: string, roomId: string) => {
              if (mockState.simulateMissingRoomContractSettingsCol) {
                return {
                  data: null,
                  error: {
                    code: "PGRST204",
                    message: "Could not find 'contract_settings' column",
                  },
                };
              }
              mockState.roomsById[roomId] = {
                ...(mockState.roomsById[roomId] || { id: roomId }),
                ...payload,
              };
              return { data: mockState.roomsById[roomId], error: null };
            }),
          })),
        };
      }

      if (table === "contracts") {
        return {
          select: vi.fn(() => {
            const filters: Record<string, any> = {};
            const builder: any = {
              eq: vi.fn((col: string, val: any) => {
                filters[col] = val;
                return builder;
              }),
              order: vi.fn(async () => {
                const matched = mockState.contractsList.filter((c) =>
                  Object.entries(filters).every(([k, v]) => c[k] === v)
                );
                return { data: matched, error: null };
              }),
              maybeSingle: vi.fn(async () => {
                const found =
                  mockState.contractsList.find((c) =>
                    Object.entries(filters).every(([k, v]) => c[k] === v)
                  ) || null;
                return { data: found, error: null };
              }),
            };
            return builder;
          }),
          insert: vi.fn(async (row: Record<string, any>) => {
            const created = {
              id: `contract-${mockState.contractsList.length + 1}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...row,
            };
            mockState.contractsList.push(created);
            return { data: created, error: null };
          }),
          update: vi.fn((payload: Record<string, any>) => ({
            eq: vi.fn(async (_col: string, id: string) => {
              const idx = mockState.contractsList.findIndex((c) => c.id === id);
              if (idx >= 0) {
                mockState.contractsList[idx] = {
                  ...mockState.contractsList[idx],
                  ...payload,
                };
              }
              return { data: mockState.contractsList[idx] || null, error: null };
            }),
          })),
        };
      }

      throw new Error(`Unexpected table in mock: ${table}`);
    }),
  })),
}));

import {
  DEFAULT_CONTRACT_TEMPLATE,
  ROOM_CONFIG_CONTRACT_TITLE,
  normalizeContractTemplate,
  interpolateContractText,
  createDefaultRentStages,
} from "../../src/lib/contracts/template.ts";
import {
  getContractTemplate,
  saveContractTemplate,
  getRoomContractConfig,
  saveRoomContractConfig,
  getContractsByRoom,
} from "../../src/actions/contracts.ts";

describe("Unit Test: Global Contract Template & Per-Room Contract Config", () => {
  beforeEach(() => {
    mockState.settingsRow = {
      id: 1,
      bank_info: "MB - 0901001079 - BUI THANH TUNG",
      contract_template: null,
    };
    mockState.roomsById = {
      "room-101": { id: "room-101", code: "P101", base_price: 3500000 },
    };
    mockState.contractsList = [];
    mockState.simulateMissingContractTemplateCol = false;
    mockState.simulateMissingRoomContractSettingsCol = false;
  });

  describe("1. Template Normalization & Variable Interpolation", () => {
    it("provides complete DEFAULT_CONTRACT_TEMPLATE and normalizes partial/invalid overrides safely", () => {
      expect(DEFAULT_CONTRACT_TEMPLATE.innName).toBe("Nhà trọ Anh Thư");
      expect(DEFAULT_CONTRACT_TEMPLATE.defaultLeaseMonths).toBe(12);
      expect(DEFAULT_CONTRACT_TEMPLATE.houseRules.length).toBeGreaterThan(5);

      const normalizedEmpty = normalizeContractTemplate(null);
      expect(normalizedEmpty).toEqual(DEFAULT_CONTRACT_TEMPLATE);

      const normalizedCustom = normalizeContractTemplate({
        innName: "  Nhà trọ Hoàng Thượng  ",
        defaultLeaseMonths: 6.4,
        defaultSignatureHeight: 999, // Out of [40, 240] range -> fallback to default 120
        houseRules: ["  Không nuôi chuột  ", "   "],
        legalBasis: [], // Empty array -> fallback to DEFAULT_CONTRACT_TEMPLATE.legalBasis
      });

      expect(normalizedCustom.innName).toBe("Nhà trọ Hoàng Thượng");
      expect(normalizedCustom.defaultLeaseMonths).toBe(6);
      expect(normalizedCustom.defaultSignatureHeight).toBe(
        DEFAULT_CONTRACT_TEMPLATE.defaultSignatureHeight
      );
      expect(normalizedCustom.houseRules).toEqual(["Không nuôi chuột"]);
      expect(normalizedCustom.legalBasis).toEqual(
        DEFAULT_CONTRACT_TEMPLATE.legalBasis
      );
    });

    it("interpolates {{TEN_NHA_TRO}}, {{MA_PHONG}}, {{DIEN_TICH}}, {{GIA_THUE}}, {{NGAY_THANH_TOAN}} accurately", () => {
      const sampleClause =
        "Chào mừng đến {{TEN_NHA_TRO}} - Phòng {{MA_PHONG}} ({{DIEN_TICH}}), giá {{GIA_THUE}}, đóng tiền vào {{NGAY_THANH_TOAN}}.";

      const output = interpolateContractText(sampleClause, {
        "{{TEN_NHA_TRO}}": "Nhà trọ Anh Thư",
        MA_PHONG: "P202",
        "{{DIEN_TICH}}": "35m2",
        GIA_THUE: "3.500.000 VNĐ",
        "{{NGAY_THANH_TOAN}}": "ngày 05 hàng tháng",
      });

      expect(output).toBe(
        "Chào mừng đến Nhà trọ Anh Thư - Phòng P202 (35m2), giá 3.500.000 VNĐ, đóng tiền vào ngày 05 hàng tháng."
      );
      expect(interpolateContractText("", { MA_PHONG: "P1" })).toBe("");
    });
  });

  describe("2. Global Contract Template Persistence (Column + bank_info Fallback)", () => {
    it("returns DEFAULT_CONTRACT_TEMPLATE when no custom template is stored", async () => {
      const { template, error } = await getContractTemplate();
      expect(error).toBeUndefined();
      expect(template).toEqual(DEFAULT_CONTRACT_TEMPLATE);
    });

    it("saves and loads template via contract_template column and embeds _contract_template in bank_info", async () => {
      const saveRes = await saveContractTemplate({
        innName: "Nhà trọ Bông Gòn",
        partyAName: "Chủ Trọ Mèo Trắng",
        defaultRoomArea: "40m2",
        paymentDueDay: "ngày 10 hàng tháng",
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.template.innName).toBe("Nhà trọ Bông Gòn");
      expect(saveRes.template.defaultRoomArea).toBe("40m2");

      // Verify explicit column was updated
      expect(mockState.settingsRow.contract_template.innName).toBe(
        "Nhà trọ Bông Gòn"
      );

      // Verify bank_info JSON also preserves payment account AND embeds _contract_template
      const parsedBank = JSON.parse(mockState.settingsRow.bank_info);
      expect(parsedBank.room.accountNumber).toBe("0901001079");
      expect(parsedBank._contract_template.innName).toBe("Nhà trọ Bông Gòn");

      const loaded = await getContractTemplate();
      expect(loaded.template.innName).toBe("Nhà trọ Bông Gòn");
      expect(loaded.template.paymentDueDay).toBe("ngày 10 hàng tháng");
    });

    it("falls back seamlessly to bank_info._contract_template when contract_template column is missing (PGRST204)", async () => {
      mockState.simulateMissingContractTemplateCol = true;

      const saveRes = await saveContractTemplate({
        innName: "Nhà trọ Fallback JSON",
        defaultLeaseMonths: 24,
      });

      expect(saveRes.success).toBe(true);
      expect(mockState.settingsRow.contract_template).toBeNull();

      const loaded = await getContractTemplate();
      expect(loaded.template.innName).toBe("Nhà trọ Fallback JSON");
      expect(loaded.template.defaultLeaseMonths).toBe(24);
    });
  });

  describe("3. Per-Room Contract Configuration & Filtering Internal Config Records", () => {
    it("saves and retrieves per-room contract config via rooms.contract_settings and fallback contracts record", async () => {
      // Simulate DB where rooms.contract_settings column is not migrated yet
      mockState.simulateMissingRoomContractSettingsCol = true;

      const saveRes = await saveRoomContractConfig("room-101", {
        roomArea: "  38m2  ",
        defaultLeaseMonths: 18,
        defaultDepositAmount: 4000000,
        furnitureDetails: ["  Máy lạnh Inverter  ", "", "Tủ lạnh 2 cánh"],
        specialTerms: ["  Được nuôi 1 bé mèo ngoan  "],
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.config).toEqual({
        roomArea: "38m2",
        defaultLeaseMonths: 18,
        defaultDepositAmount: 4000000,
        roomAddressOverride: undefined,
        furnitureDetails: ["Máy lạnh Inverter", "Tủ lạnh 2 cánh"],
        specialTerms: ["Được nuôi 1 bé mèo ngoan"],
      });

      // Should read back from the special record in `contracts`
      const loaded = await getRoomContractConfig("room-101");
      expect(loaded.config.roomArea).toBe("38m2");
      expect(loaded.config.defaultLeaseMonths).toBe(18);
      expect(loaded.config.furnitureDetails).toEqual([
        "Máy lạnh Inverter",
        "Tủ lạnh 2 cánh",
      ]);

      // Updating existing room config updates the same record without creating duplicates
      await saveRoomContractConfig("room-101", {
        roomArea: "45m2",
        defaultLeaseMonths: 12,
      });
      const configRecords = mockState.contractsList.filter(
        (c) => c.title === ROOM_CONFIG_CONTRACT_TITLE
      );
      expect(configRecords).toHaveLength(1);
      const reloaded = await getRoomContractConfig("room-101");
      expect(reloaded.config.roomArea).toBe("45m2");
    });

    it("filters out internal __ROOM_CONTRACT_CONFIG__ record when listing room contracts via getContractsByRoom", async () => {
      // 1. Save room config (creates internal record with title = ROOM_CONFIG_CONTRACT_TITLE)
      await saveRoomContractConfig("room-101", {
        roomArea: "30m2",
      });

      // 2. Add two real tenant contracts for room-101
      mockState.contractsList.push(
        {
          id: "real-contract-1",
          room_id: "room-101",
          tenant_name: "Nguyễn Văn A",
          title: "Hợp đồng thuê phòng P101 - Nguyễn Văn A",
          html_content: "<p>Hợp đồng 1</p>",
          status: "signed",
          updated_at: "2026-11-10T10:00:00.000Z",
        },
        {
          id: "real-contract-2",
          room_id: "room-101",
          tenant_name: "Trần Thị B",
          title: "Hợp đồng thuê phòng P101 - Trần Thị B",
          html_content: "<p>Hợp đồng 2</p>",
          status: "draft",
          updated_at: "2026-11-12T10:00:00.000Z",
        }
      );

      const { contracts, error } = await getContractsByRoom("room-101");
      expect(error).toBeUndefined();
      expect(contracts).toHaveLength(2);
      expect(
        contracts.some((c) => c.title === ROOM_CONFIG_CONTRACT_TITLE)
      ).toBe(false);
      expect(contracts.map((c) => c.id)).toEqual([
        "real-contract-1",
        "real-contract-2",
      ]);
    });

    it("creates default rent stages (6 months discounted, remaining standard)", () => {
      const stages = createDefaultRentStages(3200000, 12, 6, 2800000);
      expect(stages).toHaveLength(2);
      expect(stages[0].label).toBe("06 tháng đầu");
      expect(stages[0].months).toBe(6);
      expect(stages[0].price).toBe(2800000);
      expect(stages[0].note).toBe("Giá ưu đãi thời gian đầu");

      expect(stages[1].label).toBe("06 tháng tiếp theo");
      expect(stages[1].months).toBe(6);
      expect(stages[1].price).toBe(3200000);
      expect(stages[1].note).toBe("Đúng giá chuẩn theo hợp đồng");
    });

    it("saves and retrieves enableStagedPricing and rentStages in per-room contract config", async () => {
      const stages = [
        { id: "s1", label: "06 tháng đầu", months: 6, price: 3000000, note: "Ưu đãi" },
        { id: "s2", label: "06 tháng sau", months: 6, price: 3500000, note: "Giá chuẩn" },
      ];

      const saveRes = await saveRoomContractConfig("room-staged-1", {
        roomArea: "32m2",
        enableStagedPricing: true,
        rentStages: stages,
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.config.enableStagedPricing).toBe(true);
      expect(saveRes.config.rentStages).toHaveLength(2);

      const getRes = await getRoomContractConfig("room-staged-1");
      expect(getRes.config.enableStagedPricing).toBe(true);
      expect(getRes.config.rentStages?.[0].price).toBe(3000000);
      expect(getRes.config.rentStages?.[1].price).toBe(3500000);
    });
  });
});

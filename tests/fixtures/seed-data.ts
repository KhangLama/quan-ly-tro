/**
 * Test Fixtures & In-Memory Supabase Mock Engine
 * Strictly aligned with PROJECT.md Interface Contracts & Schema.
 */

export interface SettingRecord {
  id: number;
  electric_price: number;
  water_price: number;
  service_price: number;
  bank_info: string;
  updated_at: string;
}

export type RoomStatus = "rented" | "empty";

export interface RoomRecord {
  id: string;
  code: string;
  base_price: number;
  status: RoomStatus;
  created_at: string;
}

export type TenantStatus = "active" | "moved_out";

export interface TenantRecord {
  id: string;
  room_id: string;
  name: string;
  phone: string;
  cccd: string;
  is_lead: boolean;
  start_date: string;
  end_date: string | null;
  deposit_amount: number;
  status: TenantStatus;
  created_at: string;
}

export type InvoiceStatus = "pending" | "paid";

export interface InvoiceRecord {
  id: string;
  room_id: string;
  month: string; // 'YYYY-MM'
  old_electric: number;
  new_electric: number;
  old_water: number;
  new_water: number;
  base_price: number;
  electric_price: number;
  water_price: number;
  service_price: number;
  total_amount: number;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
}

export interface CalculationInput {
  basePrice: number;
  oldElectric: number;
  newElectric: number;
  oldWater: number;
  newWater: number;
  electricPrice: number;
  waterPrice: number;
  servicePrice: number;
}

export interface CalculationResult {
  electricUsage: number;
  waterUsage: number;
  electricCost: number;
  waterCost: number;
  servicePrice: number;
  basePrice: number;
  totalAmount: number;
}

/**
 * Initial Default Setting Seed Row (R1 Requirement)
 */
export const DEFAULT_SETTING: SettingRecord = {
  id: 1,
  electric_price: 3500,
  water_price: 25000,
  service_price: 100000,
  bank_info: "MB Bank - 0987654321 - NGUYEN VAN A",
  updated_at: "2026-08-01T00:00:00Z",
};

/**
 * 10 Standard Rental Rooms (Floor 1: P101-P105, Floor 2: P201-P205)
 */
export const INITIAL_ROOMS: RoomRecord[] = [
  { id: "room-101", code: "P101", base_price: 2500000, status: "rented", created_at: "2026-08-01T00:00:00Z" },
  { id: "room-102", code: "P102", base_price: 2500000, status: "rented", created_at: "2026-08-01T00:00:00Z" },
  { id: "room-103", code: "P103", base_price: 2800000, status: "rented", created_at: "2026-08-01T00:00:00Z" },
  { id: "room-104", code: "P104", base_price: 2800000, status: "rented", created_at: "2026-08-01T00:00:00Z" },
  { id: "room-105", code: "P105", base_price: 3000000, status: "empty",  created_at: "2026-08-01T00:00:00Z" },
  { id: "room-201", code: "P201", base_price: 3200000, status: "rented", created_at: "2026-08-01T00:00:00Z" },
  { id: "room-202", code: "P202", base_price: 3200000, status: "rented", created_at: "2026-08-01T00:00:00Z" },
  { id: "room-203", code: "P203", base_price: 3500000, status: "rented", created_at: "2026-08-01T00:00:00Z" },
  { id: "room-204", code: "P204", base_price: 3500000, status: "rented", created_at: "2026-08-01T00:00:00Z" },
  { id: "room-205", code: "P205", base_price: 4000000, status: "empty",  created_at: "2026-08-01T00:00:00Z" },
];

/**
 * Initial Tenants Dataset (8 Active Residents, 2 Empty Rooms initially)
 */
export const INITIAL_TENANTS: TenantRecord[] = [
  {
    id: "tenant-101-1",
    room_id: "room-101",
    name: "Nguyễn Văn Hùng",
    phone: "0901111111",
    cccd: "001090001111",
    is_lead: true,
    start_date: "2026-01-01",
    end_date: null,
    deposit_amount: 2500000,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "tenant-102-1",
    room_id: "room-102",
    name: "Trần Thị Mai",
    phone: "0902222222",
    cccd: "001090002222",
    is_lead: true,
    start_date: "2026-02-01",
    end_date: null,
    deposit_amount: 2500000,
    status: "active",
    created_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "tenant-103-1",
    room_id: "room-103",
    name: "Lê Hoàng Nam",
    phone: "0903333333",
    cccd: "001090003333",
    is_lead: true,
    start_date: "2026-03-01",
    end_date: null,
    deposit_amount: 2800000,
    status: "active",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "tenant-104-1",
    room_id: "room-104",
    name: "Phạm Thu Hà",
    phone: "0904444444",
    cccd: "001090004444",
    is_lead: true,
    start_date: "2026-04-01",
    end_date: null,
    deposit_amount: 2800000,
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "tenant-201-1",
    room_id: "room-201",
    name: "Võ Minh Trí",
    phone: "0905555555",
    cccd: "001090005555",
    is_lead: true,
    start_date: "2026-05-01",
    end_date: null,
    deposit_amount: 3200000,
    status: "active",
    created_at: "2026-05-01T00:00:00Z",
  },
  {
    id: "tenant-202-1",
    room_id: "room-202",
    name: "Đặng Quốc Bảo",
    phone: "0906666666",
    cccd: "001090006666",
    is_lead: true,
    start_date: "2026-06-01",
    end_date: null,
    deposit_amount: 3200000,
    status: "active",
    created_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "tenant-203-1",
    room_id: "room-203",
    name: "Bùi Thị Lan",
    phone: "0907777777",
    cccd: "001090007777",
    is_lead: true,
    start_date: "2026-07-01",
    end_date: null,
    deposit_amount: 3500000,
    status: "active",
    created_at: "2026-07-01T00:00:00Z",
  },
  {
    id: "tenant-204-1",
    room_id: "room-204",
    name: "Đỗ Thành Long",
    phone: "0908888888",
    cccd: "001090008888",
    is_lead: true,
    start_date: "2026-08-01",
    end_date: null,
    deposit_amount: 3500000,
    status: "active",
    created_at: "2026-08-01T00:00:00Z",
  },
];

/**
 * In-Memory Mock Database Engine replicating Supabase PostgREST Query Builder
 */
export class MockSupabaseEngine {
  public settings: SettingRecord[] = [];
  public rooms: RoomRecord[] = [];
  public tenants: TenantRecord[] = [];
  public invoices: InvoiceRecord[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.settings = [JSON.parse(JSON.stringify(DEFAULT_SETTING))];
    this.rooms = JSON.parse(JSON.stringify(INITIAL_ROOMS));
    this.tenants = JSON.parse(JSON.stringify(INITIAL_TENANTS));
    this.invoices = [];
  }

  public from(tableName: "settings" | "rooms" | "tenants" | "invoices") {
    return new MockQueryBuilder(this, tableName);
  }
}

class MockQueryBuilder {
  private db: MockSupabaseEngine;
  private tableName: "settings" | "rooms" | "tenants" | "invoices";
  private action: "select" | "insert" | "update" | "delete" = "select";
  private insertData: any = null;
  private updateData: any = null;
  private filters: Array<(row: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(db: MockSupabaseEngine, tableName: "settings" | "rooms" | "tenants" | "invoices") {
    this.db = db;
    this.tableName = tableName;
  }

  select(_columns = "*") {
    if (this.action !== "insert" && this.action !== "update" && this.action !== "delete") {
      this.action = "select";
    }
    return this;
  }

  insert(data: any | any[]) {
    this.action = "insert";
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.updateData = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push((row: any) => row[field] === value);
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push((row: any) => row[field] !== value);
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push((row: any) => values.includes(row[field]));
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private async execute(): Promise<{ data: any; error: any }> {
    const tableData = this.db[this.tableName] as any[];

    if (this.action === "insert") {
      const records = Array.isArray(this.insertData) ? this.insertData : [this.insertData];

      for (const item of records) {
        const newRecord = {
          id: item.id || `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          created_at: item.created_at || new Date().toISOString(),
          ...item,
        };

        // Uniqueness check for room code
        if (this.tableName === "rooms") {
          if (tableData.some((r) => r.code === newRecord.code && r.id !== newRecord.id)) {
            return { data: null, error: { message: `Room code '${newRecord.code}' already exists.` } };
          }
        }

        // Uniqueness check for invoice (room_id, month)
        if (this.tableName === "invoices") {
          if (tableData.some((inv) => inv.room_id === newRecord.room_id && inv.month === newRecord.month && inv.id !== newRecord.id)) {
            return { data: null, error: { message: `Invoice for room_id and month '${newRecord.month}' already exists.` } };
          }
        }

        tableData.push(newRecord);
      }

      return {
        data: Array.isArray(this.insertData) ? records : records[0],
        error: null,
      };
    }

    if (this.action === "update") {
      const matching = tableData.filter((row) => this.filters.every((f) => f(row)));
      for (const row of matching) {
        Object.assign(row, this.updateData, { updated_at: new Date().toISOString() });
      }

      return {
        data: this.isSingle ? matching[0] : matching,
        error: null,
      };
    }

    if (this.action === "delete") {
      const toKeep: any[] = [];
      const deleted: any[] = [];

      for (const row of tableData) {
        if (this.filters.every((f) => f(row))) {
          deleted.push(row);
        } else {
          toKeep.push(row);
        }
      }

      (this.db as any)[this.tableName] = toKeep;

      return {
        data: deleted,
        error: null,
      };
    }

    // Default: SELECT
    let list = [...tableData];

    // Apply filters
    for (const filter of this.filters) {
      list = list.filter(filter);
    }

    // Apply sorting
    if (this.orderField) {
      const field = this.orderField;
      const asc = this.orderAscending;
      list.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      list = list.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      if (list.length === 0) {
        return { data: null, error: { message: "Row not found", code: "PGRST116" } };
      }
      return { data: list[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: list.length > 0 ? list[0] : null, error: null };
    }

    return { data: list, error: null };
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const result = await this.execute();
    if (onfulfilled) {
      return onfulfilled(result);
    }
    return result as any;
  }
}

/**
 * Standard Mathematical Oracle / Calculation function per PROJECT.md
 */
export function calculateInvoice(input: CalculationInput): CalculationResult {
  const electricUsage = Math.max(0, input.newElectric - input.oldElectric);
  const waterUsage = Math.max(0, input.newWater - input.oldWater);
  const electricCost = Math.round(electricUsage * input.electricPrice);
  const waterCost = Math.round(waterUsage * input.waterPrice);
  const servicePrice = Math.round(input.servicePrice);
  const basePrice = Math.round(input.basePrice);
  const totalAmount = basePrice + electricCost + waterCost + servicePrice;

  return {
    electricUsage,
    waterUsage,
    electricCost,
    waterCost,
    servicePrice,
    basePrice,
    totalAmount,
  };
}

/**
 * Standard Zalo Template builder per PROJECT.md
 */
export function buildZaloMessage(params: {
  roomCode: string;
  month: string;
  totalAmount: number;
  electricUsage: number;
  electricCost: number;
  waterUsage: number;
  waterCost: number;
  serviceCost: number;
}): string {
  const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
  return `Phòng ${params.roomCode} - Tiền tháng ${params.month}: Tổng ${fmt(params.totalAmount)}đ (Điện: ${params.electricUsage} số = ${fmt(params.electricCost)}đ | Nước: ${params.waterUsage} m³ = ${fmt(params.waterCost)}đ | Dịch vụ: ${fmt(params.serviceCost)}đ). Vui lòng thanh toán trước ngày 05. Xin cảm ơn!`;
}

/**
 * Web Crypto HMAC-SHA256 Session Helper per PROJECT.md
 */
export async function signSessionToken(timestamp: number, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    enc.encode(timestamp.toString())
  );
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${timestamp}.${signatureHex}`;
}

export async function verifySessionToken(
  token: string | null | undefined,
  secret: string,
  maxAgeMs = 7 * 24 * 60 * 60 * 1000 // 7 days default
): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [tsStr, signatureHex] = parts;
  const ts = parseInt(tsStr, 10);
  if (isNaN(ts)) return false;

  // Check expiration
  const now = Date.now();
  if (now - ts > maxAgeMs || ts > now + 60000) {
    return false; // Expired or future timestamp beyond 1 min clock skew
  }

  const expectedToken = await signSessionToken(ts, secret);
  return token === expectedToken;
}

import type { Setting, Room, Tenant, Invoice } from "../../types/index.ts";

export interface MockDatabaseState {
  settings: Setting[];
  rooms: Room[];
  tenants: Tenant[];
  invoices: Invoice[];
}

const DEFAULT_SETTINGS: Setting = {
  id: 1,
  electric_price: 3500,
  water_price: 25000,
  service_price: 100000,
  bank_info: "MBBank - 0987654321 - NGUYEN VAN A",
  updated_at: new Date().toISOString(),
};

const INITIAL_ROOMS: Room[] =
  process.env.NODE_ENV === "test"
    ? []
    : [
        {
          id: "room-1",
          code: "P101",
          base_price: 3200000,
          status: "rented",
          created_at: new Date().toISOString(),
        },
        {
          id: "room-2",
          code: "P102",
          base_price: 3500000,
          status: "rented",
          created_at: new Date().toISOString(),
        },
        {
          id: "room-3",
          code: "P103",
          base_price: 2800000,
          status: "empty",
          created_at: new Date().toISOString(),
        },
        {
          id: "room-4",
          code: "P201",
          base_price: 3000000,
          status: "empty",
          created_at: new Date().toISOString(),
        },
      ];

const INITIAL_TENANTS: Tenant[] =
  process.env.NODE_ENV === "test"
    ? []
    : [
        {
          id: "tenant-1",
          room_id: "room-1",
          name: "Nguyễn Văn An",
          phone: "0901234567",
          cccd: "001090001234",
          is_lead: true,
          start_date: "2026-06-01",
          end_date: null,
          deposit_amount: 3200000,
          status: "active",
          created_at: new Date().toISOString(),
        },
        {
          id: "tenant-2",
          room_id: "room-2",
          name: "Trần Thị Bình",
          phone: "0912345678",
          cccd: "001090005678",
          is_lead: true,
          start_date: "2026-07-01",
          end_date: null,
          deposit_amount: 3500000,
          status: "active",
          created_at: new Date().toISOString(),
        },
      ];

class MockDatabase {
  private state: MockDatabaseState = {
    settings: [{ ...DEFAULT_SETTINGS }],
    rooms: [...INITIAL_ROOMS],
    tenants: [...INITIAL_TENANTS],
    invoices: [],
  };

  public reset(initialState?: Partial<MockDatabaseState>) {
    this.state = {
      settings: initialState?.settings
        ? [...initialState.settings]
        : [{ ...DEFAULT_SETTINGS }],
      rooms: initialState?.rooms ? [...initialState.rooms] : [],
      tenants: initialState?.tenants ? [...initialState.tenants] : [],
      invoices: initialState?.invoices ? [...initialState.invoices] : [],
    };
  }

  public getState(): MockDatabaseState {
    return this.state;
  }

  public getTable<T extends keyof MockDatabaseState>(table: T): MockDatabaseState[T] {
    return this.state[table];
  }
}

export const mockDbStore = new MockDatabase();

type TableName = keyof MockDatabaseState;

interface FilterOp {
  column: string;
  op: "eq" | "neq" | "in" | "is";
  value: any;
}

interface OrderOp {
  column: string;
  ascending: boolean;
}

export class MockQueryBuilder<T = any> implements PromiseLike<{ data: T | null; error: any; count?: number }> {
  private tableName: TableName;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private selectColumns: string = "*";
  private insertPayload: any = null;
  private updatePayload: any = null;
  private filters: FilterOp[] = [];
  private orderOps: OrderOp[] = [];
  private limitCount?: number;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(tableName: TableName) {
    this.tableName = tableName;
  }

  public select(columns: string = "*") {
    if (this.action !== "insert" && this.action !== "update") {
      this.action = "select";
    }
    this.selectColumns = columns;
    return this;
  }

  public insert(values: any) {
    this.action = "insert";
    this.insertPayload = values;
    return this;
  }

  public update(values: any) {
    this.action = "update";
    this.updatePayload = values;
    return this;
  }

  public delete() {
    this.action = "delete";
    return this;
  }

  public eq(column: string, value: any) {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  public neq(column: string, value: any) {
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  public in(column: string, values: any[]) {
    this.filters.push({ column, op: "in", value: values });
    return this;
  }

  public is(column: string, value: any) {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  public order(column: string, options?: { ascending?: boolean }) {
    this.orderOps.push({
      column,
      ascending: options?.ascending !== false,
    });
    return this;
  }

  public limit(count: number) {
    this.limitCount = count;
    return this;
  }

  public single() {
    this.isSingle = true;
    return this;
  }

  public maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private applyFilters(items: any[]): any[] {
    return items.filter((item) => {
      for (const filter of this.filters) {
        const itemVal = item[filter.column];
        if (filter.op === "eq") {
          if (itemVal !== filter.value) return false;
        } else if (filter.op === "neq") {
          if (itemVal === filter.value) return false;
        } else if (filter.op === "in") {
          if (!Array.isArray(filter.value) || !filter.value.includes(itemVal)) return false;
        } else if (filter.op === "is") {
          if (filter.value === null) {
            if (itemVal !== null && itemVal !== undefined) return false;
          } else {
            if (itemVal !== filter.value) return false;
          }
        }
      }
      return true;
    });
  }

  private applyOrders(items: any[]): any[] {
    if (this.orderOps.length === 0) return items;
    return [...items].sort((a, b) => {
      for (const ord of this.orderOps) {
        const valA = a[ord.column];
        const valB = b[ord.column];
        if (valA < valB) return ord.ascending ? -1 : 1;
        if (valA > valB) return ord.ascending ? 1 : -1;
      }
      return 0;
    });
  }

  private execute(): { data: any; error: any; count?: number } {
    const tableData = mockDbStore.getTable(this.tableName) as any[];

    if (this.action === "insert") {
      const itemsToInsert = Array.isArray(this.insertPayload)
        ? this.insertPayload
        : [this.insertPayload];

      const insertedItems = itemsToInsert.map((item) => {
        const id = item.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `mock-${Date.now()}-${Math.random()}`);
        const now = new Date().toISOString();
        const fullItem = {
          ...item,
          id: item.id !== undefined ? item.id : id,
          created_at: item.created_at || now,
          updated_at: item.updated_at || now,
        };

        // Singleton constraint check for settings
        if (this.tableName === "settings" && fullItem.id !== 1) {
          throw new Error("violates check constraint singleton_check");
        }

        // Unique constraint check for rooms (code)
        if (this.tableName === "rooms") {
          const exists = tableData.some((r) => r.code === fullItem.code && r.id !== fullItem.id);
          if (exists) {
            throw new Error(`duplicate key value violates unique constraint on code: ${fullItem.code}`);
          }
        }

        // Unique constraint check for invoices (room_id, month)
        if (this.tableName === "invoices") {
          const exists = tableData.some((inv) => inv.room_id === fullItem.room_id && inv.month === fullItem.month && inv.id !== fullItem.id);
          if (exists) {
            throw new Error(`duplicate key value violates unique constraint on (room_id, month)`);
          }
        }

        tableData.push(fullItem);
        return fullItem;
      });

      if (this.isSingle || (!Array.isArray(this.insertPayload) && this.selectColumns !== "*")) {
        return { data: insertedItems[0] || null, error: null };
      }
      return { data: Array.isArray(this.insertPayload) ? insertedItems : insertedItems[0], error: null };
    }

    if (this.action === "update") {
      const matched = this.applyFilters(tableData);
      const updated: any[] = [];

      for (const item of matched) {
        Object.assign(item, this.updatePayload);
        if (item.updated_at !== undefined) {
          item.updated_at = new Date().toISOString();
        }
        updated.push({ ...item });
      }

      if (this.isSingle) {
        return { data: updated[0] || null, error: null };
      }
      return { data: updated, error: null };
    }

    if (this.action === "delete") {
      const matched = this.applyFilters(tableData);
      const matchedIds = new Set(matched.map((m) => m.id));
      const filtered = tableData.filter((item) => !matchedIds.has(item.id));
      
      // Cascade delete simulation
      if (this.tableName === "rooms") {
        const tenants = mockDbStore.getTable("tenants") as Tenant[];
        const invoices = mockDbStore.getTable("invoices") as Invoice[];
        mockDbStore.reset({
          rooms: filtered,
          tenants: tenants.filter((t) => !matchedIds.has(t.room_id)),
          invoices: invoices.filter((i) => !matchedIds.has(i.room_id)),
        });
      } else {
        (mockDbStore.getState() as any)[this.tableName] = filtered;
      }

      return { data: matched, error: null };
    }

    // Default: SELECT
    let result = this.applyFilters(tableData);
    result = this.applyOrders(result);

    if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      if (result.length === 0) {
        return { data: null, error: { message: "Row not found", code: "PGRST116" } };
      }
      return { data: { ...result[0] }, error: null };
    }

    if (this.isMaybeSingle) {
      return { data: result.length > 0 ? { ...result[0] } : null, error: null };
    }

    return { data: result.map((r) => ({ ...r })), error: null };
  }

  public then<TResult1 = { data: T | null; error: any; count?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const res = this.execute();
      return Promise.resolve(res as any).then(onfulfilled, onrejected);
    } catch (err: any) {
      return Promise.resolve({ data: null, error: err } as any).then(onfulfilled, onrejected);
    }
  }
}

export function createMockSupabaseClient() {
  return {
    from: <T = any>(table: TableName) => new MockQueryBuilder<T>(table),
  };
}

export const mockSupabase = createMockSupabaseClient();

import type { Database } from "./database.ts";

// Database row shortcuts
export type Setting = Database["public"]["Tables"]["settings"]["Row"] & {
  furniture_catalog?: string[];
};
export type SettingInsert = Database["public"]["Tables"]["settings"]["Insert"];
export type SettingUpdate = Database["public"]["Tables"]["settings"]["Update"] & {
  furniture_catalog?: string[];
};

export type Room = Database["public"]["Tables"]["rooms"]["Row"] & {
  furniture?: string[];
  note?: string;
};
export type RoomInsert = Database["public"]["Tables"]["rooms"]["Insert"] & {
  furniture?: string[];
  note?: string;
};
export type RoomUpdate = Database["public"]["Tables"]["rooms"]["Update"] & {
  furniture?: string[];
  note?: string;
};

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantInsert = Database["public"]["Tables"]["tenants"]["Insert"];
export type TenantUpdate = Database["public"]["Tables"]["tenants"]["Update"];

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];

export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
export type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];

// Status types
export type RoomStatus = "rented" | "empty";
export type TenantStatus = "active" | "moved_out";
export type InvoiceStatus = "pending" | "paid";
export type ExpenseStatus = "pending" | "paid";

// Extended Room type with relations
export interface RoomWithDetails extends Room {
  activeTenants: Tenant[];
  leadTenant?: Tenant | null;
  latestInvoice?: Invoice | null;
}

// Invoice calculation types
export interface CalculationInput {
  basePrice: number;
  oldElectric: number;
  newElectric: number;
  oldWater: number;
  newWater: number;
  electricPrice: number;
  waterPrice: number;
  servicePrice: number;
  discount?: number;
}

export interface CalculationResult {
  electricUsage: number;
  waterUsage: number;
  electricCost: number;
  waterCost: number;
  servicePrice: number;
  basePrice: number;
  discount: number;
  totalAmount: number;
}

// Dashboard statistics
export interface DashboardStats {
  currentMonth: string;
  totalRevenue: number;
  collectedAmount: number;
  pendingAmount: number;
  totalRooms: number;
  rentedRooms: number;
  emptyRooms: number;
  occupancyRate: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  netProfit: number;
  actualCashflow: number;
}

// Zalo template parameter type
export interface ZaloMessageParams {
  roomCode: string;
  month: string;
  totalAmount: number;
  electricUsage: number;
  electricCost: number;
  waterUsage: number;
  waterCost: number;
  serviceCost: number;
}

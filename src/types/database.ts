export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: number;
          electric_price: number;
          water_price: number;
          service_price: number;
          bank_info: string;
          address?: string;
          service_description?: string;
          receipt_note?: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          electric_price?: number;
          water_price?: number;
          service_price?: number;
          bank_info?: string;
          address?: string;
          service_description?: string;
          receipt_note?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          electric_price?: number;
          water_price?: number;
          service_price?: number;
          bank_info?: string;
          address?: string;
          service_description?: string;
          receipt_note?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          code: string;
          base_price: number;
          status: "rented" | "empty";
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          base_price?: number;
          status?: "rented" | "empty";
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          base_price?: number;
          status?: "rented" | "empty";
          created_at?: string;
        };
      };
      tenants: {
        Row: {
          id: string;
          room_id: string;
          name: string;
          phone: string | null;
          cccd: string | null;
          is_lead: boolean;
          start_date: string;
          end_date: string | null;
          deposit_amount: number;
          status: "active" | "moved_out";
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          name: string;
          phone?: string | null;
          cccd?: string | null;
          is_lead?: boolean;
          start_date?: string;
          end_date?: string | null;
          deposit_amount?: number;
          status?: "active" | "moved_out";
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          name?: string;
          phone?: string | null;
          cccd?: string | null;
          is_lead?: boolean;
          start_date?: string;
          end_date?: string | null;
          deposit_amount?: number;
          status?: "active" | "moved_out";
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          room_id: string;
          month: string;
          old_electric: number;
          new_electric: number;
          old_water: number;
          new_water: number;
          base_price: number;
          electric_price: number;
          water_price: number;
          service_price: number;
          discount?: number;
          discount_reason?: string;
          total_amount: number;
          status: "pending" | "paid";
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          month: string;
          old_electric?: number;
          new_electric?: number;
          old_water?: number;
          new_water?: number;
          base_price?: number;
          electric_price?: number;
          water_price?: number;
          service_price?: number;
          discount?: number;
          discount_reason?: string;
          total_amount?: number;
          status?: "pending" | "paid";
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          month?: string;
          old_electric?: number;
          new_electric?: number;
          old_water?: number;
          new_water?: number;
          base_price?: number;
          electric_price?: number;
          water_price?: number;
          service_price?: number;
          discount?: number;
          discount_reason?: string;
          total_amount?: number;
          status?: "pending" | "paid";
          paid_at?: string | null;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          month: string;
          date: string;
          item_name: string;
          category: string;
          status: "pending" | "paid";
          unit_price: number;
          quantity: number;
          total_amount: number;
          notes?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          month: string;
          date: string;
          item_name: string;
          category?: string;
          status?: "pending" | "paid";
          unit_price?: number;
          quantity?: number;
          total_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          month?: string;
          date?: string;
          item_name?: string;
          category?: string;
          status?: "pending" | "paid";
          unit_price?: number;
          quantity?: number;
          total_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

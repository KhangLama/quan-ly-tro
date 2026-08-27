import { createBrowserClient } from "@supabase/ssr";
import { createMockSupabaseClient, mockSupabase } from "./mock-db.ts";
import { Database } from "@/types/database";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (
    process.env.NEXT_PUBLIC_USE_MOCK_DB === "true" ||
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("mock.supabase.co") ||
    process.env.NODE_ENV === "test"
  ) {
    return mockSupabase as any;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

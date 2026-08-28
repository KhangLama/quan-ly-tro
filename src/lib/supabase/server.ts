import { createMockSupabaseClient, mockSupabase } from "./mock-db.ts";
import type { Database } from "../../types/database.ts";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Only use mock DB when explicitly enabled OR in test env
  const useMock =
    process.env.NEXT_PUBLIC_USE_MOCK_DB === "true" ||
    process.env.USE_MOCK_DB === "true" ||
    process.env.NODE_ENV === "test";

  if (useMock) {
    return mockSupabase as any;
  }

  // If not mock mode, Supabase credentials are REQUIRED
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Set these env vars or enable NEXT_PUBLIC_USE_MOCK_DB=true."
    );
    throw new Error("Missing Supabase credentials");
  }

  const { createServerClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");
  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set({ name, value, ...options })
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });
}

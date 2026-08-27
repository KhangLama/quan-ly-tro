import { createMockSupabaseClient, mockSupabase } from "./mock-db.ts";
import type { Database } from "../../types/database.ts";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (
    process.env.NEXT_PUBLIC_USE_MOCK_DB === "true" ||
    process.env.USE_MOCK_DB === "true" ||
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("mock.supabase.co") ||
    process.env.NODE_ENV === "test"
  ) {
    return mockSupabase as any;
  }

  try {
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
  } catch {
    return mockSupabase as any;
  }
}

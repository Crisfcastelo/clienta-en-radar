import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/env";
import { sessionCookieOptions } from "./cookies";

/** Cliente de Supabase con la sesión de la usuaria: todo lo que hace pasa por RLS. */
export async function createSupabaseServerClient() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Desde un Server Component no se pueden escribir cookies; proxy.ts ya refresca la sesión.
        }
      },
    },
  });
}

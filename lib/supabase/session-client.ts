import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./public-env";

/**
 * Server client acting as the signed-in user (their session cookie), so Postgres RLS applies to
 * every query. Create one per request; never share it across requests.
 */
export async function getSupabaseSessionClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies. Fine: proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}

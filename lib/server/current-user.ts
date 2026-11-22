import "server-only";
import { getSupabaseSessionClient } from "@/lib/supabase/session-client";

export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "NotSignedInError";
  }
}

/**
 * The one place that decides who the request is acting for: the user in the verified session.
 * proxy.ts already keeps signed-out requests away, so this throwing means a bug, not a visitor.
 */
export async function getCurrentUserId(): Promise<string> {
  const supabase = await getSupabaseSessionClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new NotSignedInError();
  return userId;
}

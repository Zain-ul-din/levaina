"use server";

import { getSupabaseSessionClient } from "@/lib/supabase/session-client";
import { redirect } from "next/navigation";

/** Ends the session on this device (clears the cookies) and returns to the sign-in screen. */
export async function signOut() {
  const supabase = await getSupabaseSessionClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

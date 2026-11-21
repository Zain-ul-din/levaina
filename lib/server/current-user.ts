import "server-only";
import { getServerEnv } from "./env";

/**
 * The one place that decides who the request is acting for.
 * Phase 0: a fixed, seeded owner. With real auth, read the session here instead;
 * nothing else needs to change.
 */
export async function getCurrentUserId(): Promise<string> {
  return getServerEnv().OWNER_USER_ID;
}

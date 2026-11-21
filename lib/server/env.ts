import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  OWNER_USER_ID: z.uuid(),
});

let cached: z.infer<typeof serverEnvSchema> | undefined;

/** Validated server-only env vars. Fails loudly on first use if something is missing. */
export function getServerEnv() {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}

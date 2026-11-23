/**
 * Runs once when the server starts (Next.js instrumentation hook). Registers Laminar as the AI SDK's
 * telemetry, so every model call (coach replies, conversation summaries) is traced over
 * OpenTelemetry. Reads LMNR_PROJECT_API_KEY from the environment (Next.js loads .env itself).
 *
 * Node.js only: OpenTelemetry needs Node APIs, so the Edge runtime is skipped.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerTelemetry } = await import("ai");
  const { LaminarAiSdkTelemetry } = await import("@lmnr-ai/lmnr");
  registerTelemetry(new LaminarAiSdkTelemetry());
}

/**
 * Who an AI call belongs to, for tracing (Laminar, registered in instrumentation.ts).
 * userId is the account's id (never the email); sessionId is the chat, so a whole conversation
 * reads as one session in Laminar.
 */
export type TraceContext = { userId: string; sessionId: string };

/**
 * Telemetry settings to spread into an AI SDK call: a stable name for the call (low cardinality:
 * never put ids in it) and, when known, the user and chat. Only these two keys of the runtime
 * context are sent; anything else in it stays in the app.
 */
export function traced(functionId: string, context?: TraceContext) {
  return {
    runtimeContext: context ?? {},
    telemetry: { functionId, includeRuntimeContext: { userId: true, sessionId: true } },
  };
}

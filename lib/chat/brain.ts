import { LOG_ADD_TOOL_TYPES, type ChatMessagePart, type UsedMemory } from "./types";

/** Parts that show the coach's working (thinking, tool calls), as opposed to the answer itself. */
export function isBrainPart(part: ChatMessagePart): boolean {
  return part.type === "reasoning" || part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

export type BrainSummary = {
  thinkingMs: number;
  saved: number;
  updated: number;
  forgotten: number;
  logged: number;
  memoriesUsed: number;
  /** False when the Brain would only contain invisible work (empty thoughts, "nothing new" checks). */
  hasContent: boolean;
};

const DONE = "output-available";
const ok = (part: ChatMessagePart) =>
  "state" in part && part.state === DONE && !(part.output && typeof part.output === "object" && "error" in part.output);

export function summarizeBrain(parts: ChatMessagePart[], durations: number[], usedMemories: UsedMemory[]): BrainSummary {
  const count = (type: string) => parts.filter((p) => p.type === type && ok(p)).length;
  const saved = count("tool-saveMemory"), updated = count("tool-updateMemory"), forgotten = count("tool-forgetMemory");
  const visibleThought = parts.some((p) => p.type === "reasoning" && p.text.trim());
  const logged = parts.filter((p) => (LOG_ADD_TOOL_TYPES as readonly string[]).includes(p.type) && ok(p)).length;
  const memoryWork = parts.some((p) => p.type === "tool-saveMemory" || p.type === "tool-updateMemory" || p.type === "tool-forgetMemory");
  const logWork = parts.some((p) => p.type.startsWith("tool-log") || p.type === "tool-removeLogEntry");
  return {
    thinkingMs: durations.reduce((sum, ms) => sum + ms, 0),
    saved,
    updated,
    forgotten,
    logged,
    memoriesUsed: usedMemories.length,
    hasContent: visibleThought || memoryWork || logWork || usedMemories.length > 0,
  };
}

/** "6.2s · 2 logged · 1 saved · 3 memories": only the facts that apply, in order of interest. */
export function describeBrain(s: BrainSummary): string {
  return [
    s.thinkingMs >= 100 && `${(s.thinkingMs / 1000).toFixed(1)}s`,
    s.logged > 0 && `${s.logged} logged`,
    s.saved > 0 && `${s.saved} saved`,
    s.updated > 0 && `${s.updated} updated`,
    s.forgotten > 0 && `${s.forgotten} forgotten`,
    s.memoriesUsed > 0 && `${s.memoriesUsed} ${s.memoriesUsed === 1 ? "memory" : "memories"}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

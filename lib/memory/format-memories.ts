import type { Memory } from "./types";

/**
 * Renders memories for the system prompt. Each line carries its id so the model
 * can call updateMemory / forgetMemory on it.
 */
export function formatMemories(memories: Memory[]): string {
  const facts = memories.filter((memory) => memory.kind === "fact");
  const episodes = memories.filter((memory) => memory.kind === "episode");

  const line = (memory: Memory) => {
    const date = memory.occurredOn ? ` (${memory.occurredOn})` : "";
    return `- [${memory.id}] ${memory.category}: ${memory.content}${date}`;
  };

  return [
    "## Facts",
    facts.length ? facts.map(line).join("\n") : "- none yet",
    "",
    "## Recent episodes",
    episodes.length ? episodes.map(line).join("\n") : "- none yet",
  ].join("\n");
}

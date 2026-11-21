/**
 * The coach wraps its one closing question in <ask>…</ask> so the UI can make it stand out.
 * These helpers split a (possibly half-streamed) reply into the normal body and that question.
 */
const OPEN = "<ask>";
const CLOSE = "</ask>";

/** Drops a half-written tag at the very end of streamed text ("<", "<as", "</ask") so it never flashes. */
function trimPartialTag(text: string, tag: string): string {
  for (let n = tag.length - 1; n > 0; n--) if (text.endsWith(tag.slice(0, n))) return text.slice(0, -n);
  return text;
}

export type SplitReply = {
  /** Everything outside the tag (markdown). */
  body: string;
  /** The highlighted question, or null if the reply has none (yet). */
  ask: string | null;
};

export function splitAsk(text: string): SplitReply {
  const start = text.indexOf(OPEN);
  if (start === -1) return { body: trimPartialTag(text, OPEN), ask: null };

  const rest = text.slice(start + OPEN.length);
  const end = rest.indexOf(CLOSE);
  const ask = end === -1 ? trimPartialTag(rest, CLOSE) : rest.slice(0, end);
  // Anything after the closing tag shouldn't happen, but if it does, keep it in the body rather than lose it.
  const after = end === -1 ? "" : rest.slice(end + CLOSE.length);
  return { body: (text.slice(0, start) + after).trim(), ask: ask.trim() || null };
}

/** Plain text with the tags removed (for copying a message). */
export function stripAskTags(text: string): string {
  return text.split(OPEN).join("").split(CLOSE).join("");
}

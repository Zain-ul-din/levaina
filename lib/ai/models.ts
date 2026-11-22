import { mistral } from "@ai-sdk/mistral";

/*
 * Pinned ids, never "-latest" aliases: an alias can move to a new model overnight and change
 * how the coach behaves in production without a deploy. Change these on purpose, after an eval.
 */

/**
 * Main chat agent: Mistral Large 4. Chosen on the coach eval (Nov 2026): 22/24 with very good replies,
 * median 13.8s and worst case 65s, about $0.004 a message with caching. GLM 5.3 Flash was as accurate
 * but had a 317s worst case; Small 4 was fast but logged plans and questions (15/24).
 */
export const model = mistral("mistral-large-4");

/** Summarizes old messages when a chat is compacted: a separate, cheaper call with its own prompt. */
export const summaryModel = mistral("mistral-small-2603");

/** Speech-to-text for dictation: short clips, batch (not realtime). */
export const transcriptionModel = mistral.transcription("voxtral-mini-transcribe-3");

import { mistral } from "@ai-sdk/mistral";

/** Main chat agent. */
export const model = mistral("zai-glm-5-3-flash");

/** Speech-to-text for dictation: short clips, batch (not realtime). */
export const transcriptionModel = mistral.transcription("voxtral-mini-transcribe-3");

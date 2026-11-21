/** Response body of POST /api/transcribe, shared by the route and the client. */
export type TranscribeResponse = { text: string } | { error: string };

/** Form field the audio file is sent under. */
export const TRANSCRIBE_AUDIO_FIELD = "audio";

/** Longest clip we accept; dictation is short, this stops accidental huge uploads. */
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

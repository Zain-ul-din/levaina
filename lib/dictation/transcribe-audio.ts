import { TRANSCRIBE_AUDIO_FIELD, type TranscribeResponse } from "./types";

/** Uploads a recorded clip and returns its transcript. Throws with a user-readable message. */
export async function transcribeAudio(audio: Blob, signal?: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append(TRANSCRIBE_AUDIO_FIELD, audio, "dictation");

  const response = await fetch("/api/transcribe", { method: "POST", body: form, signal });
  const body = (await response.json().catch(() => null)) as TranscribeResponse | null;

  if (!response.ok || !body || "error" in body) {
    throw new Error(body && "error" in body ? body.error : "Couldn't transcribe that recording. Try again.");
  }
  return body.text;
}

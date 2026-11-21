import { transcriptionModel } from "@/lib/ai/models";
import { GUT_HEALTH_VOCABULARY } from "@/lib/ai/transcription-vocabulary";
import {
  MAX_AUDIO_BYTES,
  TRANSCRIBE_AUDIO_FIELD,
  type TranscribeResponse,
} from "@/lib/dictation/types";
import type { MistralTranscriptionModelOptions } from "@ai-sdk/mistral";
import { transcribe } from "ai";

const json = (body: TranscribeResponse, status = 200) => Response.json(body, { status });

/** Dictation: receives one recorded clip and returns its text. Audio is never stored. */
export async function POST(req: Request) {
  const audio = (await req.formData()).get(TRANSCRIBE_AUDIO_FIELD);

  if (!(audio instanceof File) || audio.size === 0) {
    return json({ error: "No audio received. Record something and try again." }, 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return json({ error: "That recording is too long. Keep dictation under a few minutes." }, 413);
  }

  try {
    const { text } = await transcribe({
      model: transcriptionModel,
      audio: new Uint8Array(await audio.arrayBuffer()),
      providerOptions: {
        mistral: { contextBias: GUT_HEALTH_VOCABULARY } satisfies MistralTranscriptionModelOptions,
      },
    });
    return json({ text: text.trim() });
  } catch (error) {
    console.error("[transcribe]", error);
    return json({ error: "Couldn't transcribe that recording. Try again." }, 502);
  }
}

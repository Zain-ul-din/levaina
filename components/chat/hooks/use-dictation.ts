"use client";

import {
  describeMicrophoneError,
  startRecordingSession,
  type RecordingSession,
} from "@/lib/dictation/recording-session";
import { transcribeAudio } from "@/lib/dictation/transcribe-audio";
import { useCallback, useEffect, useRef, useState } from "react";

export type DictationStatus = "idle" | "recording" | "transcribing";

/**
 * Dictation state machine: idle → recording → transcribing → idle.
 * Owns the microphone session and the upload; knows nothing about the UI.
 */
export function useDictation() {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const sessionRef = useRef<RecordingSession | null>(null);
  const uploadRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setAnalyser(null);
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    setError(null);
    try {
      const session = await startRecordingSession();
      sessionRef.current = session;
      setAnalyser(session.analyser);
      setStatus("recording");
    } catch (err) {
      setError(describeMicrophoneError(err));
    }
  }, []);

  /** Throws the recording (or an in-flight transcription) away. */
  const cancel = useCallback(() => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
    uploadRef.current?.abort();
    uploadRef.current = null;
    reset();
  }, [reset]);

  /** Stops recording and resolves with the transcript, or null if cancelled or failed. */
  const finish = useCallback(async (): Promise<string | null> => {
    const session = sessionRef.current;
    if (!session) return null;
    sessionRef.current = null;

    const upload = new AbortController();
    uploadRef.current = upload;
    setAnalyser(null);
    setStatus("transcribing");

    try {
      const text = await transcribeAudio(await session.stop(), upload.signal);
      if (!text) setError("Didn't catch anything. Try again a little closer to the mic.");
      return text || null;
    } catch (err) {
      if (!upload.signal.aborted) {
        setError(err instanceof Error ? err.message : "Couldn't transcribe that recording. Try again.");
      }
      return null;
    } finally {
      if (uploadRef.current === upload) {
        uploadRef.current = null;
        reset();
      }
    }
  }, [reset]);

  // Release the microphone if the component goes away mid-recording.
  useEffect(() => cancel, [cancel]);

  return {
    status,
    isActive: status !== "idle",
    error,
    clearError: () => setError(null),
    analyser,
    start,
    cancel,
    finish,
  };
}

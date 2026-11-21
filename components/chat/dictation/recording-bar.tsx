"use client";

import { Button } from "@/components/ui/button";
import { TraceLine, TraceTitle } from "@/components/ui/trace";
import { ArrowUpIcon, StopIcon, XIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { VoiceWaveform } from "./voice-waveform";

type RecordingBarProps = {
  /** Live input while recording; null once the audio is being transcribed. */
  analyser: AnalyserNode | null;
  canSend: boolean;
  onCancel: () => void;
  /** Stop and put the text in the message box for editing. */
  onStop: () => void;
  /** Stop and send straight away. */
  onSend: () => void;
};

/** Replaces the composer while dictating: cancel · live waveform · stop · send. */
export function RecordingBar({ analyser, canSend, onCancel, onStop, onSend }: RecordingBarProps) {
  const isTranscribing = analyser === null;

  // Escape cancels, the same way it closes any other temporary mode.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      role="group"
      aria-label="Dictation"
      className="flex h-14 w-full items-center gap-2 rounded-2xl border border-input px-2.5 dark:bg-input/30"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        aria-label="Cancel dictation"
        onClick={onCancel}
      >
        <XIcon />
      </Button>

      <div className="flex min-w-0 flex-1 items-center px-2" aria-live="polite">
        {isTranscribing ? (
          <TraceLine status="running">
            <TraceTitle>Transcribing</TraceTitle>
          </TraceLine>
        ) : (
          <>
            <span className="sr-only">Recording</span>
            <VoiceWaveform analyser={analyser} />
          </>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-full"
        aria-label="Stop and add to message"
        disabled={isTranscribing}
        onClick={onStop}
      >
        <StopIcon weight="fill" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        className="rounded-full"
        aria-label="Stop and send"
        disabled={isTranscribing || !canSend}
        onClick={onSend}
      >
        <ArrowUpIcon />
      </Button>
    </div>
  );
}

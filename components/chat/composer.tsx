"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUpIcon, MicrophoneIcon, PlusIcon, StopIcon } from "@phosphor-icons/react";
import { useState, type KeyboardEvent, type SubmitEvent } from "react";
import { useChatActions } from "./chat-provider";
import { RecordingBar } from "./dictation/recording-bar";
import { useDictation } from "./hooks/use-dictation";

const joinDraft = (...parts: string[]) => parts.map((part) => part.trim()).filter(Boolean).join(" ");

/** Draft text stays local UI state; sending goes straight to the shared chat. */
export function Composer() {
  const { canSend, isBusy, sendMessage, stop } = useChatActions();
  const dictation = useDictation();
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const isSendable = canSend && trimmed.length > 0;

  const send = (message: string) => {
    sendMessage({ text: message });
    setText("");
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSendable) send(trimmed);
  };

  // Enter sends, Shift+Enter adds a new line. isComposing protects IME input (e.g. Japanese, Urdu keyboards).
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  /** Dictated text is appended to whatever was already typed. */
  const stopDictation = async () => {
    const transcript = await dictation.finish();
    if (transcript) setText((draft) => joinDraft(draft, transcript));
  };

  const sendDictation = async () => {
    const transcript = await dictation.finish();
    if (!transcript) return;
    const message = joinDraft(text, transcript);
    // If a reply is still streaming, keep it as a draft rather than losing it.
    if (canSend) send(message);
    else setText(message);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {dictation.isActive ? (
        <RecordingBar
          analyser={dictation.analyser}
          canSend={canSend}
          onCancel={dictation.cancel}
          onStop={stopDictation}
          onSend={sendDictation}
        />
      ) : (
        // One floating pill, like a search field: + on the left, text in the middle (grows with
        // multi-line input), mic and send on the right. items-end keeps buttons on the last line.
        <InputGroup className="items-end rounded-[1.75rem] border-transparent bg-card p-1.5 shadow-soft has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/25">
          <InputGroupAddon align="inline-start" className="pb-0.5">
            {/* Attachments come later; the button is a placeholder for now. */}
            <InputGroupButton
              size="icon-sm"
              variant="secondary"
              className="size-9 rounded-full text-foreground"
              aria-label="Attach files"
            >
              <PlusIcon />
            </InputGroupButton>
          </InputGroupAddon>

          <InputGroupTextarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              dictation.clearError();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your gut…"
            aria-label="Message"
            autoFocus
            rows={1}
            className="max-h-40 min-h-0 px-1.5 py-2 text-base md:text-base"
          />

          <InputGroupAddon align="inline-end" className="gap-1.5 pb-0.5">
            <InputGroupButton
              size="icon-sm"
              variant="secondary"
              // The addon greys out its children (text-muted-foreground); an active button needs full colour.
              className="size-9 rounded-full text-foreground"
              aria-label="Dictate"
              onClick={() => void dictation.start()}
            >
              <MicrophoneIcon />
            </InputGroupButton>

            {isBusy ? (
              <InputGroupButton
                size="icon-sm"
                variant="default"
                className="size-9 rounded-full"
                aria-label="Stop reply"
                onClick={() => stop()}
              >
                <StopIcon weight="fill" />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                type="submit"
                size="icon-sm"
                variant="default"
                // Disabled = neutral, not a faded accent.
                className="size-9 rounded-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                disabled={!isSendable}
                aria-label="Send"
              >
                <ArrowUpIcon />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
      )}

      {dictation.error ? (
        <p role="alert" className="text-center text-xs text-destructive">
          {dictation.error}
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Not medical advice. Check big changes with your doctor.
        </p>
      )}
    </form>
  );
}

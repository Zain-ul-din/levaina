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
        <InputGroup className="rounded-2xl">
          <InputGroupTextarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              dictation.clearError();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about your gut, meals or weight"
            aria-label="Message"
            autoFocus
            className="max-h-48 p-3"
          />
          <InputGroupAddon align="block-end">
            {/* Attachments come later; the button is a placeholder for now. */}
            <InputGroupButton
              size="icon-sm"
              variant="outline"
              className="rounded-full"
              aria-label="Attach files"
            >
              <PlusIcon />
            </InputGroupButton>

            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              // The addon greys out its children (text-muted-foreground); an active button needs full colour.
              className="ml-auto rounded-full text-foreground"
              aria-label="Dictate"
              onClick={() => void dictation.start()}
            >
              <MicrophoneIcon />
            </InputGroupButton>

            {isBusy ? (
              <InputGroupButton
                size="icon-sm"
                variant="default"
                className="rounded-full"
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
                className="rounded-full"
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
          Not medical advice. Check big diet changes with your doctor.
        </p>
      )}
    </form>
  );
}

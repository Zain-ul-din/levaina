"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUpIcon, PlusIcon, StopIcon } from "@phosphor-icons/react";
import { useState, type KeyboardEvent, type SubmitEvent } from "react";
import { useChatActions } from "./chat-provider";

/** Draft text stays local UI state; sending goes straight to the shared chat. */
export function Composer() {
  const { canSend, isBusy, sendMessage, stop } = useChatActions();
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const isSendable = canSend && trimmed.length > 0;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSendable) return;

    sendMessage({ text: trimmed });
    setText("");
  };

  // Enter sends, Shift+Enter adds a new line. isComposing protects IME input (e.g. Japanese, Urdu keyboards).
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <InputGroup className="rounded-2xl">
        <InputGroupTextarea
          value={text}
          onChange={(event) => setText(event.target.value)}
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

          {isBusy ? (
            <InputGroupButton
              size="icon-sm"
              variant="default"
              className="ml-auto rounded-full"
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
              className="ml-auto rounded-full"
              disabled={!isSendable}
              aria-label="Send"
            >
              <ArrowUpIcon />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
      <p className="text-center text-xs text-muted-foreground">
        Not medical advice. Check big diet changes with your doctor.
      </p>
    </form>
  );
}

"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUpIcon, PlusIcon } from "@phosphor-icons/react";
import { useState, type SubmitEvent } from "react";
import { useChatActions } from "./chat-provider";

/** Draft text stays local UI state; sending goes straight to the shared chat. */
export function Composer() {
  const { canSend, sendMessage } = useChatActions();
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const isSendable = canSend && trimmed.length > 0;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSendable) return;

    sendMessage({ text: trimmed });
    setText("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup>
        <InputGroupTextarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Tell me about your gut, meals or weight..."
          className="p-3"
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
            type="submit"
            size="icon-sm"
            variant="default"
            className="ml-auto rounded-full"
            disabled={!isSendable}
            aria-label="Send"
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { getMessageText } from "@/lib/chat/get-message-text";
import type { ChatUIMessage } from "@/lib/chat/types";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";

const COPIED_RESET_MS = 1500;

type CopyMessageButtonProps = {
  message: ChatUIMessage;
};

export function CopyMessageButton({ message }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(getMessageText(message));
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  return (
    <Button variant="ghost" size="icon-sm" aria-label="Copy" onClick={copy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

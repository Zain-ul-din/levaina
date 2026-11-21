"use client";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { useChatActions } from "./chat-provider";

export function ChatError() {
  const { regenerate } = useChatActions();

  return (
    <Bubble variant="destructive" role="alert">
      <BubbleContent className="flex items-center gap-3">
        <span>The reply didn&apos;t arrive. Check your connection and try again.</span>
        <Button size="sm" variant="outline" onClick={() => regenerate()}>
          <ArrowClockwiseIcon />
          Try again
        </Button>
      </BubbleContent>
    </Bubble>
  );
}

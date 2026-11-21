"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useChatActions } from "./chat-provider";

/** Real first messages a person with gut issues would send; tapping one sends it. */
const STARTER_PROMPTS = [
  "My doctor told me to try a carnivore diet",
  "I get bloated after most meals",
  "I want to gain weight without upsetting my gut",
] as const;

export function ChatEmptyState() {
  const { sendMessage, canSend } = useChatActions();

  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyTitle className="text-2xl">What&apos;s going on with your gut?</EmptyTitle>
        <EmptyDescription>
          Tell me your symptoms, what your doctor said and your weight goal. We&apos;ll
          work out a plan together.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-col items-stretch gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            className="h-auto justify-start py-2.5 text-left whitespace-normal"
            disabled={!canSend}
            onClick={() => sendMessage({ text: prompt })}
          >
            {prompt}
          </Button>
        ))}
      </EmptyContent>
    </Empty>
  );
}

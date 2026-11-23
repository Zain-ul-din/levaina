"use client";

import { useChatActions } from "./chat-provider";

/**
 * Real first messages a person with gut issues would send; tapping one sends it.
 * Emoji give each a face at a glance, the way food apps label things.
 */
const STARTER_PROMPTS = [
  { emoji: "🫧", message: "I get bloated after most meals" },
  { emoji: "⚖️", message: "I want to lose weight without upsetting my gut" },
  { emoji: "🌱", message: "I'm underweight and eating more hurts my stomach" },
  { emoji: "🩺", message: "I was just diagnosed with IBS. Where do I start?" },
] as const;

export function ChatEmptyState() {
  const { sendMessage, canSend } = useChatActions();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6">
      <div className="flex flex-col gap-3 text-center">
        <h1 className="font-display text-[2.1rem] leading-[1.1] font-semibold tracking-tight text-balance">
          What&apos;s going on with your gut?
        </h1>
        <p className="text-[0.95rem] leading-relaxed text-pretty text-muted-foreground">
          Tell me your symptoms, what your doctor said and your weight goal. We&apos;ll work out a
          plan together.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {STARTER_PROMPTS.map(({ emoji, message }) => (
          <button
            key={message}
            type="button"
            disabled={!canSend}
            data-feel="press"
            data-feel-size="large"
            onClick={() => sendMessage({ text: message })}
            className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left text-[0.95rem] font-medium shadow-soft outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {emoji}
            </span>
            {message}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { splitAsk } from "@/lib/chat/ask-tag";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

type TextPartProps = {
  text: string;
  isStreaming: boolean;
};

// 17px / 1.65: the most-read text in the app, so it gets the most generous size.
// Body text sits at 80% ink so bold labels and headings (full ink) pop without getting heavier.
const PROSE =
  "text-[1.0625rem] leading-[1.65] text-foreground/80 [&_[data-streamdown=strong]]:text-foreground [&_h1,&_h2,&_h3,&_h4]:text-foreground";

/**
 * Renders assistant markdown; Streamdown copes with half-written markdown mid-stream.
 * The coach's closing question arrives as <ask>…</ask> and is set slightly bolder, so the
 * one thing that needs the user's answer stands out from the advice above it.
 */
export function TextPart({ text, isStreaming }: TextPartProps) {
  const { body, ask } = splitAsk(text);

  return (
    <>
      {body && (
        <Streamdown className={PROSE} isAnimating={isStreaming && !ask}>
          {body}
        </Streamdown>
      )}
      {ask && (
        // "Your turn": a thin matcha bar (matcha marks things you can do), a little extra space
        // above, and medium weight. Weight alone was too subtle to read as different from advice.
        <div className="relative mt-2 pl-4">
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 left-0 w-0.5 origin-top rounded-full bg-primary/80",
              // Only in a live reply; reopened chats show it finished.
              isStreaming && "transition-transform duration-500 ease-(--ease-out) starting:scale-y-0 motion-reduce:starting:scale-y-100",
            )}
          />
          <Streamdown className={`${PROSE} font-medium text-foreground`} isAnimating={isStreaming}>
            {ask}
          </Streamdown>
        </div>
      )}
    </>
  );
}

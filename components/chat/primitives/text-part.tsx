"use client";

import { splitAsk } from "@/lib/chat/ask-tag";
import { Streamdown } from "streamdown";

type TextPartProps = {
  text: string;
  isStreaming: boolean;
};

// 17px / 1.65: the most-read text in the app, so it gets the most generous size.
const PROSE = "text-[1.0625rem] leading-[1.65]";

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
        <Streamdown className={`${PROSE} font-medium`} isAnimating={isStreaming}>
          {ask}
        </Streamdown>
      )}
    </>
  );
}

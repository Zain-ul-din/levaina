"use client";

import { Streamdown } from "streamdown";

type TextPartProps = {
  text: string;
  isStreaming: boolean;
};

/** Renders assistant markdown; Streamdown copes with half-written markdown mid-stream. */
export function TextPart({ text, isStreaming }: TextPartProps) {
  // 17px / 1.65: the most-read text in the app, so it gets the most generous size.
  return (
    <Streamdown className="text-[1.0625rem] leading-[1.65]" isAnimating={isStreaming}>
      {text}
    </Streamdown>
  );
}

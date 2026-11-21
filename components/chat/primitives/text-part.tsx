"use client";

import { Streamdown } from "streamdown";

type TextPartProps = {
  text: string;
  isStreaming: boolean;
};

/** Renders assistant markdown; Streamdown copes with half-written markdown mid-stream. */
export function TextPart({ text, isStreaming }: TextPartProps) {
  return (
    <Streamdown className="text-[0.9375rem] leading-7" isAnimating={isStreaming}>
      {text}
    </Streamdown>
  );
}

import { ViewTransition } from "react";

/**
 * Page changes inside the chat area. A template remounts on every navigation, so its
 * <ViewTransition> plays the old page leaving and the new one arriving. Opening another chat or
 * starting a new one is sideways, not deeper: a crossfade (feel-fade in app/feel.css), and the
 * chat header holds still (view-transition-name: chat-header). The sidebar lives in the layout,
 * outside this, so it never moves. Reduce motion: feel.css keeps it a plain short fade.
 */
export default function ChatTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "feel-forward": "feel-forward", "feel-back": "feel-back", default: "feel-fade" }}
      exit={{ "feel-forward": "feel-forward", "feel-back": "feel-back", default: "feel-fade" }}
      default="none"
    >
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}

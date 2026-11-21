"use client";
import { use } from "react";

export function useRequiredContext<T>(
  context: React.Context<T | null>,
  hookName: string,
): T {
  const value = use(context);
  if (value === null) {
    throw new Error(`${hookName} must be used inside <ChatProvider>`);
  }
  return value;
}

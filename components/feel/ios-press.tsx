"use client";

import { useEffect } from "react";

/**
 * iOS Safari only applies :active (the press sinking) when the page listens for touches.
 * An empty passive listener is enough; it changes nothing else.
 */
export function IosPress() {
  useEffect(() => {
    const listen = () => {};
    document.addEventListener("touchstart", listen, { passive: true });
    return () => document.removeEventListener("touchstart", listen);
  }, []);
  return null;
}

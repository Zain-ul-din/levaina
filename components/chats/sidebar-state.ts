"use client";

import { useSyncExternalStore } from "react";

/** Same breakpoint as Tailwind's `lg`: from here the chat list is docked; below it, a drawer. */
export const DESKTOP_QUERY = "(min-width: 64rem)";

export const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

/*
 * Whether the docked sidebar is collapsed. A per-device preference, so it lives in localStorage,
 * read through useSyncExternalStore so the header button and the sidebar always agree.
 * Storage can be blocked (private mode); then it still works for the visit, from memory.
 */
const KEY = "levaina.chat-sidebar";
const CHANGE = "levaina:chat-sidebar";
let inMemory = false;

function read(): boolean {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === null ? inMemory : stored === "collapsed";
  } catch {
    return inMemory;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange); // another tab changed it
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setSidebarCollapsed(collapsed: boolean) {
  inMemory = collapsed;
  try {
    localStorage.setItem(KEY, collapsed ? "collapsed" : "open");
  } catch {
    // Blocked storage: the in-memory value still applies for this visit.
  }
  window.dispatchEvent(new Event(CHANGE));
}

/** Open by default (and on the server, so the first paint matches most visitors). */
export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, read, () => false);
}

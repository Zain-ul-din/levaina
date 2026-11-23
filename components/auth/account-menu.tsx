"use client";

import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { SignOutIcon, UserIcon } from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";

/**
 * The account button at the top right: the first letter of your email, like Google and ChatGPT.
 * Opens a small menu with who you're signed in as and Sign out.
 */
export function AccountMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [isSigningOut, startSignOut] = useTransition();

  // The email is only for showing; who you are is decided on the server (proxy + RLS), not here.
  useEffect(() => {
    let cancelled = false;
    void getSupabaseBrowserClient()
      .auth.getClaims()
      .then(({ data }) => {
        const value = data?.claims?.email;
        if (!cancelled && typeof value === "string") setEmail(value);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const initial = email?.trim().charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<FloatingIconButton aria-label={email ? `Account: ${email}` : "Account"} />}
      >
        {initial ? <span className="font-display text-base font-semibold text-primary">{initial}</span> : <UserIcon />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 pt-2 pb-2.5 font-normal">
            <span className="block text-xs text-muted-foreground">Signed in as</span>
            <span className="block truncate text-sm font-medium text-foreground">{email ?? "…"}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Red, like other leave/remove actions. */}
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onClick={() => startSignOut(() => signOut())}
          className="h-10 rounded-xl px-2.5 text-[0.95rem]"
        >
          <SignOutIcon />
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

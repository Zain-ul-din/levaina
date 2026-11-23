"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Step = { name: "email" } | { name: "code"; email: string };

const FIELD = "h-12 rounded-xl px-4 text-base md:text-base";
const SUBMIT = "h-12 w-full rounded-xl text-base";

/**
 * Passwordless sign-in: email → 6-digit code → in. New emails get an account automatically,
 * so "sign in" and "sign up" are the same two steps. No links to click, which suits the mobile app.
 */
export function SignInForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "email" });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = async (address: string) => {
    setBusy(true);
    setError(null);
    const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setCode("");
    setStep({ name: "code", email: address });
  };

  const onEmail = (event: FormEvent) => {
    event.preventDefault();
    void sendCode(email.trim());
  };

  const onCode = async (event: FormEvent) => {
    event.preventDefault();
    if (step.name !== "code") return;
    setBusy(true);
    setError(null);
    const { error } = await getSupabaseBrowserClient().auth.verifyOtp({ email: step.email, token: code, type: "email" });
    if (error) {
      setBusy(false);
      return setError("That code didn't work. Check it, or send a new one.");
    }
    // Session cookies are set; reload server data as the signed-in user.
    router.replace("/");
    router.refresh();
  };

  if (step.name === "email") {
    return (
      <form onSubmit={onEmail} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm text-muted-foreground">
          Your email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={FIELD}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {/* Always pressable (only paused while sending): the required email field already refuses
            an empty or invalid address, and a greyed-out button over glass is hard to read. */}
        <Button type="submit" disabled={busy} className={SUBMIT}>
          {busy ? "Sending…" : "Send me a code"}
        </Button>
        <p className="text-center text-sm text-balance text-muted-foreground">No password needed. We&apos;ll email you a 6-digit code.</p>
      </form>
    );
  }

  return (
    <form onSubmit={onCode} className="flex flex-col gap-3">
      <label htmlFor="code" className="text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="text-foreground">{step.email}</span>
      </label>
      <Input
        id="code"
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        placeholder="123456"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        className={`${FIELD} text-center text-xl tracking-[0.4em] md:text-xl`}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || code.length !== 6} className={SUBMIT}>
        {busy ? "Checking…" : "Sign in"}
      </Button>
      <div className="flex justify-between text-sm">
        <Button type="button" variant="link" className="h-auto px-0" onClick={() => setStep({ name: "email" })}>
          Use a different email
        </Button>
        <Button type="button" variant="link" className="h-auto px-0" disabled={busy} onClick={() => void sendCode(step.email)}>
          Send a new code
        </Button>
      </div>
    </form>
  );
}

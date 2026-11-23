import { SignInForm } from "@/components/auth/sign-in-form";
import { LogoMark } from "@/components/brand/logo-mark";
import { WaveCanvas } from "@/components/brand/wave-canvas";
import { APP_NAME } from "@/lib/brand/brand";

/**
 * Sign-in: a slowly twisting ribbon crosses the bottom-right corner (bottom edge to right edge),
 * behind the content; the logo, welcome and form sit in the upper part and enter once, as one
 * staggered wave (see .enter-rise).
 */
export default function LoginPage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-background">
      <WaveCanvas className="pointer-events-none absolute inset-0 size-full" />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-[max(14dvh,calc(env(safe-area-inset-top)+3rem))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <span className="enter-rise mb-6 grid size-16 place-items-center rounded-2xl bg-card shadow-soft [--enter-delay:0ms]">
          <LogoMark className="size-10 text-primary" />
        </span>
        <h1 className="enter-rise font-display text-3xl font-semibold tracking-tight [--enter-delay:70ms]">
          Welcome to {APP_NAME}
        </h1>
        <p className="enter-rise mt-2 mb-8 text-muted-foreground [--enter-delay:120ms]">
          Food that agrees with your gut, and a weight you&apos;re happy with. Sign in to pick up where you left off.
        </p>
        <div className="enter-rise [--enter-delay:160ms]">
          <SignInForm />
        </div>
      </div>
    </main>
  );
}

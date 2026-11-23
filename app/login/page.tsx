import { SignInForm } from "@/components/auth/sign-in-form";
import { LogoMark } from "@/components/brand/logo-mark";
import { WaveCanvas } from "@/components/brand/wave-canvas";
import { APP_NAME } from "@/lib/brand/brand";

/**
 * Sign-in: a band of slow food-coloured waves with a slanted bottom edge (the Stripe hero idea),
 * then the logo, welcome and form. The content enters once, as one staggered wave (see .enter-rise).
 */
export default function LoginPage() {
  return (
    <main className="relative flex flex-1 flex-col bg-background">
      {/* The slant comes from clip-path; the canvas overhangs its box so the blur has no soft edges. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[44dvh] min-h-64 overflow-hidden [clip-path:polygon(0_0,100%_0,100%_72%,0_100%)]"
      >
        <WaveCanvas className="absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-[max(calc(44dvh-2.5rem),13.5rem)] pb-[max(2rem,env(safe-area-inset-bottom))]">
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

import { SignInForm } from "@/components/auth/sign-in-form";
import { LogoMark } from "@/components/brand/logo-mark";
import { APP_NAME } from "@/lib/brand/brand";
import Image from "next/image";
import sunrise from "@/public/images/sign-in/sunrise-hills.webp";

/**
 * Sign-in: a painted sunrise over misty hills (a path leading toward the sun: the journey the app
 * is about) fills the window, and a full-height frosted-glass card floats over it, inset by the
 * same margin all round. Logo and words at the top of the card, the form at the bottom, in thumb
 * reach. Light mode: frosted cream glass; dark mode: smoked glass (--glass-* tokens).
 * Wider screens: the card keeps a phone-like width on the left, leaving the sun and path in view.
 */
export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col bg-background px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {/* Decorative: the words carry the meaning, so it has empty alt text. */}
      <Image
        src={sunrise}
        alt=""
        priority
        placeholder="blur"
        sizes="100vw"
        className="fixed inset-0 size-full object-cover object-[62%_50%]"
      />

      {/*
        The glass: solid when the browser can't blur (or the person asked for less transparency),
        frosted where it can. Inside, secondary text and the email field use the glass values, so
        they stay readable whatever part of the picture is behind them.
      */}
      <section
        className={[
          "relative flex w-full flex-1 flex-col rounded-[1.875rem] border border-(--glass-edge) bg-background px-[1.375rem] pt-[1.875rem] pb-[1.625rem]",
          "shadow-[0_18px_40px_rgb(43_38_32/0.18)] sm:max-w-md sm:self-start",
          "supports-backdrop-filter:bg-(--glass-panel) supports-backdrop-filter:backdrop-blur-[22px] supports-backdrop-filter:backdrop-saturate-[1.4]",
          "[@media(prefers-reduced-transparency:reduce)]:bg-background!",
          "[--muted-foreground:var(--glass-muted)] [&_input]:bg-(--glass-field)",
        ].join(" ")}
      >
        <div className="enter-rise mb-4 flex items-center gap-2.5 [--enter-delay:0ms]">
          <LogoMark className="size-7 text-primary" />
          <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <h1 className="enter-rise font-display text-[1.75rem] leading-[1.15] font-semibold tracking-tight text-balance [--enter-delay:60ms]">
          Every good day starts somewhere
        </h1>
        <p className="enter-rise mt-2.5 text-[0.9375rem] text-muted-foreground [--enter-delay:110ms]">
          Food that agrees with your gut, and a weight you&apos;re happy with.
        </p>
        <div className="enter-rise mt-auto pt-8 [--enter-delay:150ms]">
          <SignInForm />
        </div>
      </section>
    </main>
  );
}

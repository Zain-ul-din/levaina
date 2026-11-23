import { SignInForm } from "@/components/auth/sign-in-form";
import { SignInPromises } from "@/components/auth/sign-in-promises";
import { LogoMark } from "@/components/brand/logo-mark";
import { APP_NAME } from "@/lib/brand/brand";
import Image from "next/image";
import sunrise from "@/public/images/sign-in/sunrise-hills.webp";

/**
 * Sign-in: a painted sunrise over misty hills (a path leading toward the sun: the journey the app
 * is about) fills the window, and a full-height frosted-glass card floats over it, inset by the
 * same margin all round. Logo and words at the top of the card, the form at the bottom, in thumb
 * reach. Light mode: frosted cream glass; dark mode: smoked glass (--glass-* tokens).
 * Tablet: a phone-width card on the left. Desktop: a half-width card in the centre, framed by the
 * scene. Content is one block with fixed spacing, centred vertically in the card.
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
          "relative flex w-full flex-1 flex-col rounded-[1.875rem] border border-(--glass-edge) bg-background px-[1.375rem] pt-[1.875rem] pb-[1.625rem] short:pt-[1.375rem]",
          // Tablet: a phone-width card on the left. Desktop: half the window (minus the page margin),
          // with the content kept at a readable width, centred inside the wider glass.
          "shadow-[0_18px_40px_rgb(43_38_32/0.18)] sm:max-w-md sm:self-start lg:w-[calc(50vw-1rem)] lg:max-w-none lg:self-center",
          "supports-backdrop-filter:bg-(--glass-panel) supports-backdrop-filter:backdrop-blur-[22px] supports-backdrop-filter:backdrop-saturate-[1.4]",
          "[@media(prefers-reduced-transparency:reduce)]:bg-background!",
          "[--muted-foreground:var(--glass-muted)] [&_input]:bg-(--glass-field) [&_input]:placeholder:text-(--glass-placeholder)",
        ].join(" ")}
      >
        <div className="mx-auto flex w-full max-w-[26rem] tall-desktop:max-w-[30rem] my-auto flex-col">
          <div className="enter-rise mb-4 flex items-center gap-2.5 short:mb-3 [--enter-delay:0ms]">
            <LogoMark className="size-7 text-primary" />
            <span className="font-display text-xl font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </div>
          <h1 className="enter-rise font-display text-[2rem] leading-[1.12] short:text-[1.75rem] lg:text-[2.5rem] tall-desktop:text-[3.25rem] font-semibold tracking-tight text-balance [--enter-delay:60ms]">
            Every good day starts somewhere
          </h1>
          <p className="enter-rise mt-2.5 text-[0.9375rem] text-muted-foreground lg:mt-3.5 lg:text-[1.0625rem] tall-desktop:text-lg [--enter-delay:110ms]">
            Food that agrees with your gut, and a weight you&apos;re happy with.
          </p>
          {/* One top-to-bottom flow with fixed spacing, centred in the card as a block (my-auto above). */}
          <SignInPromises className="enter-rise mt-7 lg:mt-10 [--enter-delay:130ms]" />
          <div className="enter-rise mt-7 lg:mt-10 [--enter-delay:170ms]">
            <SignInForm />
          </div>
        </div>
      </section>
    </main>
  );
}

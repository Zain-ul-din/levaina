import { SignInForm } from "@/components/auth/sign-in-form";
import { LogoMark } from "@/components/brand/logo-mark";
import { APP_NAME } from "@/lib/brand/brand";
import Image from "next/image";
import sunrise from "@/public/images/sign-in/sunrise-hills.webp";

/**
 * Sign-in: a painted sunrise over misty hills (a path leading toward the sun: the journey the app
 * is about) fills the screen, and the sign-in form sits on a soft panel at the bottom.
 * Phone: the panel is attached to the bottom edge with rounded top corners.
 * Wider screens: the picture fills the window and the panel floats as a centred card.
 * The panel's content enters once, as one short staggered wave (.enter-rise).
 */
export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col bg-background">
      {/* Decorative: the words below carry the meaning, so it has empty alt text. */}
      <div className="absolute inset-x-0 top-0 h-[58dvh] sm:fixed sm:inset-0 sm:h-auto">
        <Image
          src={sunrise}
          alt=""
          priority
          placeholder="blur"
          sizes="100vw"
          className="size-full object-cover object-[62%_50%]"
        />
      </div>

      <section className="relative mt-auto w-full rounded-t-[1.75rem] bg-background px-6 pt-9 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:mx-auto sm:mb-10 sm:max-w-md sm:rounded-[1.75rem] sm:shadow-soft">
        <div className="enter-rise mb-5 flex items-center gap-2.5 [--enter-delay:0ms]">
          <LogoMark className="size-7 text-primary" />
          <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <h1 className="enter-rise font-display text-[1.875rem] leading-[1.15] font-semibold tracking-tight text-balance [--enter-delay:60ms]">
          Every good day starts somewhere
        </h1>
        <p className="enter-rise mt-2.5 mb-7 text-muted-foreground [--enter-delay:110ms]">
          Food that agrees with your gut, and a weight you&apos;re happy with.
        </p>
        <div className="enter-rise [--enter-delay:150ms]">
          <SignInForm />
        </div>
      </section>
    </main>
  );
}

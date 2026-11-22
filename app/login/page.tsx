import { SignInForm } from "@/components/auth/sign-in-form";
import { LogoMark } from "@/components/brand/logo-mark";
import { APP_NAME } from "@/lib/brand/brand";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm py-12">
        <LogoMark className="mb-6 size-12 text-primary" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome to {APP_NAME}</h1>
        <p className="mt-2 mb-8 text-muted-foreground">
          Food that agrees with your gut, and a weight you&apos;re happy with. Sign in to pick up where you left off.
        </p>
        <SignInForm />
      </div>
    </main>
  );
}

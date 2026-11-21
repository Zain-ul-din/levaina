import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/theme-provider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Headline face: a warm, bold serif (Google Fonts, OFL). SOFT rounds the terminals so it reads friendly, not bookish. */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
});

/** Brand typeface: Satoshi (Fontshare, free), self-hosted so the mobile app works offline. */
const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gut Coach",
  description: "Chat about your gut and weight goals and build a plan that fits you.",
};

export const viewport: Viewport = {
  // Draw under the notch and home bar; the shell adds safe-area padding back where needed.
  viewportFit: "cover",
  // Colours the phone's status bar to match the app background in each mode.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f0e7" },
    { media: "(prefers-color-scheme: dark)", color: "#191814" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes adds class="dark" to <html> before React hydrates.
    <html lang="en" suppressHydrationWarning className={cn("h-full antialiased font-sans", satoshi.variable, fraunces.variable, geistMono.variable)}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

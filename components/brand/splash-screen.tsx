"use client";

import { APP_NAME } from "@/lib/brand/brand";
import { BOWL_PATHS, LOGO_VIEWBOX, RAY_STROKE_WIDTH, RAYS_PATH, SUN_PATH } from "@/lib/brand/logo-geometry";
import { useEffect, useRef, useState } from "react";

/** The three rays as separate paths, so each can draw on its own. */
const RAY_PATHS = RAYS_PATH.split("M").filter(Boolean).map((d) => `M${d}`);
/** The bowl rim sits at y=56; the sun is clipped above it, so it rises out of the bowl. */
const RIM_Y = 56;
/** How far below its resting place the sun starts (fully hidden inside the bowl). */
const SUN_START = 26;
/** When the exit begins, in seconds; tapping jumps here. */
const EXIT_AT = 1.7;

/**
 * Splash shown once per session over the first screen: the Morning Bowl assembles itself.
 *
 * Timeline (choreograph): lead = the sun rising out of the bowl; support = the bowl settling first
 * and the wordmark arriving as the sun lands; accent = the rays drawing on as the sun arrives;
 * decoration = fermentation bubbles drifting up (the "levain" in the name), fade only.
 * Everything uses the brand's strong ease-out. Tap skips straight to the exit.
 *
 * It's in the server HTML so it covers the very first paint; a <head> script hides it when it was
 * already shown this session (see SPLASH_SCRIPT in app/layout.tsx), and CSS has a fail-safe.
 */
/** Eats the next click anywhere on the page (once), then stops listening. */
function swallowNextClick() {
  const eat = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
  };
  window.addEventListener("click", eat, { capture: true, once: true });
  // A tap with no click (moved finger, cancelled) must not eat a later, real click.
  window.setTimeout(() => window.removeEventListener("click", eat, { capture: true }), 600);
}

export function SplashScreen() {
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const bowlRef = useRef<SVGGElement>(null);
  const sunRef = useRef<SVGPathElement>(null);
  const raysRef = useRef<SVGGElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Until the timeline exists, a tap is remembered and applied as soon as it's built.
  const skipRequestedRef = useRef(false);
  const skipRef = useRef<() => void>(() => {
    skipRequestedRef.current = true;
  });

  useEffect(() => {
    if (document.documentElement.dataset.splash === "off") return;
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let stopBubbles = () => {};
    let killTimeline = () => {};
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      stopBubbles();
      if (!cancelled) setDone(true);
    };

    if (reduceMotion) {
      // Fewer and gentler: the finished logo, then a plain fade. No rising, drawing or bubbles.
      for (const el of [bowlRef.current, sunRef.current, wordRef.current]) el?.style.setProperty("transform", "none");
      for (const el of [bowlRef.current, wordRef.current]) el?.style.setProperty("opacity", "1");
      raysRef.current?.querySelectorAll("path").forEach((ray) => ray.style.setProperty("stroke-dashoffset", "0"));
      const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 700, fill: "forwards" });
      fade.onfinish = finish;
      skipRef.current = () => fade.finish();
      return () => {
        cancelled = true;
        fade.cancel();
      };
    }

    stopBubbles = startBubbles(canvasRef.current);

    void (async () => {
      const [{ gsap }, { CustomEase }] = await Promise.all([import("gsap"), import("gsap/CustomEase")]);
      if (cancelled) return;
      gsap.registerPlugin(CustomEase);
      // The same curve as --ease-out in globals.css, so the splash moves like the rest of the app.
      const easeOut = CustomEase.create("levaina-ease-out", "0.23, 1, 0.32, 1");
      const rays = raysRef.current?.querySelectorAll("path") ?? [];

      const timeline = gsap.timeline({ onComplete: finish });
      timeline
        .to(bowlRef.current, { opacity: 1, y: 0, duration: 0.5, ease: easeOut }, 0)
        .to(sunRef.current, { y: 0, duration: 0.95, ease: easeOut }, 0.12)
        .to(rays, { strokeDashoffset: 0, duration: 0.35, ease: easeOut, stagger: { each: 0.06, from: "center" } }, 0.72)
        .to(wordRef.current, { opacity: 1, y: 0, duration: 0.5, ease: easeOut }, 0.82)
        // Exit is quicker than the entrance, and lets taps through as soon as it starts.
        .set(root, { pointerEvents: "none" }, EXIT_AT)
        .to(markRef.current, { scale: 0.97, duration: 0.35, ease: easeOut }, EXIT_AT)
        .to(root, { opacity: 0, duration: 0.35, ease: easeOut }, EXIT_AT);

      skipRef.current = () => {
        if (timeline.time() < EXIT_AT) timeline.seek(EXIT_AT);
      };
      if (skipRequestedRef.current) skipRef.current();
      killTimeline = () => timeline.kill();
    })();

    return () => {
      cancelled = true;
      stopBubbles();
      killTimeline();
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      onPointerDown={() => {
        // The splash leaves on touch-down, so the click that follows the same tap would land on
        // whatever is now under the finger (on the home screen: a starter prompt, which sends a
        // message). That click belongs to the skip: swallow it once.
        swallowNextClick();
        skipRef.current();
      }}
      className="splash fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-background"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <div ref={markRef} className="relative flex flex-col items-center gap-5">
        <svg viewBox={LOGO_VIEWBOX} className="size-28 overflow-visible text-primary">
          <defs>
            <clipPath id="splash-above-rim">
              <rect x="-10" y="-10" width="120" height={RIM_Y + 10} />
            </clipPath>
          </defs>
          {/* Start states live in the markup, so the first paint already matches frame one. */}
          <g ref={raysRef}>
            {RAY_PATHS.map((d) => (
              <path
                key={d}
                d={d}
                pathLength={1}
                fill="none"
                stroke="currentColor"
                strokeWidth={RAY_STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray="1 1"
                style={{ strokeDashoffset: 1 }}
              />
            ))}
          </g>
          <g clipPath="url(#splash-above-rim)">
            <path ref={sunRef} d={SUN_PATH} fill="currentColor" style={{ transform: `translateY(${SUN_START}px)` }} />
          </g>
          <g ref={bowlRef} style={{ opacity: 0, transform: "translateY(6px)" }}>
            {BOWL_PATHS.map((d) => (
              <path key={d} d={d} fill="currentColor" />
            ))}
          </g>
        </svg>
        <span
          ref={wordRef}
          className="font-display text-4xl font-semibold tracking-tight"
          style={{ opacity: 0, transform: "translateY(6px)" }}
        >
          {APP_NAME}
        </span>
      </div>
    </div>
  );
}

/**
 * Small rings and dots drifting up from the bowl, like bubbles in a sourdough starter.
 * Decoration: matcha at low opacity, a few dozen at most, stopped as soon as the splash ends.
 */
function startBubbles(canvas: HTMLCanvasElement | null): () => void {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return () => {};

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = (canvas.width = canvas.clientWidth * dpr) / dpr;
  const height = (canvas.height = canvas.clientHeight * dpr) / dpr;
  ctx.scale(dpr, dpr);
  const color = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#5e7a2e";

  type Bubble = { x: number; y: number; r: number; speed: number; sway: number; born: number; life: number; ring: boolean };
  const bubbles: Bubble[] = [];
  const spawn = (now: number) =>
    bubbles.push({
      x: width / 2 + (Math.random() - 0.5) * 140,
      y: height / 2 + 10 + Math.random() * 30,
      r: 1.5 + Math.random() * 4,
      speed: 35 + Math.random() * 55,
      sway: Math.random() * Math.PI * 2,
      born: now,
      life: 1400 + Math.random() * 1200,
      ring: Math.random() < 0.55,
    });

  let frame = 0;
  let lastSpawn = 0;
  const start = performance.now();
  const tick = (now: number) => {
    ctx.clearRect(0, 0, width, height);
    if (now - lastSpawn > 70 && now - start < 1500) {
      spawn(now);
      lastSpawn = now;
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const age = (now - b.born) / b.life;
      if (age >= 1) {
        bubbles.splice(i, 1);
        continue;
      }
      const seconds = (now - b.born) / 1000;
      const x = b.x + Math.sin(seconds * 2.2 + b.sway) * 6;
      const y = b.y - seconds * b.speed;
      // Fade in quickly, out slowly.
      ctx.globalAlpha = 0.32 * Math.min(1, age * 6) * (1 - age);
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, Math.PI * 2);
      if (b.ring) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

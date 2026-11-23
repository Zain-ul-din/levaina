"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/** Drawn at 1/6 size and scaled up by the browser: the upscale blends the bands into soft colour. */
const RESOLUTION = 1 / 6;
const COLOR_VARS = ["--wave-5", "--wave-1", "--wave-2", "--wave-3", "--wave-4"] as const;

/** Each band: where it sits (0–1 of the height), how much it swells, and how fast it drifts. */
const BANDS = [
  { base: 0.2, amp: 0.1, freq: 1.3, speed: 0.11, phase: 0 },
  { base: 0.42, amp: 0.12, freq: 0.9, speed: -0.08, phase: 2.1 },
  { base: 0.62, amp: 0.1, freq: 1.6, speed: 0.13, phase: 4.2 },
  { base: 0.82, amp: 0.09, freq: 1.1, speed: -0.1, phase: 1.3 },
] as const;

function readColors() {
  const style = getComputedStyle(document.documentElement);
  return COLOR_VARS.map((name) => style.getPropertyValue(name).trim() || "#fffdf7");
}

/**
 * Slow, layered waves in the brand's food colours, for the sign-in screen (Stripe-style hero).
 * Decorative only: hidden from screen readers, paused off screen and in background tabs,
 * and a single still frame under reduced motion.
 */
export function WaveCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let colors = readColors();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let visible = true;
    let elapsed = 0;
    let last = performance.now();

    const draw = (t: number) => {
      const { width: w, height: h } = canvas;
      ctx.fillStyle = colors[0];
      ctx.fillRect(0, 0, w, h);
      BANDS.forEach((band, i) => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 1) {
          const u = x / w;
          const y =
            band.base +
            band.amp * Math.sin(u * Math.PI * 2 * band.freq + t * band.speed * 6 + band.phase) +
            band.amp * 0.45 * Math.sin(u * Math.PI * 2 * band.freq * 1.9 - t * band.speed * 9 + band.phase * 1.7);
          ctx.lineTo(x, y * h);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = colors[i + 1];
        ctx.fill();
      });
    };

    const tick = (now: number) => {
      elapsed += Math.min(now - last, 64) / 1000; // clamp so a long pause doesn't jump the waves
      last = now;
      draw(elapsed);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduceMotion || frame || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => {
      canvas.width = Math.max(1, Math.ceil(canvas.clientWidth * RESOLUTION));
      canvas.height = Math.max(1, Math.ceil(canvas.clientHeight * RESOLUTION));
      draw(elapsed);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    visibility.observe(canvas);
    // Theme switch (next-themes toggles the class on <html>): pick up the new colours.
    const theme = new MutationObserver(() => {
      colors = readColors();
      draw(elapsed);
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      theme.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("block blur-[6px]", className)} />;
}

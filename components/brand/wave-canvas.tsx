"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const COLOR_VARS = ["--wave-1", "--wave-2", "--wave-3", "--wave-4"] as const;

/** How the ribbon looks. Tuned by eye on phone and desktop. */
const RIBBON = {
  strands: 42,
  /** Points along each strand; enough for smooth curves at any size. */
  steps: 140,
  /** Full turns of the twist along the visible length. */
  twists: 1.6,
  /** Twist speed in radians per second: slow enough to feel calm. */
  spin: 0.32,
  /** Angle of the ribbon's axis above horizontal (it runs from the bottom edge up to the right edge). */
  angleDeg: 40,
} as const;

type Rgb = [number, number, number];

function parseColor(value: string): Rgb {
  const hex = value.trim().replace("#", "");
  if (hex.length !== 6) return [140, 160, 80];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

function readColors(): Rgb[] {
  const style = getComputedStyle(document.documentElement);
  return COLOR_VARS.map((name) => parseColor(style.getPropertyValue(name)));
}

/** Colour at position 0–1 across the ribbon's width, blended between the four stops. */
function colorAt(colors: Rgb[], t: number): Rgb {
  const scaled = Math.min(0.999, Math.max(0, t)) * (colors.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  return colors[i].map((c, k) => Math.round(c + (colors[i + 1][k] - c) * f)) as Rgb;
}

/**
 * A twisted ribbon of fine strands crossing the bottom-right corner, entering from the bottom edge
 * and leaving through the right (the Stripe hero idea, in the brand's food colours).
 *
 * The 3D is drawn, not rendered: each strand sits at an offset across the ribbon, and the twist
 * turns that offset into a sideways position (cos) and a depth (sin). Strands in front are drawn
 * brighter and thicker, strands behind fainter and thinner, which is what makes flat lines read
 * as a rope turning in space. Decorative: hidden from screen readers, paused off screen and in
 * background tabs, one still frame under reduced motion.
 */
export function WaveCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let colors = readColors();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1;
    let frame = 0;
    let visible = true;
    let elapsed = 0;
    let last = performance.now();

    const draw = (t: number) => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Axis: from below the bottom edge to past the right edge, through the bottom-right corner.
      const size = Math.min(w, h);
      const angle = (RIBBON.angleDeg * Math.PI) / 180;
      const reach = size * (w > h ? 0.78 : 0.95);
      const start = { x: w - reach, y: h };
      const end = { x: w, y: h - reach * Math.tan(angle) };
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      const dir = { x: (end.x - start.x) / length, y: (end.y - start.y) / length };
      const normal = { x: -dir.y, y: dir.x };
      const overhang = size * 0.35; // run past both edges so the ends are never seen
      const from = { x: start.x - dir.x * overhang, y: start.y - dir.y * overhang };
      const span = length + overhang * 2;
      const width = size * (w > h ? 0.2 : 0.26);

      for (let k = 0; k < RIBBON.strands; k++) {
        const across = k / (RIBBON.strands - 1); // 0–1 across the ribbon
        const offset = across - 0.5;
        const [r, g, b] = colorAt(colors, across);

        // Draw each strand in short runs so depth can change along it (alpha and width per run).
        const run = 3;
        for (let i = 0; i < RIBBON.steps; i += run) {
          ctx.beginPath();
          let depthSum = 0;
          for (let j = i; j <= Math.min(i + run, RIBBON.steps); j++) {
            const u = j / RIBBON.steps;
            const theta = u * Math.PI * 2 * RIBBON.twists + t * RIBBON.spin;
            // A gentle bow and a slow breathing wave keep the axis from looking ruler-straight.
            const bow = Math.sin(u * Math.PI) * size * 0.06 + Math.sin(u * 5 + t * 0.4) * size * 0.015;
            const lateral = offset * Math.cos(theta) * width * (0.75 + 0.25 * Math.sin(u * Math.PI));
            const along = u * span;
            const x = from.x + dir.x * along + normal.x * (lateral + bow);
            const y = from.y + dir.y * along + normal.y * (lateral + bow);
            depthSum += offset * 2 * Math.sin(theta); // -1 (behind) … 1 (in front)
            if (j === i) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const front = (depthSum / (run + 1) + 1) / 2; // 0 behind … 1 in front
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.16 + 0.74 * front})`;
          ctx.lineWidth = 0.6 + 1.3 * front;
          ctx.stroke();
        }
      }
    };

    const tick = (now: number) => {
      elapsed += Math.min(now - last, 64) / 1000; // clamp so a long pause doesn't jump the twist
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
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
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

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("block", className)} />;
}

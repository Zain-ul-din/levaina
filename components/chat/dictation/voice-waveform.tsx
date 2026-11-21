"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const BAR_WIDTH = 2;
const BAR_STEP = 4; // bar width + gap
const SAMPLE_INTERVAL_MS = 50; // one new bar every 50 ms
const SILENCE_LEVEL = 0.08; // below this a bar is drawn as a dot
const DOT_SIZE = 2;
const DOT_OPACITY = 0.35;

type VoiceWaveformProps = {
  analyser: AnalyserNode;
  className?: string;
};

/**
 * Scrolling voice level meter: newest sample enters on the right and drifts left.
 * Drawn on a canvas inside requestAnimationFrame, so a 60fps animation causes zero React renders.
 */
export function VoiceWaveform({ analyser, className }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const samples = new Float32Array(analyser.fftSize);
    const levels: number[] = []; // oldest first
    let size = { width: 0, height: 0 };
    let color = "currentColor";
    let lastSampleAt = performance.now();
    let frame = 0;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = { width, height };
      color = getComputedStyle(canvas).color; // follows the theme via text-* classes
    };

    /** Loudness of the latest audio frame, mapped to 0..1 so normal speech fills most of the height. */
    const readLevel = () => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += sample * sample;
      const rms = Math.sqrt(sum / samples.length);
      return Math.min(1, Math.sqrt(rms) * 2);
    };

    const draw = (now: number) => {
      // After a background tab, skip ahead instead of replaying the gap.
      if (now - lastSampleAt > 1000) lastSampleAt = now - SAMPLE_INTERVAL_MS;
      while (now - lastSampleAt >= SAMPLE_INTERVAL_MS) {
        levels.push(readLevel());
        lastSampleAt += SAMPLE_INTERVAL_MS;
      }

      const barCount = Math.ceil(size.width / BAR_STEP) + 1;
      if (levels.length > barCount) levels.splice(0, levels.length - barCount);

      // Fraction of the way to the next sample: shifts bars smoothly between samples.
      const drift = ((now - lastSampleAt) / SAMPLE_INTERVAL_MS) * BAR_STEP;
      const middle = size.height / 2;

      ctx.clearRect(0, 0, size.width, size.height);
      ctx.fillStyle = color;

      for (let i = 0; i < barCount; i++) {
        const x = size.width - BAR_WIDTH - i * BAR_STEP - drift;
        if (x < -BAR_WIDTH) break;

        const level = levels[levels.length - 1 - i];
        if (level === undefined || level < SILENCE_LEVEL) {
          ctx.globalAlpha = DOT_OPACITY;
          ctx.fillRect(x, middle - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
        } else {
          const height = Math.max(DOT_SIZE, level * size.height);
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.roundRect(x, middle - height / 2, BAR_WIDTH, height, BAR_WIDTH / 2);
          ctx.fill();
        }
      }

      frame = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("h-8 w-full text-foreground", className)}
    />
  );
}

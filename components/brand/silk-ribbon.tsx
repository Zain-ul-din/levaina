"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/*
 * Silk ribbons in real 3D (WebGL), after Stripe's hero: several wide sheets that bend, twist and
 * fold across the sign-in band, weaving in front of and behind each other. Each is lit mostly from
 * within (like dyed silk with light behind it) with a soft gloss, soft edges and faint threads.
 *
 * Every ribbon is the same grid of points (along × across). The vertex shader bends each point into
 * place every frame (axis + bow + twist + a slight curl across the width) and works out the surface
 * normal; the fragment shader colours and lights it. One draw per ribbon, sharing the same buffers.
 * Plain WebGL 1, no library.
 */

const ALONG = 200;
const ACROSS = 44;

type Ribbon = {
  /** Three colours across the ribbon's width. */
  colors: [string, string, string];
  /** Where the axis passes through, as fractions of the band (0..1, x from left, y from top). */
  at: [number, number];
  /** Axis angle in degrees (positive rises to the right). */
  angle: number;
  /** Width as a fraction of the band's height. */
  width: number;
  /** Twist: how many radians it turns along its length, and where it starts. */
  twist: number;
  twistStart: number;
  /** Depth: nearer ribbons are drawn in front where they cross. */
  depth: number;
  /** Phase, so the ribbons don't move in step. */
  phase: number;
};

/*
 * The composition. Warm sunrise and cool garden ribbons cross; berry sits between them, so where
 * they overlap the colours meet through pink and violet instead of turning muddy; a thin cream
 * ribbon adds a light accent. Fruit and vegetable colours, kept for the sign-in screen only.
 */
const RIBBONS: Ribbon[] = [
  { colors: ["#ffc53d", "#ff7a2f", "#ff4d8d"], at: [0.42, 0.62], angle: 18, width: 0.62, twist: 4.2, twistStart: -0.4, depth: 0.25, phase: 0 },
  { colors: ["#ff4d8d", "#a93fe0", "#5b6cff"], at: [0.7, 0.4], angle: -14, width: 0.5, twist: 3.6, twistStart: 0.6, depth: -0.1, phase: 2.1 },
  { colors: ["#c3e35a", "#4fd1a5", "#1fa2b8"], at: [0.25, 0.3], angle: -24, width: 0.46, twist: 4.8, twistStart: 1.4, depth: 0.05, phase: 4.3 },
  { colors: ["#fff1a8", "#ffd6a0", "#c9b6ff"], at: [0.62, 0.78], angle: 30, width: 0.2, twist: 5.2, twistStart: 0.2, depth: 0.4, phase: 1.2 },
];

const VERTEX = /* glsl */ `
attribute vec2 a_grid;          // x: 0..1 along, y: -1..1 across
uniform float u_time;
uniform float u_aspect;
uniform vec2 u_anchor;          // view units: x in [-aspect, aspect], y in [-1, 1]
uniform vec2 u_dir;
uniform float u_span;
uniform float u_width;
uniform float u_twist;
uniform float u_twistStart;
uniform float u_depth;
uniform float u_phase;
varying vec3 v_normal;
varying float v_along;
varying float v_across;

vec3 centre(float u) {
  float t = u_time + u_phase;
  vec2 perp = vec2(-u_dir.y, u_dir.x);
  vec2 p = u_anchor + u_dir * (u - 0.5) * u_span;
  p += perp * (sin(u * 3.14159 + t * 0.12) * 0.18 + sin(u * 5.0 + t * 0.3) * 0.05);
  float z = u_depth + 0.35 * sin(u * 3.0 + t * 0.2);
  return vec3(p, z);
}

vec3 sheet(float u, float v) {
  float t = u_time + u_phase;
  vec3 c = centre(u);
  vec3 tangent = normalize(centre(u + 0.002) - c);
  vec3 n = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
  vec3 b = cross(n, tangent);
  float twist = u_twistStart + u_twist * u + 0.45 * sin(t * 0.17 + u * 2.3);
  float w = u_width * (0.8 + 0.2 * sin(u * 3.14159));
  vec3 side = cos(twist) * n + sin(twist) * b;
  vec3 curl = cross(tangent, side);
  return c + side * (v * w) + curl * (v * v * w * 0.22);
}

void main() {
  float u = a_grid.x;
  float v = a_grid.y;
  vec3 p = sheet(u, v);
  vec3 du = sheet(u + 0.003, v) - p;
  vec3 dv = sheet(u, v + 0.01) - p;
  v_normal = normalize(cross(du, dv));
  v_along = u;
  v_across = v;
  float camera = 3.2;
  vec2 xy = p.xy * camera / (camera - p.z);
  gl_Position = vec4(xy.x / u_aspect, xy.y, -p.z * 0.2, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform float u_time;
uniform float u_phase;
uniform float u_pass;            // 0: solid core (writes depth), 1: soft edges (blend only)
varying vec3 v_normal;
varying float v_along;
varying float v_across;

vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0) * 2.0;
  return t < 1.0 ? mix(u_c0, u_c1, t) : mix(u_c1, u_c2, t - 1.0);
}

void main() {
  vec3 n = normalize(v_normal);
  if (!gl_FrontFacing) n = -n;

  float t = (v_across * 0.5 + 0.5) * 0.88 + 0.12 * sin(v_along * 4.0 + (u_time + u_phase) * 0.2);
  vec3 base = palette(t);

  vec3 light = normalize(vec3(-0.35, 0.6, 0.75));
  vec3 view = vec3(0.0, 0.0, 1.0);
  float diffuse = 0.84 + 0.16 * max(dot(n, light), 0.0);
  float gloss = pow(max(dot(n, normalize(light + view)), 0.0), 34.0) * 0.3;
  float sheen = pow(1.0 - abs(n.z), 3.0) * 0.2;
  float threads = 0.5 + 0.5 * sin(v_across * 150.0 + sin(v_along * 14.0) * 1.4);

  vec3 color = base * diffuse * (0.97 + 0.03 * threads);
  float grey = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(grey), color, 1.15);
  color += vec3(gloss + sheen);
  if (!gl_FrontFacing) color *= 0.86;

  float edge = smoothstep(1.0, 0.78, abs(v_across));
  // Split by pass so see-through edges never hide what's behind them (no dark slashes at crossings).
  if (u_pass < 0.5 && edge < 0.999) discard;
  if (u_pass > 0.5 && edge >= 0.999) discard;
  float alpha = edge * 0.95;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader error");
  return shader;
}

function buildGrid() {
  const points = new Float32Array((ALONG + 1) * (ACROSS + 1) * 2);
  let k = 0;
  for (let i = 0; i <= ALONG; i++) {
    for (let j = 0; j <= ACROSS; j++) {
      points[k++] = i / ALONG;
      points[k++] = (j / ACROSS) * 2 - 1;
    }
  }
  const indices = new Uint16Array(ALONG * ACROSS * 6);
  k = 0;
  for (let i = 0; i < ALONG; i++) {
    for (let j = 0; j < ACROSS; j++) {
      const a = i * (ACROSS + 1) + j;
      const b = a + ACROSS + 1;
      indices.set([a, b, a + 1, a + 1, b, b + 1], k);
      k += 6;
    }
  }
  return { points, indices };
}

/**
 * The sign-in band's decoration. Hidden from screen readers; paused off screen and in background
 * tabs; a single still frame under reduced motion; renders nothing if WebGL isn't available.
 */
export function SilkRibbon({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { premultipliedAlpha: true, antialias: true, alpha: true });
    if (!canvas || !gl) return;

    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link error");
    } catch (error) {
      console.warn("Silk ribbons disabled:", error);
      return;
    }
    gl.useProgram(program);

    const { points, indices } = buildGrid();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    const grid = gl.getAttribLocation(program, "a_grid");
    gl.enableVertexAttribArray(grid);
    gl.vertexAttribPointer(grid, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const loc = (name: string) => gl.getUniformLocation(program, name);
    const u = {
      time: loc("u_time"),
      aspect: loc("u_aspect"),
      anchor: loc("u_anchor"),
      dir: loc("u_dir"),
      span: loc("u_span"),
      width: loc("u_width"),
      twist: loc("u_twist"),
      twistStart: loc("u_twistStart"),
      depth: loc("u_depth"),
      phase: loc("u_phase"),
      pass: loc("u_pass"),
      c0: loc("u_c0"),
      c1: loc("u_c1"),
      c2: loc("u_c2"),
    };
    const ribbonColors = RIBBONS.map((ribbon) => ribbon.colors.map(hexToRgb));
    // Far to near, so soft edges blend over what's behind them.
    const drawOrder = RIBBONS.map((_, i) => i).sort((a, b) => RIBBONS[a].depth - RIBBONS[b].depth);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let aspect = 1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let visible = true;
    let elapsed = 6; // start mid-motion, so the first frame already shows folds
    let last = performance.now();

    const draw = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(u.time, elapsed);
      gl.uniform1f(u.aspect, aspect);
      // Long enough to cross the band at any angle, with the ends well off screen.
      gl.uniform1f(u.span, aspect * 2 + 2.4);
      const drawRibbon = (i: number) => {
        const ribbon = RIBBONS[i];
        const rad = (ribbon.angle * Math.PI) / 180;
        gl.uniform2f(u.anchor, (ribbon.at[0] * 2 - 1) * aspect, 1 - ribbon.at[1] * 2);
        gl.uniform2f(u.dir, Math.cos(rad), Math.sin(rad));
        gl.uniform1f(u.width, ribbon.width);
        gl.uniform1f(u.twist, ribbon.twist);
        gl.uniform1f(u.twistStart, ribbon.twistStart);
        gl.uniform1f(u.depth, ribbon.depth);
        gl.uniform1f(u.phase, ribbon.phase);
        gl.uniform3fv(u.c0, ribbonColors[i][0]);
        gl.uniform3fv(u.c1, ribbonColors[i][1]);
        gl.uniform3fv(u.c2, ribbonColors[i][2]);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      };
      // Pass 1: solid cores, which decide what's in front. Pass 2: soft edges, blended, depth read-only.
      gl.depthMask(true);
      gl.uniform1f(u.pass, 0);
      drawOrder.forEach(drawRibbon);
      gl.depthMask(false);
      gl.uniform1f(u.pass, 1);
      drawOrder.forEach(drawRibbon);
      gl.depthMask(true);
    };
    const tick = (now: number) => {
      elapsed += Math.min(now - last, 64) / 1000;
      last = now;
      draw();
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      aspect = canvas.width / canvas.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    visibility.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const onLost = (event: Event) => {
      event.preventDefault();
      stop();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    resize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("block", className)} />;
}

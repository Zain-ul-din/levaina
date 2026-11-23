"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/*
 * A silk ribbon in real 3D (WebGL), after Stripe's hero: a wide sheet that bends, twists and folds
 * through the bottom-right corner, lit with soft diffuse light and a glossy highlight, its colours
 * blending across the width, fine threads running along it like silk.
 *
 * The sheet is a grid of points (along × across). The vertex shader bends every point into place
 * each frame (centre curve + twist + a slight curl across the width) and works out the surface
 * normal; the fragment shader lights and colours it. No library: plain WebGL 1.
 */

const ALONG = 220; // grid resolution along the ribbon
const ACROSS = 56; // and across it
const COLOR_VARS = ["--ribbon-1", "--ribbon-2", "--ribbon-3", "--ribbon-4", "--ribbon-5"] as const;

const VERTEX = /* glsl */ `
attribute vec2 a_grid;          // x: 0..1 along, y: -1..1 across
uniform float u_time;
uniform float u_aspect;
uniform vec2 u_anchor;          // a point the ribbon's axis passes through (view units)
uniform vec2 u_dir;             // axis direction (unit)
uniform float u_width;
varying vec3 v_normal;
varying float v_along;
varying float v_across;

// Centre line: a straight axis through the corner, with a soft bow and a slow drift in depth.
vec3 centre(float u) {
  vec2 perp = vec2(-u_dir.y, u_dir.x);
  vec2 p = u_anchor + u_dir * (u * 3.8 - 2.2);
  p += perp * (sin(u * 3.14159) * 0.22 + sin(u * 5.0 + u_time * 0.3) * 0.04);
  float z = 0.6 * sin(u * 3.0 + u_time * 0.21);
  return vec3(p, z);
}

// A point on the sheet: the width vector turns around the centre line (the twist),
// and the sheet curls a little across its width so it reads as cloth, not card.
vec3 sheet(float u, float v) {
  vec3 c = centre(u);
  vec3 t = normalize(centre(u + 0.002) - c);
  vec3 n = normalize(cross(t, vec3(0.0, 0.0, 1.0)));
  vec3 b = cross(n, t);
  float twist = -0.6 + 5.4 * u + 0.5 * sin(u_time * 0.17 + u * 2.3);
  float w = u_width * (0.8 + 0.2 * sin(u * 3.14159));
  vec3 side = cos(twist) * n + sin(twist) * b;
  vec3 curl = cross(t, side);
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
  // Gentle perspective: nearer parts grow a little.
  float camera = 3.2;
  vec2 xy = p.xy * camera / (camera - p.z);
  gl_Position = vec4(xy.x / u_aspect, xy.y, -p.z * 0.25, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
uniform float u_time;
uniform float u_dark;
varying vec3 v_normal;
varying float v_along;
varying float v_across;

vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0) * 4.0;
  if (t < 1.0) return mix(u_c0, u_c1, t);
  if (t < 2.0) return mix(u_c1, u_c2, t - 1.0);
  if (t < 3.0) return mix(u_c2, u_c3, t - 2.0);
  return mix(u_c3, u_c4, t - 3.0);
}

void main() {
  vec3 n = normalize(v_normal);
  if (!gl_FrontFacing) n = -n;

  // Colour runs across the width, drifting slowly along the length.
  float t = (v_across * 0.5 + 0.5) * 0.9 + 0.1 * sin(v_along * 4.0 + u_time * 0.2);
  vec3 base = palette(t);

  vec3 light = normalize(vec3(-0.35, 0.6, 0.75));
  vec3 view = vec3(0.0, 0.0, 1.0);
  // Mostly self-lit, like dyed silk with light behind it: shading only shapes the folds,
  // it never drags the colour down to brown. The highlight does most of the 3D work.
  float diffuse = 0.84 + 0.16 * max(dot(n, light), 0.0);
  float gloss = pow(max(dot(n, normalize(light + view)), 0.0), 34.0) * 0.32;
  float sheen = pow(1.0 - abs(n.z), 3.0) * 0.22;
  // Threads along the length, wavering slightly, like silk (coarse enough not to shimmer on phones).
  float threads = 0.5 + 0.5 * sin(v_across * 170.0 + sin(v_along * 14.0) * 1.4);

  vec3 color = base * diffuse * (0.97 + 0.03 * threads);
  float grey = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(grey), color, 1.18); // a slight saturation lift
  color += vec3(gloss + sheen);
  if (!gl_FrontFacing) color *= 0.86; // the underside of a fold sits in light shade

  float edge = smoothstep(1.0, 0.8, abs(v_across)); // soft edges, no hard cut
  float alpha = edge * 0.97;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

function hexToRgb(value: string): [number, number, number] {
  const hex = value.trim().replace("#", "");
  if (hex.length !== 6) return [1, 0.6, 0.3];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader error");
  return shader;
}

/** Grid of points and the triangles joining them. */
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
 * The sign-in screen's decoration. Hidden from screen readers; paused off screen and in background
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
      console.warn("Silk ribbon disabled:", error);
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

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uTime = uniform("u_time");
    const uAspect = uniform("u_aspect");
    const uAnchor = uniform("u_anchor");
    const uDir = uniform("u_dir");
    const uWidth = uniform("u_width");
    const uDark = uniform("u_dark");

    const applyTheme = () => {
      const style = getComputedStyle(document.documentElement);
      COLOR_VARS.forEach((name, i) => gl.uniform3fv(uniform(`u_c${i}`), hexToRgb(style.getPropertyValue(name))));
      gl.uniform1f(uDark, document.documentElement.classList.contains("dark") ? 1 : 0);
    };

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // The axis crosses the bottom-right corner at ~40°: in from the bottom edge, out the right edge.
    const angle = (40 * Math.PI) / 180;
    const layout = () => {
      const aspect = canvas.width / canvas.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uAspect, aspect);
      const phone = aspect < 0.8;
      // On a phone the form fills the width, so the ribbon stays low, below it.
      gl.uniform2f(uAnchor, aspect * (phone ? 0.55 : 0.55), phone ? -0.98 : -0.7);
      gl.uniform2f(uDir, Math.cos(angle), Math.sin(angle));
      gl.uniform1f(uWidth, phone ? 0.4 : 0.62);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let visible = true;
    let elapsed = 4; // start mid-motion, so the first frame already has a fold in view
    let last = performance.now();

    const draw = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(uTime, elapsed);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
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
      layout();
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
    const theme = new MutationObserver(() => {
      applyTheme();
      draw();
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const onLost = (event: Event) => {
      event.preventDefault();
      stop();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    applyTheme();
    resize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      theme.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("block", className)} />;
}

"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/*
 * Glossy 3D tubes in WebGL for the sign-in band: they run side by side along the band's slanted edge
 * (rising to the top right), bending together so they never touch, while colour bands spiral round
 * each tube like a twisted rope and slowly turn. The twist lives on the surface, not in the paths,
 * which is what keeps them from crossing.
 *
 * Every tube is the same grid (along × around). The vertex shader wraps it round a shared curve,
 * offset sideways per tube; the fragment shader colours the spiral and lights the tube (diffuse,
 * a glossy highlight and a soft rim). Plain WebGL 1, no library.
 */

const ALONG = 180;
const AROUND = 40;

type Pipe = {
  /** Three colours that spiral round the tube (cycled). */
  colors: [string, string, string];
  /** Phase of the spiral, so neighbours don't line up stripe for stripe. */
  phase: number;
};

/**
 * Top to bottom; neighbours share a colour so the stack reads as one gradient:
 * berry, sunrise, citrus, garden, cream.
 */
const PIPES: Pipe[] = [
  { colors: ["#5b6cff", "#a93fe0", "#ff4d8d"], phase: 0.0 },
  { colors: ["#ff4d8d", "#ff7a2f", "#ffc53d"], phase: 0.21 },
  { colors: ["#ffc53d", "#d8ec5a", "#7fd88a"], phase: 0.42 },
  { colors: ["#4fd1a5", "#1fa2b8", "#5b6cff"], phase: 0.63 },
  { colors: ["#fff1a8", "#ffd6a0", "#c9b6ff"], phase: 0.84 },
];

/** Tube radius and the gap between tubes, in view units (the band is 2 units tall). */
const RADIUS = 0.15;
const GAP = 0.05;
/** How many times the colour spiral wraps round a tube along its visible length. */
const TURNS = 3.0;

const VERTEX = /* glsl */ `
attribute vec2 a_grid;            // x: 0..1 along, y: 0..1 around
uniform float u_time;
uniform float u_aspect;
uniform vec2 u_anchor;
uniform vec2 u_dir;
uniform float u_span;
uniform float u_offset;           // sideways offset of this tube from the bundle's centre line
uniform float u_radius;
varying vec3 v_normal;
varying float v_along;
varying float v_around;

// The shared path: every tube follows the same curve, shifted sideways, so they stay parallel.
vec3 path(float u) {
  vec2 perp = vec2(-u_dir.y, u_dir.x);
  vec2 p = u_anchor + u_dir * (u - 0.5) * u_span;
  float bend = sin(u * 3.14159 + u_time * 0.12) * 0.1 + sin(u * 4.0 + u_time * 0.25) * 0.03;
  p += perp * (bend + u_offset);
  return vec3(p, 0.0);
}

void main() {
  float u = a_grid.x;
  float angle = a_grid.y * 6.2831853;
  vec3 c = path(u);
  vec3 tangent = normalize(path(u + 0.002) - c);
  vec3 side = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
  vec3 up = cross(side, tangent);
  vec3 normal = cos(angle) * side + sin(angle) * up;
  vec3 p = c + normal * u_radius;
  v_normal = normal;
  v_along = u;
  v_around = a_grid.y;
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
uniform float u_turns;
varying vec3 v_normal;
varying float v_along;
varying float v_around;

// Three colours in a loop, blended smoothly, so the spiral has no seam.
vec3 loopPalette(float t) {
  t = fract(t) * 3.0;
  if (t < 1.0) return mix(u_c0, u_c1, smoothstep(0.0, 1.0, t));
  if (t < 2.0) return mix(u_c1, u_c2, smoothstep(0.0, 1.0, t - 1.0));
  return mix(u_c2, u_c0, smoothstep(0.0, 1.0, t - 2.0));
}

void main() {
  vec3 n = normalize(v_normal);
  // Spiral: position round the tube plus distance along it, drifting slowly so the rope turns.
  float spiral = v_around + v_along * u_turns - u_time * 0.06 + u_phase;
  vec3 base = loopPalette(spiral);

  vec3 light = normalize(vec3(-0.3, 0.65, 0.7));
  vec3 view = vec3(0.0, 0.0, 1.0);
  float diffuse = 0.62 + 0.38 * max(dot(n, light), 0.0);
  float gloss = pow(max(dot(n, normalize(light + view)), 0.0), 48.0) * 0.55;
  float rim = pow(1.0 - max(n.z, 0.0), 3.0) * 0.12;

  vec3 color = base * diffuse;
  float grey = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(grey), color, 1.15);
  color += vec3(gloss) + rim;
  gl_FragColor = vec4(color, 1.0);
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
  const points = new Float32Array((ALONG + 1) * (AROUND + 1) * 2);
  let k = 0;
  for (let i = 0; i <= ALONG; i++) {
    for (let j = 0; j <= AROUND; j++) {
      points[k++] = i / ALONG;
      points[k++] = j / AROUND;
    }
  }
  const indices = new Uint16Array(ALONG * AROUND * 6);
  k = 0;
  for (let i = 0; i < ALONG; i++) {
    for (let j = 0; j < AROUND; j++) {
      const a = i * (AROUND + 1) + j;
      const b = a + AROUND + 1;
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
export function ColorPipes({ className }: { className?: string }) {
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
      console.warn("Colour pipes disabled:", error);
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
      offset: loc("u_offset"),
      radius: loc("u_radius"),
      phase: loc("u_phase"),
      turns: loc("u_turns"),
      c0: loc("u_c0"),
      c1: loc("u_c1"),
      c2: loc("u_c2"),
    };
    const pipeColors = PIPES.map((pipe) => pipe.colors.map(hexToRgb));

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0, 0, 0, 0);

    let aspect = 1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let visible = true;
    let elapsed = 4;
    let last = performance.now();

    const draw = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // The flow follows the band's slanted bottom edge (it rises 28% of the band's height across
      // the width), a little steeper so it reads as a diagonal sweep toward the top right.
      const angle = Math.atan((0.28 / aspect) * 1.35);
      gl.uniform1f(u.time, elapsed);
      gl.uniform1f(u.aspect, aspect);
      gl.uniform2f(u.dir, Math.cos(angle), Math.sin(angle));
      gl.uniform2f(u.anchor, 0, 0.14); // the bundle's centre, a little above the middle, clear of the cut
      gl.uniform1f(u.span, aspect * 2 + 2.4); // ends well off screen
      gl.uniform1f(u.radius, RADIUS);
      gl.uniform1f(u.turns, TURNS);
      const pitch = RADIUS * 2 + GAP;
      PIPES.forEach((pipe, i) => {
        // First pipe on top; perp points up-left of the flow, so a positive offset is higher.
        gl.uniform1f(u.offset, ((PIPES.length - 1) / 2 - i) * pitch);
        gl.uniform1f(u.phase, pipe.phase);
        gl.uniform3fv(u.c0, pipeColors[i][0]);
        gl.uniform3fv(u.c1, pipeColors[i][1]);
        gl.uniform3fv(u.c2, pipeColors[i][2]);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      });
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

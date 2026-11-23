"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/*
 * A rope of glossy 3D pipes in WebGL for the sign-in band: five solid-coloured pipes wound round
 * one shared centre line, like the strands of a rope. The rope runs along the band's slanted edge
 * (rising to the top right) and slowly turns, so each pipe passes in front of and behind its
 * neighbours. Pipe thickness comes from the rope's size, so strands sit snug without cutting
 * into each other.
 *
 * Every pipe is the same grid (along × around). The vertex shader puts the grid on a helix round
 * the rope's axis and wraps it into a tube; the fragment shader lights it (diffuse, a glossy
 * highlight, a soft rim). Plain WebGL 1, no library.
 */

const ALONG = 260;
const AROUND = 32;

/** One solid colour per pipe: blueberry, guava, mango, saffron, lime. */
const PIPE_COLORS = ["#5b6cff", "#ff4d8d", "#ff7a2f", "#ffc53d", "#9fd04a"];

/** Distance from the rope's axis to each pipe's centre, in view units (the band is 2 tall). */
const ROPE_RADIUS = 0.3;
/** Pipes a little thinner than would touch, leaving room for each to surge and lag on its own. */
const PIPE_RADIUS = ROPE_RADIUS * Math.sin(Math.PI / PIPE_COLORS.length) * 0.82;
/**
 * How far (radians round the rope) a pipe may slip ahead of or behind its place. Kept under half
 * the free angle between neighbours, so even two neighbours slipping toward each other can't touch.
 */
const SURGE = (() => {
  const free = (Math.PI * 2) / PIPE_COLORS.length - 2 * Math.asin(PIPE_RADIUS / ROPE_RADIUS);
  return free * 0.45;
})();
/** Each pipe's own surge speed and timing, so no two move in step. */
const SURGE_SPEEDS = [0.9, 1.45, 0.7, 1.2, 1.7];
const SURGE_PHASES = [0.0, 2.3, 4.1, 1.1, 5.2];
/** Turns of the rope along its whole length (most of it is visible). */
const TWIST = 2.2 * Math.PI * 2;

const VERTEX = /* glsl */ `
attribute vec2 a_grid;            // x: 0..1 along, y: 0..1 around the pipe
uniform float u_time;
uniform float u_aspect;
uniform vec2 u_anchor;
uniform vec2 u_dir;
uniform float u_span;
uniform float u_ropeRadius;
uniform float u_pipeRadius;
uniform float u_twist;
uniform float u_strand;           // this pipe's starting angle round the rope
uniform float u_surge;            // how far it may slip ahead or behind
uniform float u_surgeSpeed;       // its own pace
uniform float u_surgePhase;       // and timing
varying vec3 v_normal;

// The rope's axis: along the slanted edge, with a gentle bend.
vec3 axis(float u) {
  vec2 perp = vec2(-u_dir.y, u_dir.x);
  vec2 p = u_anchor + u_dir * (u - 0.5) * u_span;
  p += perp * (sin(u * 3.14159 + u_time * 0.1) * 0.08);
  return vec3(p, 0.0);
}

// This pipe's centre line: a helix round the axis, turning slowly over time.
vec3 strand(float u) {
  vec3 c = axis(u);
  vec3 tangent = normalize(axis(u + 0.002) - c);
  vec3 side = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
  vec3 up = cross(side, tangent);
  // The shared turn, plus this pipe's own surge and lag (varying along its length too),
  // so each strand looks like it moves on its own.
  float a = u_strand + u * u_twist + u_time * 0.35
          + u_surge * sin(u_time * u_surgeSpeed + u * 2.5 + u_surgePhase);
  return c + u_ropeRadius * (cos(a) * side + sin(a) * up);
}

void main() {
  float u = a_grid.x;
  float around = a_grid.y * 6.2831853;
  vec3 s = strand(u);
  vec3 tangent = normalize(strand(u + 0.001) - s);
  vec3 side = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
  vec3 up = cross(side, tangent);
  vec3 normal = cos(around) * side + sin(around) * up;
  vec3 p = s + normal * u_pipeRadius;
  v_normal = normal;
  float camera = 3.4;
  vec2 xy = p.xy * camera / (camera - p.z);
  gl_Position = vec4(xy.x / u_aspect, xy.y, -p.z * 0.4, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 u_color;
varying vec3 v_normal;

void main() {
  vec3 n = normalize(v_normal);
  vec3 light = normalize(vec3(-0.3, 0.65, 0.7));
  vec3 view = vec3(0.0, 0.0, 1.0);
  float diffuse = 0.55 + 0.45 * max(dot(n, light), 0.0);
  float gloss = pow(max(dot(n, normalize(light + view)), 0.0), 60.0) * 0.6;
  float rim = pow(1.0 - max(n.z, 0.0), 3.0) * 0.1;
  vec3 color = u_color * diffuse;
  float grey = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(grey), color, 1.12);
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
      console.warn("Pipe rope disabled:", error);
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
      ropeRadius: loc("u_ropeRadius"),
      pipeRadius: loc("u_pipeRadius"),
      twist: loc("u_twist"),
      strand: loc("u_strand"),
      surge: loc("u_surge"),
      surgeSpeed: loc("u_surgeSpeed"),
      surgePhase: loc("u_surgePhase"),
      color: loc("u_color"),
    };
    const pipeColors = PIPE_COLORS.map(hexToRgb);

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
      gl.uniform2f(u.anchor, 0, 0.12); // the rope's centre, a little above the middle, clear of the cut
      gl.uniform1f(u.span, aspect * 2 + 2.4); // ends well off screen
      gl.uniform1f(u.ropeRadius, ROPE_RADIUS);
      gl.uniform1f(u.pipeRadius, PIPE_RADIUS);
      gl.uniform1f(u.twist, TWIST);
      gl.uniform1f(u.surge, SURGE);
      pipeColors.forEach((color, i) => {
        gl.uniform1f(u.strand, (i / pipeColors.length) * Math.PI * 2);
        gl.uniform1f(u.surgeSpeed, SURGE_SPEEDS[i % SURGE_SPEEDS.length]);
        gl.uniform1f(u.surgePhase, SURGE_PHASES[i % SURGE_PHASES.length]);
        gl.uniform3fv(u.color, color);
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

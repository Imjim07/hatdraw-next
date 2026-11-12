"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

// SpecularButton (React Bits), ported to TypeScript and adapted for HatDraw:
// - One shared WebGL2 context renders every button, then each frame is copied
//   onto the button's own 2D canvas. Browsers cap live WebGL contexts at ~16,
//   and the results list can hold dozens of buttons.
// - `href` renders a link (next/link for internal paths) instead of a <button>.
// - Line/base colours default to the --sb-line / --sb-base CSS variables, so
//   each .btn variant sets its own (see globals.css).
// - With reduced motion the shine stays at rest: no pointer-follow, no flash.

const PAD = 24;
const TAU = Math.PI * 2;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uRadius;
uniform float uPx;
uniform float uSpot;
uniform vec2 uEntry;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform vec2 uWindow;
uniform float uThickness;
uniform float uGlow;
out vec4 outColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float loopPosition(vec2 p, vec2 b, float r) {
  vec2 inner = b - r;
  float arc = 1.5707963 * r;
  float quarter = inner.x + inner.y + arc;
  vec2 a = abs(p);
  vec2 q = a - inner;
  float s = q.x > 0.0 && q.y > 0.0
    ? inner.y + atan(q.y, q.x) * r
    : (q.x > q.y ? min(a.y, inner.y) : inner.y + arc + inner.x - min(a.x, inner.x));
  if (p.x < 0.0) s = p.y >= 0.0 ? 2.0 * quarter - s : 2.0 * quarter + s;
  else if (p.y < 0.0) s = 4.0 * quarter - s;
  return s / max(4.0 * quarter, 0.0001);
}

float lobe(float position, float center) {
  float gap = abs(fract(position - center + 0.5) - 0.5);
  return 1.0 - smoothstep(uWindow.x, uWindow.x + uWindow.y, gap);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = roundedBox(p, uHalf, uRadius);
  float position = loopPosition(p, uHalf, uRadius);
  float key = lobe(position, uSpot);
  float back = lobe(position, uSpot + 0.5);
  float streak = key + back * 0.45;
  float width = max(uThickness * uPx * mix(1.0, max(key, back), 0.6), 0.35);
  float band = smoothstep(-width - 0.6, -width + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float hair = smoothstep(-uPx - 0.6, -uPx + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float inside = 1.0 - smoothstep(-0.6, 0.6, d);
  vec2 pool = (p - uEntry) / (uHalf.y * vec2(1.6, 1.1));
  float glow = streak * 0.2 * exp(-abs(d + width * 0.5) / (5.0 * uPx)) + inside * 0.08 * exp(-dot(pool, pool));
  float light = clamp((band * streak + glow * uGlow) * uIntensity, 0.0, 1.0);
  vec4 base = vec4(uBaseColor, 1.0) * hair * 0.6;
  outColor = vec4(uLineColor, 1.0) * light + base * (1.0 - light);
}`;

const UNIFORMS = ["uCenter", "uHalf", "uRadius", "uPx", "uSpot", "uEntry", "uLineColor", "uBaseColor", "uIntensity", "uWindow", "uThickness", "uGlow"] as const;
type UniformName = (typeof UNIFORMS)[number];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const wrap = (v: number) => v - Math.floor(v);

const loopPosition = (x: number, y: number, halfX: number, halfY: number, r: number) => {
  const innerX = halfX - r, innerY = halfY - r;
  const arc = (Math.PI / 2) * r;
  const quarter = innerX + innerY + arc;
  const ax = Math.abs(x), ay = Math.abs(y);
  const qx = ax - innerX, qy = ay - innerY;
  let s;
  if (qx > 0 && qy > 0) s = innerY + Math.atan2(qy, qx) * r;
  else if (qx > qy) s = Math.min(ay, innerY);
  else s = innerY + arc + innerX - Math.min(ax, innerX);
  if (x < 0) s = y >= 0 ? 2 * quarter - s : 2 * quarter + s;
  else if (y < 0) s = 4 * quarter - s;
  return wrap(s / Math.max(4 * quarter, 0.0001));
};

const rimPoint = (position: number, halfX: number, halfY: number, r: number): [number, number] => {
  const innerX = halfX - r, innerY = halfY - r;
  const arc = (Math.PI / 2) * r;
  const quarter = innerX + innerY + arc;
  let s = wrap(position) * 4 * quarter;
  let signX = 1, signY = 1;
  if (s > 3 * quarter) { s = 4 * quarter - s; signY = -1; }
  else if (s > 2 * quarter) { s -= 2 * quarter; signX = -1; signY = -1; }
  else if (s > quarter) { s = 2 * quarter - s; signX = -1; }
  let x = innerX - (s - innerY - arc);
  let y = halfY;
  if (s <= innerY) { x = halfX; y = s; }
  else if (s <= innerY + arc) {
    const angle = (s - innerY) / Math.max(r, 0.0001);
    x = innerX + Math.cos(angle) * r;
    y = innerY + Math.sin(angle) * r;
  }
  return [x * signX, y * signY];
};

// ---- One WebGL2 context for every button on the page ----
type Renderer = {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  u: Record<UniformName, WebGLUniformLocation | null>;
};
let shared: Renderer | null | undefined;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function renderer(): Renderer | null {
  if (shared !== undefined && !shared?.gl.isContextLost()) return shared;
  shared = null;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) as Renderer["u"];
  shared = { gl, canvas, program, vao, u };
  return shared;
}

let probe: CanvasRenderingContext2D | null | undefined;
const rgbCache = new Map<string, [number, number, number]>();
function toRgb(value: string): [number, number, number] {
  const hit = rgbCache.get(value);
  if (hit) return hit;
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  let rgb: [number, number, number] = [1, 1, 1];
  if (probe) {
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = "#000000";
    probe.fillStyle = value;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    rgb = [r / 255, g / 255, b / 255];
  }
  rgbCache.set(value, rgb);
  return rgb;
}

type Common = {
  children?: ReactNode;
  /** Adds the React Bits size class (padding/font). Omit to size with your own classes. */
  size?: "sm" | "md" | "lg";
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
  /** Defaults to the element's --sb-line CSS variable. */
  lineColor?: string;
  /** Defaults to the element's --sb-base CSS variable. */
  baseColor?: string;
  intensity?: number;
  idleIntensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  glow?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  className?: string;
  style?: CSSProperties;
};
type AsButton = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common> & { href?: undefined };
type AsLink = Common & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Common> & { href: string; disabled?: undefined };
export type SpecularButtonProps = AsButton | AsLink;

export default function SpecularButton(props: SpecularButtonProps) {
  const {
    children, size, radius = 999, tint, tintOpacity, blur, textColor, lineColor, baseColor,
    intensity = 1, idleIntensity = 0.35, shineSize = 10, shineFade = 34, thickness = 1.2, glow = 1,
    speed = 0.35, followMouse = true, proximity = 250, autoAnimate = false, className = "", style, ...rest
  } = props;
  const disabled = "disabled" in props ? !!props.disabled : false;
  const elRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings = {
    radius: Math.max(0, radius), lineColor, baseColor,
    intensity: Math.max(0, intensity), idleIntensity: clamp(idleIntensity, 0, 1),
    shineSize: Math.max(0, shineSize), shineFade: Math.max(0, shineFade),
    thickness: Math.max(0, thickness), glow: Math.max(0, glow), speed, followMouse,
    proximity: Math.max(1, proximity), autoAnimate, disabled,
  };
  const settingsRef = useRef(settings);

  // Keep the loop's settings current and redraw after every render.
  useEffect(() => {
    settingsRef.current = settings;
    wakeRef.current?.();
  });

  useEffect(() => {
    const el = elRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!el || !canvas || !ctx || !renderer()) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const view = { width: 1, height: 1, ratio: 1 };
    const pointer = { x: 0, y: 0, known: false };
    const state = { spot: 0, level: 0, press: 0, ready: false };
    const colors = { line: "#ffffff", base: "#525252" };
    let raf = 0, last = 0, visible = true;

    const readColors = () => {
      const cs = getComputedStyle(el);
      const s = settingsRef.current;
      colors.line = s.lineColor ?? (cs.getPropertyValue("--sb-line").trim() || "#ffffff");
      colors.base = s.baseColor ?? (cs.getPropertyValue("--sb-base").trim() || "#525252");
    };
    const cornerRadius = (s: typeof settings) => Math.min(s.radius, view.width / 2, view.height / 2);
    const restSpot = (s: typeof settings) => {
      const r = cornerRadius(s);
      const inset = r * (1 - Math.SQRT1_2);
      return loopPosition(inset - view.width / 2, view.height / 2 - inset, view.width / 2, view.height / 2, r);
    };

    const aim = (s: typeof settings) => {
      if (!s.followMouse || s.disabled || reduce || !pointer.known) return null;
      const rect = el.getBoundingClientRect();
      const scale = rect.width / view.width || 1;
      const halfX = view.width / 2, halfY = view.height / 2;
      const x = (pointer.x - rect.left - rect.width / 2) / scale;
      const y = (rect.top + rect.height / 2 - pointer.y) / scale;
      const distance = Math.hypot(Math.max(Math.abs(x) - halfX, 0), Math.max(Math.abs(y) - halfY, 0));
      const t = clamp(1 - distance / s.proximity, 0, 1);
      const near = t * t * (3 - 2 * t);
      const nearest = loopPosition(x, y, halfX, halfY, cornerRadius(s));
      if (distance > 0) return { spot: nearest, near };
      const depth = clamp(Math.min(halfX - Math.abs(x), halfY - Math.abs(y)) / (halfY * 0.8), 0, 1);
      const sway = restSpot(s) - (x / halfX) * 0.06 - (y / halfY) * 0.02;
      const offset = sway - nearest - Math.round(sway - nearest);
      return { spot: wrap(nearest + offset * depth * depth * (3 - 2 * depth)), near };
    };

    const draw = (s: typeof settings) => {
      const R = renderer();
      if (!R) return;
      const { gl, u } = R;
      const { width, height } = view;
      const cw = canvas.width, ch = canvas.height;
      // Grow the shared canvas as needed; draw into its bottom-left corner.
      if (R.canvas.width < cw || R.canvas.height < ch) {
        R.canvas.width = Math.max(R.canvas.width, cw);
        R.canvas.height = Math.max(R.canvas.height, ch);
      }
      const scaleX = cw / (width + PAD * 2), scaleY = ch / (height + PAD * 2);
      gl.viewport(0, 0, cw, ch);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(0, 0, cw, ch);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(R.program);
      gl.uniform2f(u.uCenter, (PAD + width / 2) * scaleX, (PAD + height / 2) * scaleY);
      gl.uniform2f(u.uHalf, (width / 2) * scaleX, (height / 2) * scaleY);
      const r = Math.min(s.radius, width / 2, height / 2);
      gl.uniform1f(u.uRadius, r * scaleX);
      gl.uniform1f(u.uPx, view.ratio);
      const [rimX, rimY] = rimPoint(state.spot, width / 2, height / 2, r);
      const len = Math.max(Math.hypot(rimX, rimY), 0.0001);
      const pull = 1 - Math.min(0.35 * (height / 2), len) / len;
      gl.uniform1f(u.uSpot, state.spot);
      gl.uniform2f(u.uEntry, rimX * pull * scaleX, rimY * pull * scaleY);
      gl.uniform3fv(u.uLineColor, toRgb(colors.line));
      gl.uniform3fv(u.uBaseColor, toRgb(colors.base));
      gl.uniform1f(u.uIntensity, s.intensity * (state.level + state.press * 0.8));
      gl.uniform2f(u.uWindow, s.shineSize / 360 + state.press * 0.06, s.shineFade / 360 + 0.0001);
      gl.uniform1f(u.uThickness, s.thickness);
      gl.uniform1f(u.uGlow, s.glow);
      gl.bindVertexArray(R.vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      gl.disable(gl.SCISSOR_TEST);
      // Copy out in the same task, before the shared buffer is reused.
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(R.canvas, 0, R.canvas.height - ch, cw, ch, 0, 0, cw, ch);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = aim(s);
      const spinning = s.autoAnimate && !reduce;
      const steering = !!target && target.near > 0;
      if (!state.ready) {
        state.spot = restSpot(s);
        state.level = s.autoAnimate ? 1 : s.idleIntensity;
        state.ready = true;
      }
      let diff = 0;
      if (spinning && !steering) state.spot = wrap(state.spot + (s.speed / TAU) * dt);
      else {
        diff = (steering ? target.spot : restSpot(s)) - state.spot;
        diff -= Math.round(diff);
        state.spot = wrap(state.spot + diff * (1 - Math.exp(-dt * 8)));
      }
      const level = s.autoAnimate ? 1 : s.idleIntensity + (1 - s.idleIntensity) * (target ? target.near : 0);
      state.level += (level - state.level) * (1 - Math.exp(-dt * 7));
      state.press *= Math.exp(-dt * 5);
      draw(s);
      const settling = Math.abs(diff) > 0.0002 || Math.abs(level - state.level) > 0.001 || state.press > 0.002;
      if (settling || (spinning && !steering)) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

    const measure = (entry?: ResizeObserverEntry) => {
      const box = entry?.borderBoxSize?.[0];
      view.width = Math.max(1, box ? box.inlineSize : el.offsetWidth);
      view.height = Math.max(1, box ? box.blockSize : el.offsetHeight);
      view.ratio = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.max(1, Math.round((view.width + PAD * 2) * view.ratio));
      canvas.height = Math.max(1, Math.round((view.height + PAD * 2) * view.ratio));
      readColors();
      if (state.ready) draw(settingsRef.current);
      wake();
    };

    const onPointerMove = (e: PointerEvent) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.known = true; wake(); };
    const onPointerDown = (e: PointerEvent) => {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.known = true;
      if (!settingsRef.current.disabled && !reduce) state.press = 1;
      wake();
    };
    const onPointerEnd = (e: PointerEvent) => { if (e.pointerType === "mouse") return; pointer.known = false; wake(); };
    const onPointerLeave = () => { pointer.known = false; wake(); };

    const resizeObserver = new ResizeObserver((entries) => measure(entries[entries.length - 1]));
    resizeObserver.observe(el);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) { last = 0; wake(); }
    });
    intersection.observe(el);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerEnd, { passive: true });
    window.addEventListener("pointercancel", onPointerEnd, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("pointerdown", onPointerDown);
    measure();
    wakeRef.current = () => { readColors(); wake(); };

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const cls = `specular-button${size ? ` specular-button--${size}` : ""}${className ? ` ${className}` : ""}`;
  const vars = {
    ...(radius < 999 && { "--sb-radius": `${radius}px` }),
    ...(tint && { "--sb-tint": tint }),
    ...(tintOpacity !== undefined && { "--sb-tint-opacity": tintOpacity }),
    ...(blur !== undefined && { "--sb-blur": `${blur}px` }),
    ...(textColor && { "--sb-text-color": textColor }),
    ...style,
  } as CSSProperties;
  const inner = (
    <>
      <canvas ref={canvasRef} className="specular-button__light" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </>
  );

  if (rest.href !== undefined) {
    const { href, ...a } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    const ref = elRef as React.RefObject<HTMLAnchorElement>;
    return href.startsWith("/")
      ? <Link ref={ref} href={href} className={cls} style={vars} {...a}>{inner}</Link>
      : <a ref={ref} href={href} className={cls} style={vars} {...a}>{inner}</a>;
  }
  const b = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button ref={elRef as React.RefObject<HTMLButtonElement>} type="button" className={cls} style={vars} {...b}>
      {inner}
    </button>
  );
}

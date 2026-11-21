"use client";
// GradientText (React Bits), ported to TypeScript. Styles live in globals.css (".gradient-text").
// Changes for this site:
// - Colours can be CSS variables, so one gradient follows the light and dark themes.
// - Reduced motion: painted once, never animated (as upstream).
// - Off screen it stops (IntersectionObserver, as upstream), so long pages cost nothing.
// <Headline> is the preset used for every section heading on the public pages.
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Variant = "linear" | "flow" | "conic";
const VARIANTS: Variant[] = ["linear", "flow", "conic"];
const ANGLES = { horizontal: 90, vertical: 180, diagonal: 135 } as const;
const TAU = Math.PI * 2;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export type GradientTextProps = {
  children: ReactNode;
  colors?: string[];
  animationSpeed?: number;
  variant?: Variant;
  angle?: number;
  direction?: keyof typeof ANGLES;
  scale?: number;
  yoyo?: boolean;
  glow?: number;
  showBorder?: boolean;
  borderWidth?: number;
  pauseOnHover?: boolean;
  followPointer?: boolean;
  className?: string;
  style?: CSSProperties;
};

type Settings = { colors: string[]; speed: number; variant: Variant; angle: number; scale: number; yoyo: boolean; pauseOnHover: boolean; followPointer: boolean };

export default function GradientText({
  children,
  colors = ["#5227FF", "#FF9FFC", "#B497CF"],
  animationSpeed = 8,
  variant = "linear",
  angle = 90,
  direction,
  scale = 3,
  yoyo = true,
  glow = 0,
  showBorder = false,
  borderWidth = 1.5,
  pauseOnHover = false,
  followPointer = false,
  className = "",
  style,
}: GradientTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const settingsRef = useRef<Settings | null>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const palette = colors.length > 1 ? colors : [colors[0] ?? "#ffffff", colors[0] ?? "#ffffff"];
  const ang = direction ? ANGLES[direction] ?? angle : angle;

  useEffect(() => {
    settingsRef.current = {
      colors: palette,
      speed: Math.max(0.2, animationSpeed),
      variant: VARIANTS.includes(variant) ? variant : "linear",
      angle: ang,
      scale: clamp(scale, 1, 6),
      yoyo,
      pauseOnHover,
      followPointer,
    };
    wakeRef.current?.();
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const state = { time: 0, inside: false, visible: true, x: 0.5, y: 0.5, px: 0.5, py: 0.5, vx: 0, vy: 0, pull: 0 };
    let raf = 0;
    let last = 0;
    let alive = true;

    const paint = () => {
      const s = settingsRef.current;
      if (!s) return;
      const list = s.colors;
      const cycle = state.time / s.speed;
      let image: string;
      if (s.variant === "flow") {
        const blobs = list.map((color, i) => {
          const spin = cycle * TAU;
          const rate = 0.55 + ((i * 0.618) % 1) * 0.5;
          let x = 50 + 44 * Math.sin(spin * rate + i * 2.1);
          let y = 50 + 40 * Math.sin(spin * (rate * 0.83 + 0.21) + i * 1.3);
          if (i === 0) {
            x += (state.px * 100 - x) * state.pull;
            y += (state.py * 100 - y) * state.pull;
          }
          return `radial-gradient(ellipse ${(22 + 12 * s.scale).toFixed(1)}% ${(60 + 30 * s.scale).toFixed(1)}% at ${x.toFixed(2)}% ${y.toFixed(2)}%, ${color} 0%, transparent 100%)`;
        });
        image = `${blobs.join(", ")}, linear-gradient(${s.angle}deg, ${list.join(", ")})`;
      } else if (s.variant === "conic") {
        const sway = s.yoyo ? Math.sin(cycle * Math.PI) * 50 : cycle * 360;
        const cx = 50 + (state.px * 100 - 50) * state.pull;
        const cy = 260 + (state.py * 100 - 260) * state.pull;
        image = `repeating-conic-gradient(from ${(sway - 30).toFixed(2)}deg at ${cx.toFixed(2)}% ${cy.toFixed(2)}%, ${[...list, list[0]].map((color, i) => `${color} ${((i / list.length) * 60 * (3 / s.scale)).toFixed(2)}deg`).join(", ")})`;
      } else {
        const loop = [...list, list[0]];
        const period = 100 * s.scale;
        let offset: number;
        if (s.yoyo) {
          const swing = cycle % 2;
          const t = swing < 1 ? swing : 2 - swing;
          offset = (0.5 - Math.cos(Math.PI * t) / 2) * (period - 100);
        } else {
          offset = (cycle % 1) * period;
        }
        offset += (state.px - 0.5) * period * 0.5 * state.pull;
        const stops = loop.map((color, i) => `${color} ${((i / (loop.length - 1)) * period - offset).toFixed(2)}%`);
        image = `repeating-linear-gradient(${s.angle}deg, ${stops.join(", ")})`;
      }
      root.style.setProperty("--gt-gradient", image);
    };

    const tick = (now: number) => {
      raf = 0;
      const s = settingsRef.current;
      if (!alive || !s) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const paused = reduce || (s.pauseOnHover && state.inside);
      if (!paused) state.time += dt;
      const target = s.followPointer && state.inside ? 1 : 0;
      state.pull += (target - state.pull) * (1 - Math.exp(-dt * 6));
      const stiffness = 160;
      state.vx += ((state.x - state.px) * stiffness - state.vx * 2 * Math.sqrt(stiffness)) * dt;
      state.vy += ((state.y - state.py) * stiffness - state.vy * 2 * Math.sqrt(stiffness)) * dt;
      state.px += state.vx * dt;
      state.py += state.vy * dt;
      paint();
      const settling = Math.abs(state.pull - target) > 0.001 || Math.abs(state.vx) + Math.abs(state.vy) > 0.001;
      if (!state.visible || (paused && !settling)) return;
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    wakeRef.current = () => { paint(); wake(); };

    const locate = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      state.x = clamp((e.clientX - r.left) / r.width, 0, 1);
      state.y = clamp((e.clientY - r.top) / r.height, 0, 1);
    };
    const onEnter = (e: PointerEvent) => {
      locate(e);
      if (!state.inside) { state.px = state.x; state.py = state.y; }
      state.inside = true;
      wake();
    };
    const onMove = (e: PointerEvent) => { locate(e); wake(); };
    const onLeave = () => { state.inside = false; wake(); };

    const observer = new IntersectionObserver((entries) => {
      state.visible = entries.some((e) => e.isIntersecting);
      if (state.visible) wake();
    });
    observer.observe(root);
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    paint();
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      wakeRef.current = null;
    };
  }, []);

  const loop = [...palette, palette[0]];
  return (
    <span
      ref={rootRef}
      className={`gradient-text${showBorder ? " gradient-text--border" : ""}${className ? ` ${className}` : ""}`}
      style={{
        "--gt-gradient": `linear-gradient(${ang}deg, ${loop.join(", ")})`,
        "--gt-border": `${borderWidth}px`,
        "--gt-glow": clamp(glow, 0, 1),
        ...style,
      } as CSSProperties}
    >
      <span className="gradient-text__inner">
        <span className="gradient-text__content">{children}</span>
        {glow > 0 ? <span className="gradient-text__glow" aria-hidden="true">{children}</span> : null}
      </span>
    </span>
  );
}

/** Section headings: the brand gradient (theme-aware tokens --hl-1..3 in globals.css) and a
 *  slow back-and-forth drift. Put it inside the h1/h2. The faint glow is a CSS drop-shadow
 *  (desktop only), not upstream's second copy of the text: a copy would put every heading
 *  in the page text twice (search engines, copy and paste). */
export function Headline({ children }: { children: ReactNode }) {
  return (
    <GradientText colors={["var(--hl-1)", "var(--hl-2)", "var(--hl-3)"]} animationSpeed={10} scale={2.5} className="headline">
      {children}
    </GradientText>
  );
}

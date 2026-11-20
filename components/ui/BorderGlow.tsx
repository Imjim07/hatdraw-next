"use client";
import Link from "next/link";
import { useCallback, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";

// A card whose border lights up near the pointer with a blended mesh of colours,
// after React Bits "BorderGlow" (JS + CSS variant). Ported to TypeScript and to plain
// child spans instead of ::before/::after, so it can sit on cards that already use
// their own pseudo-elements (the mode stripe). Pointer position is written straight
// to CSS variables, so moving the mouse never re-renders React.

const POSITIONS = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function glowVars(hsl: string, intensity: number) {
  const [h = 40, s = 80, l = 80] = hsl.split(/\s+/).map((n) => parseFloat(n));
  const vars: Record<string, string> = {};
  [["", 100], ["-60", 60], ["-50", 50], ["-40", 40], ["-30", 30], ["-20", 20], ["-10", 10]].forEach(([k, o]) => {
    vars[`--glow-color${k}`] = `hsl(${h}deg ${s}% ${l}% / ${Math.min(Number(o) * intensity, 100)}%)`;
  });
  return vars;
}

function meshVars(colors: string[]) {
  const vars: Record<string, string> = {};
  POSITIONS.forEach((at, i) => {
    vars[`--mesh-${i + 1}`] = `radial-gradient(at ${at}, ${colors[Math.min(COLOR_MAP[i], colors.length - 1)]} 0px, transparent 50%)`;
  });
  vars["--mesh-base"] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

type Props = {
  children: ReactNode;
  className?: string;
  /** Render as a Next.js link instead of a div. */
  href?: string;
  "aria-current"?: "page" | undefined;
  "data-mode"?: string;
  "aria-disabled"?: true;
  edgeSensitivity?: number;
  /** "H S L", e.g. "40 80 80" */
  glowColor?: string;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  fillOpacity?: number;
  /** Three CSS colours (custom properties are fine) for the mesh-gradient border. */
  colors?: string[];
};

export default function BorderGlow({
  children, className = "", href,
  edgeSensitivity = 30, glowColor = "40 80 80", glowRadius = 40, glowIntensity = 1,
  coneSpread = 25, fillOpacity = 0.5, colors = ["#c084fc", "#f472b6", "#38bdf8"],
  ...rest
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const dx = e.clientX - r.left - cx, dy = e.clientY - r.top - cy;
    const kx = dx ? cx / Math.abs(dx) : Infinity, ky = dy ? cy / Math.abs(dy) : Infinity;
    const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    let angle = dx || dy ? Math.atan2(dy, dx) * (180 / Math.PI) + 90 : 0;
    if (angle < 0) angle += 360;
    el.style.setProperty("--edge-proximity", (edge * 100).toFixed(3));
    el.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
  }, []);

  const style = {
    "--edge-sensitivity": edgeSensitivity,
    "--glow-padding": `${glowRadius}px`,
    "--cone-spread": coneSpread,
    "--fill-opacity": fillOpacity,
    ...glowVars(glowColor, glowIntensity),
    ...meshVars(colors),
  } as CSSProperties;

  const inner = (
    <>
      <span className="bg-edge" aria-hidden="true" />
      <span className="bg-fill" aria-hidden="true" />
      <span className="edge-light" aria-hidden="true" />
      {children}
    </>
  );
  const cls = `border-glow-card ${className}`.trim();

  return href
    ? <Link href={href} ref={(n) => { ref.current = n; }} className={cls} style={style} onPointerMove={onPointerMove} {...rest}>{inner}</Link>
    : <div ref={(n) => { ref.current = n; }} className={cls} style={style} onPointerMove={onPointerMove} {...rest}>{inner}</div>;
}

// Adire-inspired motifs, drawn for HatDraw (not traced from any cloth or artist).
// Usage rule: one motif per spot, and only where its meaning fits.
//   IgiIye → the Christmas tree / reveal   Sunbebe → adding names
//   AyeDegbe → shuffling                    Owo     → money only
//   Dundun → sharing / announcing           Ododo   → gift ideas
import type { ReactNode, SVGProps } from "react";

export type MotifProps = {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Used by the loader to draw strokes in (stroke-dashoffset). */
  pathLength?: number;
};

function Svg({ size = 48, color = "var(--starch)", strokeWidth = 3, title, className, style, children }: MotifProps & { children: ReactNode }) {
  const a11y: SVGProps<SVGSVGElement> = title ? { role: "img" } : { "aria-hidden": true, focusable: false };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...a11y}>
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/** Tree of life → the Christmas tree. The gold star is fixed. */
export function IgiIye(p: MotifProps) {
  return (
    <Svg {...p}>
      <path pathLength={p.pathLength} d="M50 90 V 20" />
      <path pathLength={p.pathLength} d="M50 32 L 34 44 M50 32 L 66 44 M50 48 L 28 62 M50 48 L 72 62 M50 64 L 24 78 M50 64 L 76 78" />
      <path pathLength={p.pathLength} d="M38 90 H 62" />
      <circle cx="50" cy="13" r="6" fill="var(--gold)" stroke="none" />
    </Svg>
  );
}

/** Beads on a string → adding names. */
export function Sunbebe(p: MotifProps) {
  const c = p.color ?? "var(--starch)";
  return (
    <Svg {...p}>
      <path pathLength={p.pathLength} d="M16 30 C 28 70, 72 70, 84 30" />
      <path pathLength={p.pathLength} d="M50 12 V 30" />
      {[[21, 42], [32, 54], [44, 60], [56, 60], [68, 54], [79, 42]].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="6" fill={c} stroke="none" />
      ))}
    </Svg>
  );
}

/** "The world is on its side" → shuffling. */
export function AyeDegbe(p: MotifProps) {
  const c = p.color ?? "var(--starch)";
  return (
    <Svg {...p}>
      <path pathLength={p.pathLength} d="M10 40 L 22 18 L 34 40 Z M38 40 L 50 18 L 62 40 Z M66 40 L 78 18 L 90 40 Z" />
      <path pathLength={p.pathLength} d="M10 86 L 22 64 L 34 86 Z M38 86 L 50 64 L 62 86 Z M66 86 L 78 64 L 90 86 Z" />
      {[22, 50, 78].map((cx) => <circle key={cx} cx={cx} cy="52" r="3.5" fill={c} stroke="none" />)}
    </Svg>
  );
}

/** Cowrie shell → money. */
export function Owo(p: MotifProps) {
  return (
    <Svg {...p}>
      <ellipse pathLength={p.pathLength} cx="50" cy="50" rx="24" ry="34" />
      <path pathLength={p.pathLength} d="M50 22 V 78" />
      <path pathLength={p.pathLength} d="M44 32 H 38 M44 42 H 37 M44 52 H 37 M44 62 H 38 M56 32 H 62 M56 42 H 63 M56 52 H 63 M56 62 H 62" />
    </Svg>
  );
}

/** Talking drum → sharing / announcing. */
export function Dundun(p: MotifProps) {
  return (
    <Svg {...p}>
      <path pathLength={p.pathLength} d="M26 16 H 74 M26 84 H 74" />
      <path pathLength={p.pathLength} d="M28 16 C 44 36, 44 64, 28 84 M72 16 C 56 36, 56 64, 72 84" />
      <path pathLength={p.pathLength} d="M32 20 L 68 80 M68 20 L 32 80 M50 16 V 84" />
    </Svg>
  );
}

/** Flower → gift ideas. */
export function Ododo(p: MotifProps) {
  const c = p.color ?? "var(--starch)";
  return (
    <Svg {...p}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
        <ellipse key={r} pathLength={p.pathLength} cx="50" cy="30" rx="7" ry="16" transform={`rotate(${r} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="6" fill={c} stroke="none" />
    </Svg>
  );
}

// A 3×3 adire eleko square: the tree of life at the centre, flowers and
// "world on its side" triangles alternating around it. Used behind the reveal
// and by the loader (which draws the strokes in, one square at a time).
const ADIRE = [AyeDegbe, Ododo, AyeDegbe, Ododo, IgiIye, Ododo, AyeDegbe, Ododo, AyeDegbe];

export function AdireGrid({ className = "", strokeWidth = 4 }: { className?: string; strokeWidth?: number }) {
  return (
    <div className={`adire-grid ${className}`} aria-hidden="true">
      {ADIRE.map((M, i) => (
        <span key={i} style={{ "--i": i } as React.CSSProperties}>
          <M size="100%" strokeWidth={strokeWidth} pathLength={1} />
        </span>
      ))}
    </div>
  );
}

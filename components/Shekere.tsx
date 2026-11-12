"use client";
import { useCallback, useEffect, useId, useRef } from "react";

// Ṣẹ̀kẹ̀rẹ̀: a dried calabash under a net strung with beads. Each name is a bead.
//
// The shake: the gourd, collar curve, net and beads are ONE <g> rotated by ONE
// angle, driven by a single requestAnimationFrame loop. The collar and net are
// clipped to the gourd's own outline, so they can't leave it at any angle.
// Beads only jiggle ≤2.5px around their knot (the rattle). Tag strings are
// recomputed each frame from the rotated bead position so they stay attached.
// Don't give the net or beads their own rotation or CSS animation.

const W = 600, H = 470, CX = 300;
const PIVOT: [number, number] = [CX, 64]; // the hand holds the neck
const GOURD = "M274 64 C 274 82, 272 94, 264 104 C 210 118, 170 174, 170 252 C 170 335, 228 392, 300 392 C 372 392, 430 335, 430 252 C 430 174, 390 118, 336 104 C 328 94, 326 82, 326 64 Z";
const COLLAR = "M200 146 Q300 122 400 146";
const S = 28; // net spacing

// Knots of the diamond net that sit on the bulb, in reading order.
const KNOTS: [number, number][] = [];
for (let j = -8; j <= 8; j++)
  for (let i = -8; i <= 8; i++) {
    if ((i + j) & 1) continue;
    const x = CX + i * S, y = 260 + j * S * 0.9;
    if (((x - CX) / 114) ** 2 + ((y - 258) / 120) ** 2 <= 1 && y > 130) KNOTS.push([x, y]);
  }
// Net strands: each knot to its lower diagonal neighbours.
const STRANDS: string[] = [];
for (const [x, y] of KNOTS)
  for (const dx of [-S, S]) {
    const n = KNOTS.find(([a, b]) => a === x + dx && Math.abs(b - (y + S * 0.9)) < 0.5);
    if (n) STRANDS.push(`M${x} ${y} L${n[0]} ${n[1]}`);
  }
// Order in which beads appear as names are added: a fixed scatter over the net.
const hash = (k: number) => { const v = Math.sin(k * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
const FILL_ORDER = KNOTS.map((_, i) => i).sort((a, b) => hash(a) - hash(b));
export const SHEKERE_CAPACITY = 24;

// Where name tags hang, outside the gourd.
const TAG_SLOTS: [number, number][] = [[92, 150], [500, 104], [78, 300], [516, 250], [480, 412]];

const TAP_MS = 900;       // one shake from a tap or autoShake
const PERIOD = 360;       // ms per swing
const MAX_DEG = 8;
const RATTLE = 2.5;       // px a bead may move off its knot

const isGold = (name: string) => name.trim().endsWith("?");
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Loop = { raf: number; until: number; env: number; last: number; shaking: boolean; svg: SVGSVGElement | null; rot: SVGGElement | null };

// One frame loop per shekere: one angle for the whole group, a small rattle per
// bead, and tag strings re-tied to where each bead now sits. Stops when settled.
function start(L: Loop) {
  if (L.raf) return;
  const frame = (now: number) => {
    const dt = L.last ? Math.min(now - L.last, 50) : 16;
    L.last = now;
    const active = L.shaking || now < L.until;
    L.env = active ? 1 + (L.env - 1) * Math.exp(-dt / 60) : L.env * Math.exp(-dt / 160);
    const done = !active && L.env < 0.004;
    const env = done ? 0 : L.env;

    const deg = MAX_DEG * env * Math.sin((2 * Math.PI * now) / PERIOD);
    const a = (deg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    const [px, py] = PIVOT;
    L.rot?.setAttribute("transform", env ? `rotate(${deg.toFixed(3)} ${px} ${py})` : "");

    if (L.svg) {
      const at = new Map<string, [number, number]>();
      L.svg.querySelectorAll<SVGCircleElement>(".shk-bead").forEach((b) => {
        const x = +b.dataset.x!, y = +b.dataset.y!, p = +b.dataset.p!;
        const r = RATTLE * env * Math.abs(Math.sin(now / 47 + p * 6.283));
        const th = now / 90 + p * 12.57;
        const bx = x + r * Math.cos(th), by = y + r * Math.sin(th);
        b.setAttribute("cx", bx.toFixed(2));
        b.setAttribute("cy", by.toFixed(2));
        // Where this bead sits on screen after the group's rotation.
        at.set(b.dataset.k!, [px + (bx - px) * cos - (by - py) * sin, py + (bx - px) * sin + (by - py) * cos]);
      });
      L.svg.querySelectorAll<SVGLineElement>(".shk-string").forEach((l) => {
        const p = at.get(l.dataset.k!);
        if (p) { l.setAttribute("x1", p[0].toFixed(2)); l.setAttribute("y1", p[1].toFixed(2)); }
      });
    }

    if (done) { L.raf = 0; L.last = 0; L.env = 0; return; }
    L.raf = requestAnimationFrame(frame);
  };
  L.raf = requestAnimationFrame(frame);
}

type Props = {
  names: string[];
  /** How many names get a hanging tag, each tied to its nearest bead. */
  maxLabeled?: number;
  /** false: fully beaded net (landing hero). true: one bead per name, "+N more" past capacity. */
  beadsFromNames?: boolean;
  /** Keeps shaking while true, then settles to 0. */
  shaking?: boolean;
  /** Shake once ~2s after mount. */
  autoShake?: boolean;
  /** Click/tap to shake. */
  shakeOnTap?: boolean;
  className?: string;
};

export default function Shekere({ names, maxLabeled = 5, beadsFromNames = false, shaking = false, autoShake = false, shakeOnTap = true, className = "" }: Props) {
  const clip = `shk-${useId().replace(/:/g, "")}`;
  const svg = useRef<SVGSVGElement>(null);
  const rot = useRef<SVGGElement>(null);
  const loop = useRef<Loop>({ raf: 0, until: 0, env: 0, last: 0, shaking: false, svg: null, rot: null });

  const n = names.length;
  const shown = Math.min(n, SHEKERE_CAPACITY);
  // Bead k → the name it stands for (wizard), or true for a plain bead (hero).
  const beadName = new Map<number, string | true>();
  if (beadsFromNames) FILL_ORDER.slice(0, shown).forEach((k, i) => beadName.set(k, names[i]));
  else KNOTS.forEach((_, k) => beadName.set(k, true));

  // Hanging tags: nearest unused bead to each slot.
  const used = new Set<number>();
  const tags = names.slice(0, Math.min(maxLabeled, TAG_SLOTS.length)).map((name, t) => {
    const [sx, sy] = TAG_SLOTS[t];
    let best = -1, bd = Infinity;
    KNOTS.forEach(([x, y], k) => { const d = (x - sx) ** 2 + (y - sy) ** 2; if (beadName.has(k) && !used.has(k) && d < bd) { bd = d; best = k; } });
    if (best >= 0) used.add(best);
    return { name, k: best, sx, sy, w: Math.round(name.length * 8.6 + 24) };
  }).filter((t) => t.k >= 0);
  const goldBeads = new Set<number>();
  tags.forEach((t) => isGold(t.name) && goldBeads.add(t.k));
  beadName.forEach((v, k) => typeof v === "string" && isGold(v) && goldBeads.add(k));

  const kick = useCallback((ms = 0) => {
    if (reduced()) return;
    const L = loop.current;
    L.svg = svg.current; L.rot = rot.current;
    if (ms) L.until = Math.max(L.until, performance.now() + ms);
    start(L);
  }, []);

  useEffect(() => { loop.current.shaking = shaking; if (shaking) kick(); }, [shaking, kick]);
  useEffect(() => {
    if (!autoShake) return;
    const t = setTimeout(() => kick(TAP_MS), 2000);
    return () => clearTimeout(t);
  }, [autoShake, kick]);
  useEffect(() => () => cancelAnimationFrame(loop.current.raf), []);

  const art = (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={`shekere ${className}`} aria-hidden="true" focusable="false">
      <defs><clipPath id={clip}><path d={GOURD} /></clipPath></defs>
      <g ref={rot}>
        <path d={GOURD} fill="var(--shk-fill, var(--dye))" stroke="var(--dye-fg)" strokeWidth="2.5" strokeLinejoin="round" />
        <g clipPath={`url(#${clip})`} stroke="var(--dye-fg)" fill="none">
          <g strokeOpacity=".45" strokeWidth="1.2">{STRANDS.map((d) => <path key={d} d={d} />)}</g>
          <path d={COLLAR} strokeOpacity=".6" strokeWidth="2" />
        </g>
        <ellipse cx={CX} cy={PIVOT[1]} rx="26" ry="6" fill="var(--on-accent)" stroke="var(--dye-fg)" strokeWidth="2" />
        {KNOTS.map(([x, y], k) =>
          beadName.has(k) ? (
            <circle key={`b${k}`} className="shk-bead" data-k={k} data-x={x} data-y={y} data-p={hash(k + 7).toFixed(4)}
              cx={x} cy={y} r="7" fill={goldBeads.has(k) ? "var(--palm-gold)" : "var(--dye-fg)"} />
          ) : (
            <circle key={`k${k}`} cx={x} cy={y} r="2.2" fill="var(--dye-fg)" fillOpacity=".5" />
          ),
        )}
        {beadsFromNames && n > SHEKERE_CAPACITY && (
          <g>
            <rect x={CX - 78} y="346" width="156" height="40" rx="20" fill="var(--palm-gold)" />
            <text x={CX} y="374" textAnchor="middle" fontFamily="var(--sans)" fontWeight="700" fontSize="24" fill="var(--on-accent)">+{n - SHEKERE_CAPACITY} more</text>
          </g>
        )}
      </g>
      {tags.map(({ name, k, sx, sy, w }) => (
        <g key={`t${name}${k}`}>
          <line className="shk-string" data-k={k} x1={KNOTS[k][0]} y1={KNOTS[k][1]} x2={sx} y2={sy} stroke="var(--indigo)" strokeOpacity=".45" strokeWidth="1.2" />
          <rect x={sx - w / 2} y={sy - 15} width={w} height="30" rx="7" fill={isGold(name) ? "var(--palm-gold)" : "var(--cloud)"} stroke={isGold(name) ? "none" : "var(--line)"} />
          <text x={sx} y={sy + 5.5} textAnchor="middle" fontFamily="var(--display)" fontWeight="600" fontSize="15" fill={isGold(name) ? "var(--on-accent)" : "var(--ink)"}>{name}</text>
        </g>
      ))}
    </svg>
  );

  return shakeOnTap ? (
    <button type="button" className="shekere-btn" onClick={() => kick(TAP_MS)}
      aria-label="Shake the ṣẹ̀kẹ̀rẹ̀ (a beaded gourd rattle). Every name is a bead.">
      {art}
    </button>
  ) : art;
}

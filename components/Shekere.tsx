// Ṣẹ̀kẹ̀rẹ̀: a dried calabash under a net strung with beads. Each name is a bead.
// Pure SVG + CSS (no hooks, no motion library), so it can render anywhere.
// The shake is a CSS twist on the gourd, with the net and beads following
// ~80ms behind and overshooting, so the beads look like they rattle.

const W = 480, H = 410, TOP = 40, CX = 240;
const GOURD = "M214 74 C 214 92, 212 104, 204 114 C 150 128, 110 184, 110 262 C 110 345, 168 402, 240 402 C 312 402, 370 345, 370 262 C 370 184, 330 128, 276 114 C 268 104, 266 92, 266 74 Z";
const S = 28; // net spacing

// Knots of the diamond net that sit on the bulb, in reading order.
const KNOTS: [number, number][] = [];
for (let j = -8; j <= 8; j++)
  for (let i = -8; i <= 8; i++) {
    if ((i + j) & 1) continue;
    const x = CX + i * S, y = 270 + j * S * 0.9;
    if (((x - CX) / 114) ** 2 + ((y - 268) / 120) ** 2 <= 1 && y > 140) KNOTS.push([x, y]);
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

// Where name tags hang, outside the gourd (hero only).
const TAG_SLOTS: [number, number][] = [[82, 150], [398, 112], [70, 300], [408, 252], [384, 404]];

type Props = {
  names: string[];
  shaking?: boolean;
  /** How many names get a hanging tag (hero). 0 in the wizard, where the ayo board lists them. */
  maxLabeled?: number;
  /** true: every knot carries a bead (decorative). false: one bead per name. */
  filled?: boolean;
  className?: string;
};

export default function Shekere({ names, shaking = false, maxLabeled = 5, filled = true, className = "" }: Props) {
  const n = names.length;
  const shown = Math.min(n, SHEKERE_CAPACITY);
  const beaded = new Set(filled ? KNOTS.map((_, i) => i) : FILL_ORDER.slice(0, shown));
  // Gold accent: the "You?" bead on the hero, or the newest bead in the wizard.
  const accent = filled ? -1 : shown ? FILL_ORDER[shown - 1] : -1;

  // Hanging tags: nearest free knot to each slot.
  const used = new Set<number>();
  const tags = names.slice(0, Math.min(maxLabeled, TAG_SLOTS.length)).map((name, t) => {
    const [sx, sy] = TAG_SLOTS[t];
    let best = 0, bd = Infinity;
    KNOTS.forEach(([x, y], k) => { const d = (x - sx) ** 2 + (y - sy) ** 2; if (!used.has(k) && d < bd) { bd = d; best = k; } });
    used.add(best);
    return { name, k: best, sx, sy, w: Math.round(name.length * 8.6 + 24) };
  });
  const tagAccent = filled && tags.length ? tags[tags.length - 1].k : -1;

  return (
    <svg viewBox={`0 ${TOP} ${W} ${H}`} className={`shekere ${shaking ? "shaking" : ""} ${className}`} aria-hidden="true" focusable="false">
      <defs><clipPath id="shk-bulb"><path d={GOURD} /></clipPath></defs>
      <g className="shk-gourd">
        <path d={GOURD} fill="var(--shk-fill, var(--indigo-cloth))" stroke="var(--starch)" strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx={CX} cy="74" rx="26" ry="6" fill="var(--indigo-pit)" stroke="var(--starch)" strokeWidth="2" />
      </g>
      <g className="shk-beads">
        <g clipPath="url(#shk-bulb)" stroke="var(--starch)" strokeOpacity=".45" strokeWidth="1.2" fill="none">
          {STRANDS.map((d) => <path key={d} d={d} />)}
          <path d="M140 156 Q240 132 340 156" strokeOpacity=".6" strokeWidth="2" />
        </g>
        {tags.map(({ name, k, sx, sy, w }) => (
          <g key={`t${name}`} className="shk-tag">
            <line x1={KNOTS[k][0]} y1={KNOTS[k][1]} x2={sx} y2={sy} stroke="var(--starch)" strokeOpacity=".7" strokeWidth="1.2" />
            <rect x={sx - w / 2} y={sy - 15} width={w} height="30" rx="7" fill="var(--starch)" />
            <text x={sx} y={sy + 5.5} textAnchor="middle" fontFamily="var(--serif)" fontWeight="600" fontSize="15" fill="var(--indigo-deep)">{name}</text>
          </g>
        ))}
        {KNOTS.map(([x, y], k) =>
          beaded.has(k) ? (
            <circle key={`b${k}`} className="bead" cx={x} cy={y} r="7" fill={k === accent || k === tagAccent ? "var(--gold)" : "var(--starch)"} />
          ) : (
            <circle key={`k${k}`} cx={x} cy={y} r="2.2" fill="var(--starch)" fillOpacity=".5" />
          ),
        )}
        {n > SHEKERE_CAPACITY && (
          <g className="bead">
            <circle cx={CX} cy="392" r="20" fill="var(--gold)" />
            <text x={CX} y="398" textAnchor="middle" fontFamily="var(--sans)" fontWeight="700" fontSize="15" fill="var(--indigo-deep)">+{n - SHEKERE_CAPACITY}</text>
          </g>
        )}
      </g>
    </svg>
  );
}

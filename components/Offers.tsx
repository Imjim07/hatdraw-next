import type { CSSProperties } from "react";
import { landing } from "@/lib/copy/landing";
import BorderGlow from "./ui/BorderGlow";
import SpecularButton from "./SpecularButton";
import { Headline } from "@/components/GradientText";

// "What <brand> offers": four cards after the hero, on the same cloud surface as the
// how-it-works and pricing cards. Each card is bordered in its own colour (green for Secret
// Santa, gold for ajo, blue for Gift Finder, indigo for the giveaway picker), and the border
// glows near the pointer (BorderGlow). Their buttons are ghost, so the hero's button stays
// the one loud button on the page. The giveaway picker isn't built yet, so its card has no
// button at all (not a disabled one). Icons by Icons8, tinted with the text colour so they
// follow the theme.
type Tone = "santa" | "ajo" | "gift" | "give";
type Offer = { title: string; motif: string; tone: Tone; text: string; points: string[]; link?: { href: string; label: string } };

const GLOW: Record<Tone, { colors: string[]; glow: string }> = {
  santa: { colors: ["var(--pine)", "#6FBF95", "#2F6B52"], glow: "155 45 62" },
  ajo: { colors: ["var(--palm-gold)", "#E08A1E", "#F7CF6B"], glow: "40 87 66" },
  gift: { colors: ["#3B6FE0", "#7FA6F5", "#2449B8"], glow: "222 85 70" },
  give: { colors: ["#7C86D6", "#A9B1EE", "#4E58A8"], glow: "233 55 74" },
};

const O = landing.offers, C = O.cards;
const OFFERS: Offer[] = [
  { title: C.santa.title, tone: "santa", motif: "santa", text: C.santa.line, points: C.santa.points, link: { href: "/draw", label: C.santa.link } },
  { title: C.ajo.title, tone: "ajo", motif: "ajo", text: C.ajo.line, points: C.ajo.points, link: { href: "/ajo", label: C.ajo.link } },
  { title: C.gifts.title, tone: "gift", motif: "giftfinder", text: C.gifts.line, points: C.gifts.points, link: { href: "/gifts", label: C.gifts.link } },
  { title: C.giveaway.title, tone: "give", motif: "giveaway", text: C.giveaway.line, points: C.giveaway.points },
];

export default function Offers() {
  return (
    <section className="band" id="features"><div className="wrap">
      <div className="of-head">
        <div className="eyebrow">{O.eyebrow}</div>
        <h2><Headline>{O.heading}</Headline></h2>
        <p className="sub">{O.subline}</p>
      </div>
      <ul className="of-grid">
        {OFFERS.map((o) => (
          <li key={o.title} className="of-item">
            <BorderGlow className={`of-card of-${o.tone}`} colors={GLOW[o.tone].colors} glowColor={GLOW[o.tone].glow} aria-disabled={o.link ? undefined : true}>
              <span className="of-motif" aria-hidden="true"><i className="tint-ico of-ico" style={{ "--ico": `url(/icons/of-${o.motif}.png)` } as CSSProperties} /></span>
              <h3>{o.title}{!o.link && <span className="pill of-soon">{O.soon}</span>}</h3>
              <p>{o.text}</p>
              {o.points.length > 0 && <ul className="of-points">{o.points.map((p) => <li key={p}>{p}</li>)}</ul>}
              {o.link && <SpecularButton href={o.link.href} className="btn btn-ghost btn-sm of-btn">{o.link.label} <span aria-hidden="true">→</span></SpecularButton>}
            </BorderGlow>
          </li>
        ))}
      </ul>
    </div></section>
  );
}

import type { ReactNode } from "react";
import { BRAND } from "@/lib/config";
import { Dundun, IgiIye, Ododo, Owo } from "./motifs";
import BorderGlow from "./ui/BorderGlow";
import SpecularButton from "./SpecularButton";

// "What <brand> offers": four cards after the hero, in the Sorbet style of the setup
// wizards. Each card is bordered in its own colour (green for Secret Santa, gold for ajo,
// blue for Gift Finder, indigo for the giveaway picker), and the border glows near the
// pointer (BorderGlow). The giveaway picker isn't built yet, so its card has no button at
// all (not a disabled one).
type Tone = "santa" | "ajo" | "gift" | "give";
type Offer = { title: string; motif: ReactNode; tone: Tone; text: string; points: string[]; link?: { href: string; label: string } };

const GLOW: Record<Tone, { colors: string[]; glow: string }> = {
  santa: { colors: ["var(--pine)", "#6FBF95", "#2F6B52"], glow: "155 45 62" },
  ajo: { colors: ["var(--palm-gold)", "#E08A1E", "#F7CF6B"], glow: "40 87 66" },
  gift: { colors: ["#3B6FE0", "#7FA6F5", "#2449B8"], glow: "222 85 70" },
  give: { colors: ["#7C86D6", "#A9B1EE", "#4E58A8"], glow: "233 55 74" },
};

const OFFERS: Offer[] = [
  { title: "Secret Santa", tone: "santa", motif: <IgiIye size={34} color="var(--indigo)" strokeWidth={5} />,
    text: "Everyone gets a private link and beats the starch to see who they're gifting.",
    points: ["Private reveal links", "Keep-apart rules", "Pass-the-phone mode"], link: { href: "/draw", label: "Start a gift exchange" } },
  { title: "Ajo payout order", tone: "ajo", motif: <Owo size={34} color="var(--indigo)" strokeWidth={5} />,
    text: "Draw the payout order once, in front of everyone, and share one schedule.",
    points: ["Locked or live draw", "Reminders before every turn", "Swaps both members agree to"], link: { href: "/ajo", label: "Draw a payout order" } },
  { title: "Gift Finder", tone: "gift", motif: <Ododo size={34} color="var(--indigo)" strokeWidth={5} />,
    text: "Gifts that fit your budget, delivered.",
    points: ["Browse by budget", "Picked for Nigerian gifting", "Order in a tap"], link: { href: "/gifts", label: "Find a gift" } },
  { title: "Giveaway picker for vendors", tone: "give", motif: <Dundun size={34} color="var(--indigo)" strokeWidth={5} />,
    text: "Pick your giveaway winner fairly, with a link your followers can check.",
    points: ["One fair pick", "A result anyone can check"] },
];

const PROMISES = ["Fair & recorded draws", "No sign-up", "WhatsApp-first", "Free for small groups", "Draws never touch your money"];

export default function Offers() {
  return (
    <section className="band" id="offers"><div className="wrap">
      <div className="of-head">
        <div className="eyebrow">What {BRAND.name} offers</div>
        <h2>Fair draws for whatever needs one</h2>
        <p className="sub">{BRAND.name} is built for two traditions, Secret Santa and ajo, and works for any event that needs a fair pick. Then it helps you find the gift.</p>
      </div>
      <ul className="of-grid ob">
        {OFFERS.map((o) => (
          <li key={o.title} className="of-item">
            <BorderGlow className={`of-card of-${o.tone}`} colors={GLOW[o.tone].colors} glowColor={GLOW[o.tone].glow}>
              <span className="of-motif" aria-hidden="true">{o.motif}</span>
              <h3>{o.title}{!o.link && <span className="pill of-soon">Coming soon</span>}</h3>
              <p>{o.text}</p>
              <ul className="of-points">{o.points.map((p) => <li key={p}>{p}</li>)}</ul>
              {o.link && <SpecularButton href={o.link.href} className="btn btn-primary btn-sm of-btn">{o.link.label} <span aria-hidden="true">→</span></SpecularButton>}
            </BorderGlow>
          </li>
        ))}
      </ul>
      <ul className="of-promise" aria-label="Our promises">
        {PROMISES.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </div></section>
  );
}

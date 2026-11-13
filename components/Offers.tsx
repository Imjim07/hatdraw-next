import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/config";
import { Dundun, IgiIye, Ododo, Owo } from "./motifs";

// "What <brand> offers": four mode cards after the hero. The Santa and ajo cards carry
// their mode stripe (data-mode); the other two use the neutral stripe. The giveaway
// picker isn't built yet, so its card has no link at all (not a disabled one).
type Offer = { title: string; motif: ReactNode; mode?: "santa" | "ajo"; text: string; points: string[]; link?: { href: string; label: string } };

const OFFERS: Offer[] = [
  { title: "Secret Santa", mode: "santa", motif: <IgiIye size={34} color="var(--indigo)" strokeWidth={5} />,
    text: "Everyone gets a private link and beats the starch to see who they're gifting.",
    points: ["Private reveal links", "Keep-apart rules", "Pass-the-phone mode"], link: { href: "/draw", label: "Start a gift exchange" } },
  { title: "Ajo payout order", mode: "ajo", motif: <Owo size={34} color="var(--indigo)" strokeWidth={5} />,
    text: "Draw the payout order once, in front of everyone, and share one schedule.",
    points: ["Locked or live draw", "Reminders before every turn", "Swaps both members agree to"], link: { href: "/ajo", label: "Draw a payout order" } },
  { title: "Gift Finder", motif: <Ododo size={34} color="var(--indigo)" strokeWidth={5} />,
    text: "Gifts that fit your budget, delivered.",
    points: ["Browse by budget", "Picked for Nigerian gifting", "Order in a tap"], link: { href: "/gifts", label: "Find a gift" } },
  { title: "Giveaway picker for vendors", motif: <Dundun size={34} color="var(--indigo)" strokeWidth={5} />,
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
      <ul className="of-grid">
        {OFFERS.map((o) => (
          <li key={o.title} className="mode-card of-card" data-mode={o.mode}>
            <span className="of-motif" aria-hidden="true">{o.motif}</span>
            <h3>{o.title}{!o.link && <span className="pill of-soon">Coming soon</span>}</h3>
            <p>{o.text}</p>
            <ul className="of-points">{o.points.map((p) => <li key={p}>{p}</li>)}</ul>
            {o.link && <Link href={o.link.href} className="of-link">{o.link.label} <span aria-hidden="true">→</span></Link>}
          </li>
        ))}
      </ul>
      <ul className="of-promise" aria-label="Our promises">
        {PROMISES.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </div></section>
  );
}

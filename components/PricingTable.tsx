"use client";
// Pricing: three columns (Free · Pay per draw · Year pass). Each product is a card
// that flips over on click or tap to show what's included; the price sits in an
// amber glass pill. Plain CSS on the Indigo & Starch tokens, no buttons to buy:
// the draw itself asks for payment when a circle needs it.
import { useId, useRef, useState } from "react";
import { Owo } from "./motifs";
import SpecularButton from "./SpecularButton";
import { naira } from "@/lib/config";
import { landing } from "@/lib/copy/landing";

export type PriceCard = {
  id: string;
  name: string;
  who: string;
  /** ₦. 0 = free. */
  price: number;
  /** Shown after the price, e.g. "per draw". */
  unit: string;
  note: string;
  features: string[];
};
export type PriceGroup = { id: string; name: string; who: string; cards: PriceCard[]; hot?: boolean };

const F = landing.pricing.flip;

export default function PricingTable({ groups }: { groups: PriceGroup[] }) {
  return (
    <div className="pricing-table">
      <div className="prices">
        {groups.map((g) => <Group key={g.id} group={g} />)}
      </div>
    </div>
  );
}

function Group({ group }: { group: PriceGroup }) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className={`price-group${group.hot ? " hot" : ""}`}>
      <h3 id={titleId}>{group.name}</h3>
      <p className="who">{group.who}</p>
      <div className="flip-stack">
        {group.cards.map((c) => <FlipCard key={c.id} card={c} />)}
      </div>
    </section>
  );
}

function FlipCard({ card }: { card: PriceCard }) {
  const [flipped, setFlipped] = useState(false);
  const front = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const free = card.price === 0;
  // The whole card flips on a click; the button on each face is the keyboard and
  // screen-reader control (its click bubbles up here). The hidden face is inert,
  // so a keyboard user's focus follows to the button on the face that turns up
  // (detail 0 = a click from Enter/Space, not a pointer).
  const toggle = (e: React.MouseEvent) => {
    const next = !flipped;
    setFlipped(next);
    if (e.detail === 0) requestAnimationFrame(() => (next ? back : front).current?.focus({ preventScroll: true }));
  };
  return (
    <div className={`flip${flipped ? " is-flipped" : ""}`} onClick={toggle}>
      <div className="flip-inner">
        <div className="flip-face flip-front" inert={flipped}>
          <h4>{card.name}</h4>
          <p className="flip-who">{card.who}</p>
          <div className="flip-price">
            <SpecularButton as="span" className="price-glass">{free ? landing.pricing.free : naira(card.price)}</SpecularButton>
            {!free && <small>{card.unit}</small>}
          </div>
          <button ref={front} type="button" className="flip-btn" aria-label={F.moreLabel(card.name)}>
            {F.more} <span aria-hidden="true">↻</span>
          </button>
        </div>
        <div className="flip-face flip-back" inert={!flipped}>
          <h4>{card.name}</h4>
          <p className="flip-note">{card.note}</p>
          <ul>{card.features.map((t) => <li key={t}><Owo size={16} strokeWidth={6} color="var(--indigo)" />{t}</li>)}</ul>
          <button ref={back} type="button" className="flip-btn" aria-label={F.backLabel(card.name)}>
            <span aria-hidden="true">↺</span> {F.back}
          </button>
        </div>
      </div>
    </div>
  );
}

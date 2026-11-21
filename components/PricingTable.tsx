"use client";
// Pricing table, adapted from the Kara UI
// "pricing-table" block (karaui.kamisama-v0.my.id/components/blocks/pricing-table).
// Same behaviour — a pill that glides between periods, prices that roll
// digit-by-digit, a note that swaps under the price — rebuilt in plain CSS on
// the Indigo & Starch tokens. No Tailwind, motion or icon library.
import { useId } from "react";
import { Owo } from "./motifs";
import SpecularButton from "./SpecularButton";
import { naira } from "@/lib/config";
import { landing } from "@/lib/copy/landing";

export type Plan = {
  id: string;
  name: string;
  who: string;
  /** ₦. 0 = free. */
  price: number;
  /** Shown after the price, e.g. "per draw". */
  unit: string;
  note: string;
  features: string[];
  popular?: boolean;
  tag?: string;
  /** No href: rendered as a disabled label. */
  cta: { label: string; href?: string; variant: "gold" | "ghost" };
  /** An extra text link under the button, e.g. "Talk to us" by email. */
  extra?: { label: string; href: string };
};

// Prices are per draw (or one Year pass), so there is no monthly/yearly switch any more.
export default function PricingTable({ plans }: { plans: Plan[] }) {
  return (
    <div className="pricing-table">
      <div className="prices">
        {plans.map((p) => <PlanCard key={p.id} plan={p} />)}
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const titleId = useId();
  const free = plan.price === 0;
  const amount = free ? landing.pricing.free : naira(plan.price);
  const cta = plan.cta;
  return (
    <section aria-labelledby={titleId} className={`price${plan.popular ? " hot" : ""}`}>
      {plan.tag && <span className="tag">{plan.tag}</span>}
      <h3 id={titleId}>{plan.name}</h3>
      <div className="who">{plan.who}</div>
      <div className="amt">
        <strong><Roll text={amount} /></strong>
        {!free && <small>{plan.unit}</small>}
      </div>
      <p className="price-note">{plan.note}</p>
      <ul>{plan.features.map((t) => <li key={t}><Owo size={16} strokeWidth={6} color="var(--indigo)" />{t}</li>)}</ul>
      {cta.href
        ? <SpecularButton href={cta.href} className={`btn btn-${cta.variant}`}>{cta.label}</SpecularButton>
        : <span className="btn btn-ghost btn-off" aria-disabled="true">{cta.label}</span>}
      {plan.extra && <a href={plan.extra.href} className="price-note price-extra">{plan.extra.label}</a>}
    </section>
  );
}

// Each digit is a 0–9 column slid into place, sized by the digit it shows
// (proportional digits differ in width); columns are keyed from the right
// so ₦700 → ₦7,500 rolls the matching places instead of re-mounting them.
function Roll({ text }: { text: string }) {
  const chars = [...text];
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="roll" aria-hidden="true">
        {chars.map((c, i) => {
          const place = chars.length - i;
          if (!/\d/.test(c)) return <span key={`c${place}${c}`}>{c}</span>;
          return (
            <span key={`d${place}`} className="roll-d">
              <span className="roll-w">{c}</span>
              <span className="roll-col" style={{ transform: `translateY(${-Number(c) * 10}%)`, transitionDelay: `${(place - 1) * 30}ms` }}>
                {"0123456789".split("").map((d) => <span key={d}>{d}</span>)}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}

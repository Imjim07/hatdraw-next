"use client";
// Pricing table with a Per draw / Yearly switch (adapted from the Kara UI "pricing-table"
// block): a pill that glides between the two, and three cards (Small circle, Big circle,
// Ajo). No glass here: a price flips over like a card when the switch changes it, and
// each button flips over on hover. Plain CSS on the Indigo & Starch tokens.
import Link from "next/link";
import { useId, useState } from "react";
import { Owo } from "./motifs";
import { naira } from "@/lib/config";
import { landing } from "@/lib/copy/landing";

export type Billing = "draw" | "yearly";
type PerPeriod<T> = Record<Billing, T>;

export type Plan = {
  id: string;
  name: string;
  who: string;
  /** ₦. 0 in both periods = free. */
  price: PerPeriod<number>;
  /** Shown after the price, e.g. "per draw". */
  unit: PerPeriod<string>;
  note: PerPeriod<string>;
  features: string[];
  popular?: boolean;
  cta: { label: string; href: string };
  /** An extra text link under the button, e.g. "Talk to us" by email. */
  extra?: { label: string; href: string };
};

const P = landing.pricing;

export default function PricingTable({ plans }: { plans: Plan[] }) {
  const [period, setPeriod] = useState<Billing>("draw");
  return (
    <div className="pricing-table">
      <BillingToggle value={period} onChange={setPeriod} />
      <div className="prices">
        {plans.map((p) => <PlanCard key={p.id} plan={p} period={period} />)}
      </div>
    </div>
  );
}

function BillingToggle({ value, onChange }: { value: Billing; onChange: (b: Billing) => void }) {
  const options: { value: Billing; label: string }[] = [
    { value: "draw", label: P.perDrawTab },
    { value: "yearly", label: P.yearly },
  ];
  return (
    <fieldset className="billing" data-period={value}>
      <legend className="sr-only">{P.billingPeriod}</legend>
      <span className="billing-pill" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
          {o.value === "yearly" && <span className="billing-badge">{P.yearlyBadge}</span>}
        </button>
      ))}
    </fieldset>
  );
}

function PlanCard({ plan, period }: { plan: Plan; period: Billing }) {
  const titleId = useId();
  const free = plan.price.draw === 0 && plan.price.yearly === 0;
  const face: Face = {
    amount: free ? P.free : naira(plan.price[period]),
    unit: free ? "" : plan.unit[period],
    note: plan.note[period],
  };
  return (
    <section aria-labelledby={titleId} className={`price${plan.popular ? " hot" : ""}`}>
      <h3 id={titleId}>{plan.name}</h3>
      <div className="who">{plan.who}</div>
      <FlipPrice face={face} />
      <ul>{plan.features.map((t) => <li key={t}><Owo size={16} strokeWidth={6} color="var(--indigo)" />{t}</li>)}</ul>
      <FlipButton href={plan.cta.href} label={plan.cta.label} />
      {plan.extra && <a href={plan.extra.href} className="price-note price-extra">{plan.extra.label}</a>}
    </section>
  );
}

type Face = { amount: string; unit: string; note: string };
const sameFace = (a: Face, b: Face) => a.amount === b.amount && a.unit === b.unit && a.note === b.note;

// The price is a two-sided card. When it changes, the new price is written on the side
// facing away and the card turns over to show it. Only the side facing up is read out.
function FlipPrice({ face }: { face: Face }) {
  const [st, setSt] = useState({ faces: [face, face] as [Face, Face], up: 0 as 0 | 1 });
  if (!sameFace(face, st.faces[st.up])) {
    const up = (1 - st.up) as 0 | 1;
    const faces: [Face, Face] = [...st.faces];
    faces[up] = face;
    setSt({ faces, up });
  }
  return (
    <div className={`price-flip${st.up ? " is-turned" : ""}`} aria-live="polite">
      <div className="price-flip-inner">
        {st.faces.map((f, i) => (
          <div key={i} className={`price-flip-face${i ? " price-flip-back" : ""}`} aria-hidden={i !== st.up}>
            <div className="amt">
              <strong>{f.amount}</strong>
              {f.unit && <small>{f.unit}</small>}
            </div>
            <p className="price-note">{f.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// A button that rolls over like a cube on hover or keyboard focus: outlined on the front,
// filled with an arrow on the face that turns up. The label is read once.
function FlipButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flip-cta">
      <span className="sr-only">{label}</span>
      <span className="flip-cta-box" aria-hidden="true">
        <span className="flip-cta-face flip-cta-front">{label}</span>
        <span className="flip-cta-face flip-cta-top">{label} <span>→</span></span>
      </span>
    </Link>
  );
}

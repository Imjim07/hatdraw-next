"use client";
// Pricing table with a Monthly/Yearly toggle, adapted from the Kara UI
// "pricing-table" block (karaui.kamisama-v0.my.id/components/blocks/pricing-table).
// Same behaviour — a pill that glides between periods, prices that roll
// digit-by-digit, a note that swaps under the price — rebuilt in plain CSS on
// the Indigo & Starch tokens. No Tailwind, motion or icon library.
import { useId, useState } from "react";
import { Owo } from "./motifs";
import SpecularButton from "./SpecularButton";
import { naira } from "@/lib/config";

export type Billing = "monthly" | "yearly";
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
  tag?: string;
  /** No href: rendered as a disabled label. */
  cta: PerPeriod<{ label: string; href?: string; variant: "gold" | "ghost" }>;
};

export default function PricingTable({ plans, yearlyBadge }: { plans: Plan[]; yearlyBadge?: string }) {
  const [period, setPeriod] = useState<Billing>("monthly");
  return (
    <div className="pricing-table">
      <BillingToggle value={period} onChange={setPeriod} badge={yearlyBadge} />
      <div className="prices">
        {plans.map((p) => <PlanCard key={p.id} plan={p} period={period} />)}
      </div>
    </div>
  );
}

function BillingToggle({ value, onChange, badge }: { value: Billing; onChange: (b: Billing) => void; badge?: string }) {
  const options: { value: Billing; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];
  return (
    <fieldset className="billing" data-period={value}>
      <legend className="sr-only">Billing period</legend>
      <span className="billing-pill" aria-hidden="true" />
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
          {o.value === "yearly" && badge && <span className="billing-badge">{badge}</span>}
        </button>
      ))}
    </fieldset>
  );
}

function PlanCard({ plan, period }: { plan: Plan; period: Billing }) {
  const titleId = useId();
  const free = plan.price.monthly === 0 && plan.price.yearly === 0;
  const amount = free ? "Free" : naira(plan.price[period]);
  const cta = plan.cta[period];
  return (
    <section aria-labelledby={titleId} className={`price${plan.popular ? " hot" : ""}`}>
      {plan.tag && <span className="tag">{plan.tag}</span>}
      <h3 id={titleId}>{plan.name}</h3>
      <div className="who">{plan.who}</div>
      <div className="amt">
        <strong><Roll text={amount} /></strong>
        {!free && <small>{plan.unit[period]}</small>}
      </div>
      <p className="price-note" key={plan.note[period]}>{plan.note[period]}</p>
      <ul>{plan.features.map((t) => <li key={t}><Owo size={16} strokeWidth={6} color="var(--indigo)" />{t}</li>)}</ul>
      {cta.href
        ? <SpecularButton href={cta.href} className={`btn btn-${cta.variant}`}>{cta.label}</SpecularButton>
        : <span className="btn btn-ghost btn-off" aria-disabled="true">{cta.label}</span>}
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

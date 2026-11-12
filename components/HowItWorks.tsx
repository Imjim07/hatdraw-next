import type { ReactNode } from "react";
import { AyeDegbe, Dundun, Sunbebe } from "./motifs";

// "How it works", laid out after the shadcn blocks "features-2" block: centred
// heading, three centred cards, each with a faded grid behind a small framed
// mark. Rebuilt in plain CSS (no Tailwind, card or icon library); our adire
// motifs stand in for the lucide icons.
const STEPS = [
  { mark: <Sunbebe size={30} />, title: "Add the names", text: "Type them in or paste a list from your WhatsApp group. Set the budget, the date and where the exchange is happening." },
  { mark: <AyeDegbe size={30} />, title: "Shake the hat", text: "Nobody draws themselves, and couples or housemates can be kept apart if you set that rule." },
  { mark: <Dundun size={30} />, title: "Everyone unwraps", text: "Send each person their own link, or pass one phone around the room. They beat the starch off an adire cloth to see who they're buying for." },
];

export default function HowItWorks() {
  return (
    <section className="band how" id="how"><div className="wrap">
      <div className="how-head">
        <div className="eyebrow">How it works</div>
        <h2>Three steps. Two minutes.</h2>
        <p className="sub">No apps to install and no accounts. Everyone keeps their surprise until gift day.</p>
      </div>
      <ol className="how-steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="how-card">
            <Decorator>{s.mark}</Decorator>
            <div className="how-num">Step {i + 1}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </div></section>
  );
}

function Decorator({ children }: { children: ReactNode }) {
  return (
    <div className="how-deco" aria-hidden="true">
      <div className="how-deco-grid" />
      <div className="how-deco-mark">{children}</div>
    </div>
  );
}

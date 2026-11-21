import type { CSSProperties, ReactNode } from "react";
import { AyeDegbe } from "./motifs";
import { landing } from "@/lib/copy/landing";
import { Headline } from "@/components/GradientText";

// "How it works", laid out after the shadcn blocks "features-2" block: centred
// heading, three centred cards, each with a faded grid behind a small framed
// mark. Rebuilt in plain CSS (no Tailwind, card or icon library); our adire
// motifs stand in for the lucide icons.
// Words follow the Secret Santa column of the deck's "How it works" (the ajo column is in
// copy.landing.how.ajo, for when the section follows a mode toggle).
// Steps 1 and 2: Icons8 icons (credited in the footer), tinted with the text colour so they
// follow the theme. Step 3: the adire motif that used to mark step 2.
const icon = (name: string) => <i className="tint-ico how-ico" style={{ "--ico": `url(/icons/${name}.png)` } as CSSProperties} />;
const MARKS = [icon("how-step1"), icon("how-step2"), <AyeDegbe key="c" size={30} />];
const H = landing.how;
const STEPS = H.santa.map((s, i) => ({ ...s, mark: MARKS[i] }));

export default function HowItWorks() {
  return (
    <section className="band how" id="how"><div className="wrap">
      <div className="how-head">
        <div className="eyebrow">{H.eyebrow}</div>
        <h2><Headline>{H.heading}</Headline></h2>
        <p className="sub">{H.subline}</p>
      </div>
      <ol className="how-steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="how-card">
            <Decorator lag={0.1 + i * 0.1}>{s.mark}</Decorator>
            <div className="how-num">{H.step(i + 1)}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </div></section>
  );
}

// data-lag: with smooth scrolling on, each mark trails the scroll a little more than
// the one before it.
function Decorator({ children, lag }: { children: ReactNode; lag: number }) {
  return (
    <div className="how-deco" aria-hidden="true" data-lag={lag}>
      <div className="how-deco-grid" />
      <div className="how-deco-mark">{children}</div>
    </div>
  );
}

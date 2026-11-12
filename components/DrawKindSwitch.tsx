import Link from "next/link";
import { AyeDegbe, Owo } from "./motifs";

// Where a draw starts: a gift exchange (Secret Santa) or an ajo payout order.
// Each choice is a mode card: the stripe across its top is that mode's colour.
export default function DrawKindSwitch({ current }: { current: "gift" | "ajo" }) {
  return (
    <nav className="field kind-switch" aria-label="What are you drawing?">
      <span className="lbl">What are you drawing?</span>
      <div className="kind-cards">
        <Link href="/draw" data-mode="santa" className={`mode-card${current === "gift" ? " on" : ""}`} aria-current={current === "gift" ? "page" : undefined}>
          <AyeDegbe size={26} /><h3>Gift exchange</h3>
        </Link>
        <Link href="/ajo" data-mode="ajo" className={`mode-card${current === "ajo" ? " on" : ""}`} aria-current={current === "ajo" ? "page" : undefined}>
          <Owo size={26} strokeWidth={5} /><h3>Ajo payout order</h3>
        </Link>
      </div>
    </nav>
  );
}

import Link from "next/link";
import { AyeDegbe, Owo } from "./motifs";

// Where a draw starts: a gift exchange (Secret Santa) or an ajo payout order.
// Same look as the wizard's segmented choices.
export default function DrawKindSwitch({ current }: { current: "gift" | "ajo" }) {
  return (
    <nav className="field kind-switch" aria-label="What are you drawing?">
      <span className="lbl">What are you drawing?</span>
      <div className="seg two">
        <Link href="/draw" className={current === "gift" ? "on" : ""} aria-current={current === "gift" ? "page" : undefined}>
          <b><AyeDegbe size={26} /></b>Gift exchange
        </Link>
        <Link href="/ajo" className={current === "ajo" ? "on" : ""} aria-current={current === "ajo" ? "page" : undefined}>
          <b><Owo size={26} strokeWidth={5} /></b>Ajo payout order
        </Link>
      </div>
    </nav>
  );
}

import { AyeDegbe, Owo } from "./motifs";
import BorderGlow from "./ui/BorderGlow";

// Where a draw starts: a gift exchange (Secret Santa) or an ajo payout order.
// Each choice is a mode card bordered in that mode's colour (green for gifts, gold for
// ajo); the border glows near the pointer, and the chosen card keeps the blended
// border all the way round.
export default function DrawKindSwitch({ current }: { current: "gift" | "ajo" }) {
  return (
    <nav className="field kind-switch" aria-label="What are you drawing?">
      <span className="lbl">What are you drawing?</span>
      <div className="kind-cards">
        <BorderGlow
          href="/draw" data-mode="santa" className={`mode-card${current === "gift" ? " on" : ""}`}
          aria-current={current === "gift" ? "page" : undefined}
          colors={["var(--pine)", "#6FBF95", "#2F6B52"]} glowColor="155 45 62"
        >
          <AyeDegbe size={26} /><h3>Gift exchange</h3>
        </BorderGlow>
        <BorderGlow
          href="/ajo" data-mode="ajo" className={`mode-card${current === "ajo" ? " on" : ""}`}
          aria-current={current === "ajo" ? "page" : undefined}
          colors={["var(--palm-gold)", "#E08A1E", "#F7CF6B"]} glowColor="40 87 66"
        >
          <Owo size={26} strokeWidth={5} /><h3>Ajo payout order</h3>
        </BorderGlow>
      </div>
    </nav>
  );
}

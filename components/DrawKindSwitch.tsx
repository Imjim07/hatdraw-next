import BorderGlow from "./ui/BorderGlow";
import { santa } from "@/lib/copy/santa";

const K = santa.kindSwitch;

// Where a draw starts: a gift exchange (Secret Santa) or an ajo payout order.
// Each choice is a mode card bordered in that mode's colour (green for gifts, gold for
// ajo); the border glows near the pointer, and the chosen card keeps the blended
// border all the way round. Icons (Icons8): a gift box, drawn in the text colour so it shows
// on both themes; and three people for ajo, in its own colours (a light-headed copy in dark mode).
export default function DrawKindSwitch({ current }: { current: "gift" | "ajo" }) {
  return (
    <nav className="field kind-switch" aria-label={K.label}>
      <span className="lbl">{K.label}</span>
      <div className="kind-cards">
        <BorderGlow
          href="/draw" data-mode="santa" className={`mode-card${current === "gift" ? " on" : ""}`}
          aria-current={current === "gift" ? "page" : undefined}
          colors={["var(--pine)", "#6FBF95", "#2F6B52"]} glowColor="155 45 62"
        >
          <i className="dk-ico dk-ico-gift" aria-hidden="true" /><h3>{K.gift}</h3>
        </BorderGlow>
        <BorderGlow
          href="/ajo" data-mode="ajo" className={`mode-card${current === "ajo" ? " on" : ""}`}
          aria-current={current === "ajo" ? "page" : undefined}
          colors={["var(--palm-gold)", "#E08A1E", "#F7CF6B"]} glowColor="40 87 66"
        >
          <i className="dk-ico dk-ico-ajo" aria-hidden="true" /><h3>{K.ajo}</h3>
        </BorderGlow>
      </div>
    </nav>
  );
}

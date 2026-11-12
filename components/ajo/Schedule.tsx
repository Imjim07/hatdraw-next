import type { ReactNode } from "react";
import { naira } from "@/lib/config";
import { longDate } from "@/lib/ajo/client";
import type { PublicTurn } from "@/lib/ajo/types";

// The payout schedule: one row per turn (turn pit · name and date · amount).
// The next turn to come has the gold edge (next = −1: all paid out; −2: not
// known yet). On phones each row stacks, so there is never sideways scrolling.
export default function Schedule({ turns, next, action }: { turns: PublicTurn[]; next: number; action?: (t: PublicTurn) => ReactNode }) {
  return (
    <ol className="sched" aria-label="Payout order">
      {turns.map((t, i) => (
        <li key={t.turn} className={`sched-row${i === next ? " next" : ""}${(next >= 0 && i < next) || next === -1 ? " past" : ""}`}>
          <span className="sched-turn" aria-label={`Turn ${t.turn}`}>{t.turn}</span>
          <span className="sched-who">
            <b>{t.name}</b>
            <span className="sched-meta">
              {longDate(t.date)}
              {i === next && <span className="sched-next"> · next</span>}
              {t.pinned && <span> · agreed before the draw</span>}
            </span>
          </span>
          <span className="sched-amt">{naira(t.amount)}</span>
          {action && <span className="sched-act">{action(t)}</span>}
        </li>
      ))}
    </ol>
  );
}

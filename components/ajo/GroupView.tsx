"use client";
import { useEffect, useState, type ReactNode } from "react";
import SpecularButton from "@/components/SpecularButton";
import AyoSow from "./AyoSow";
import Schedule from "./Schedule";
import { FREQ_LABEL, drawnLabel, longDate, shortDate } from "@/lib/ajo/client";
import { lagosToday, nextTurnIndex, payoutAmount } from "@/lib/ajo/logic";
import { ajo as A } from "@/lib/copy/ajo";
import type { PublicGroup, PublicTurn } from "@/lib/ajo/types";

export const NO_MONEY = A.noMoney;

/** The heading block every ajo screen shares. */
export function GroupHead({ g, eyebrow }: { g: PublicGroup; eyebrow: string }) {
  const n = g.members.length;
  return (
    <>
      <div className="eyebrow">{eyebrow}</div>
      <h2>{g.name}</h2>
      <div className="summary">
        <span>{A.head.each(g.amount)}</span>
        <span>{FREQ_LABEL[g.frequency]}</span>
        <span>{A.head.members(n)}</span>
        <span>{A.head.perTurn(payoutAmount(g.amount, n))}</span>
        <span>{A.head.from(longDate(g.startDate))}</span>
      </div>
    </>
  );
}

export const drawInfo = (g: PublicGroup) =>
  g.draw ? [A.schedule.drawn(drawnLabel(g.draw.drawnAt)), g.draw.redrawCount ? A.schedule.redrawn(g.draw.redrawCount) : A.schedule.neverRedrawn].join(" · ") : "";

/**
 * Before the draw: the members. During a live countdown: the countdown, synced
 * to the server clock. Then the sowing draw (once), then the schedule.
 * `offset` = server time − device time. `sowFrom` (device ms) plays the sowing
 * from that moment, e.g. right after an instant draw.
 */
export function OrderView({ g, offset, refresh, sowFrom, action }: {
  g: PublicGroup;
  offset: number;
  refresh: () => Promise<void>;
  sowFrom?: number | null;
  action?: (t: PublicTurn) => ReactNode;
}) {
  const revealAt = g.liveRevealAt ? Date.parse(g.liveRevealAt) - offset : null; // device time
  const [left, setLeft] = useState(() => (revealAt ? revealAt - Date.now() : 0));
  const [sowed, setSowed] = useState<number | null>(null); // the sowing (by start time) already played
  const [sow, setSow] = useState<number | null>(null); // the sowing to play now, if any
  const [today, setToday] = useState(""); // Nigeria's date, by the server clock

  // Play the sowing once: from the live reveal moment, or from `sowFrom` after an
  // instant draw. Arriving more than 5 seconds later: just show the schedule.
  const start = g.turns ? sowFrom ?? (g.draw?.mode === "live" && revealAt ? revealAt : null) : null;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depends on the device clock, which can't be read during render
    setSow(start != null && Date.now() - start < 5000 ? start : null);
    setToday(lagosToday(new Date(Date.now() + offset)));
  }, [start, offset]);

  // Count down to a live reveal, then fetch the order (the server only gives it out after the reveal time).
  useEffect(() => {
    if (g.turns || !revealAt) return;
    let fetched = false;
    const t = setInterval(() => {
      const ms = revealAt - Date.now();
      setLeft(ms);
      if (ms <= 0 && !fetched) { fetched = true; refresh().finally(() => { fetched = false; }); }
    }, 200);
    return () => clearInterval(t);
  }, [g.turns, revealAt, refresh]);

  if (!g.turns) {
    if (g.status === "scheduled_live" && revealAt) {
      const s = Math.max(0, Math.ceil(left / 1000));
      return (
        <div className="drum">
          <div>
            <div className="big" role="timer" aria-live="off">{s > 0 ? A.live.countdown(s) : A.live.sowing}</div>
            <p className="hint">{s > 0 ? A.live.watching : A.live.drawingOrder}</p>
          </div>
        </div>
      );
    }
    return (
      <>
        <p className="hint" style={{ marginTop: 18 }}>{A.schedule.notDrawn}</p>
        <ul className="board" aria-label={A.setup2.boardLabel}>
          {g.members.map((m) => (
            <li key={m.name} className="hole filled"><span className="seed" aria-hidden="true" /><span className="nm" title={m.name}>{m.name}</span>
              {m.pinnedTurn && <span className="turn-n">{A.schedule.turn(m.pinnedTurn)}</span>}</li>
          ))}
        </ul>
        {g.members.some((m) => m.pinnedTurn) && <p className="hint">{A.schedule.agreedNote}</p>}
      </>
    );
  }

  if (!today) return null; // first frame: the clock hasn't been read yet, so don't flash the schedule before a sowing
  if (sow !== null && sow !== sowed) return <AyoSow names={g.turns.map((t) => t.name)} startAt={sow} onDone={() => setTimeout(() => setSowed(sow), 700)} />;

  const next = nextTurnIndex(g.turns.map((t) => t.date), today);
  return (
    <>
      <p className="hint" style={{ marginTop: 14 }}><b>{A.schedule.locked}</b> · {drawInfo(g)}</p>
      {next === -1 && <p className="hint">{A.schedule.complete}</p>}
      <Schedule turns={g.turns} next={next} action={action} />
      {g.swaps.length > 0 && (
        <div className="field">
          <span className="lbl">{A.schedule.swaps}</span>
          <ul className="swap-log">
            {g.swaps.map((s) => <li key={s.a + s.b + s.at}>{A.schedule.swapped(s.a, s.b, shortDate(s.at.slice(0, 10)))}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

export function CalendarButton({ publicId }: { publicId: string }) {
  return <SpecularButton href={`/api/ajo/groups/${publicId}/calendar.ics`} className="btn btn-ghost btn-sm" download>{A.schedule.calendar}</SpecularButton>;
}

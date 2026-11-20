"use client";
import SpecularButton from "@/components/SpecularButton";
import { useRef, useState } from "react";
import Link from "next/link";
import { burst } from "./Ambient";
import { AdireGrid, IgiIye, Ododo } from "./motifs";
import { serifName } from "@/lib/marks";
import { naira } from "@/lib/config";
import type { RevealPayload } from "@/lib/types";

import { revealScreen as T } from "@/lib/copy/revealScreen";
import { ideas as IDEAS } from "@/lib/copy/ideas";

function fmtDate(d: string) {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }); } catch { return d; }
}
function daysTo(d: string) {
  const t = new Date(d + "T00:00:00").getTime(), now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((t - now.getTime()) / 864e5);
}

const IDLE_IDEA = T.idea.idle;

// Crack lines in the dried starch (viewBox 0 0 100 100). Tap 1 shows the first set,
// tap 2 adds the second set and knocks three chunks of crust off.
const CRACKS_1 = ["M50 48 L44 38 L46 28 L40 16", "M50 48 L60 44 L70 47 L82 40", "M50 48 L52 60 L47 70"];
const CRACKS_2 = ["M40 16 L30 12 L20 18", "M82 40 L88 52 L84 64", "M47 70 L36 78 L28 90", "M60 44 L64 30 L74 22", "M44 38 L34 46 L24 50 L14 56", "M52 60 L62 64 L70 72"];
const CHUNKS = ["M66 13 L71 9 L79 11 L80 15 L85 19 L79 23 L76 28 L71 24 L65 21 Z", "M10 61 L15 57 L22 55 L25 60 L28 66 L23 69 L20 75 L13 74 L9 69 Z", "M58 78 L63 72 L69 73 L72 70 L77 78 L74 83 L70 89 L62 88 L59 84 Z"];

type Props = { data: RevealPayload; context: "link" | "preview" | "phone"; actions?: React.ReactNode;
  /** A link button rendered here, so pages that lazy-load the reveal (/r) don't ship the button code up front. */
  cta?: { href: string; label: string } };

export default function GiftReveal({ data, context, actions, cta }: Props) {
  const [taps, setTaps] = useState(0);
  const [idea, setIdea] = useState(IDLE_IDEA);
  const spinning = useRef(false);
  const { e, g, r } = data;
  const open = taps >= 3;
  const giver = serifName(g), match = serifName(r);

  const tap = () => {
    if (open) return;
    const n = taps + 1;
    setTaps(n);
    if (n === 3) setTimeout(burst, 450);
  };

  const spin = () => {
    if (spinning.current) return;
    spinning.current = true;
    const b = Number(e.budget) || 0;
    const pool = b && b < 10000 ? IDEAS.low : b && b < 30000 ? IDEAS.mid : b >= 30000 ? IDEAS.high : [...IDEAS.low, ...IDEAS.mid];
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    let k = 0;
    const iv = setInterval(() => {
      setIdea(pick());
      if (++k > 12) { clearInterval(iv); setIdea(pick()); spinning.current = false; }
    }, 70);
  };

  const dd = e.date ? daysTo(e.date) : null;
  const details: { k: string; wide?: boolean; body: React.ReactNode }[] = [];
  if (e.budget) details.push({ k: "b", body: <><small>{T.budget}</small><b>{naira(e.budget)}</b></> });
  if (e.date) details.push({ k: "d", body: <><small>{T.giftDay}</small><b>{fmtDate(e.date)}</b><br /><span className="hint" style={{ margin: 0 }}>{T.daysToGo(dd!)}</span></> });
  if (e.where) details.push({ k: "w", wide: true, body: <><small>{T.where}</small><b><i className="tint-ico where-ico" aria-hidden="true" />{e.where}</b></> });
  if (details.length === 1) details[0].wide = true;

  // ~72px for short names, shrinking so long ones still fit across the cloth.
  const nameSize = Math.max(26, Math.min(72, 420 / Math.max(1, r.length)));

  return (
    <div className="reveal" data-mode="santa"><div className="reveal-inner">
      <div className="eyebrow">{e.name}{context === "preview" ? ` · ${T.preview}` : ""}</div>
      <h2 style={{ marginTop: 12 }}>{T.hi} <span className={giver.className}>{giver.text}</span>. <i className="hush-ico hi-ico" aria-hidden="true" /></h2>
      <p className="sub" style={{ margin: "0 auto" }} aria-live="polite">
        {open ? <>{T.gifting} <span className="sr-only">{r}.</span></> : taps === 0 ? T.before : T.midTaps(3 - taps)}
      </p>

      <button
        type="button"
        className={`cloth s${Math.min(taps, 3)} ${taps > 0 && !open ? (taps % 2 ? "shake-a" : "shake-b") : ""}`}
        aria-label={open ? T.clothOpen(r) : T.clothLabel(3 - taps)}
        aria-disabled={open || undefined}
        onClick={tap}
      >
        <AdireGrid className="cloth-grid" />
        {open && (
          <span className="cloth-name" aria-hidden="true">
            <IgiIye size={34} color="var(--dye-fg)" strokeWidth={6} />
            <span className={match.className} style={{ fontSize: `calc(min(300px, 80vw) * ${(nameSize / 300).toFixed(3)})` }}>{match.text}</span>
          </span>
        )}
        <span className="starch" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <g className="chunks">{CHUNKS.map((d) => <path key={d} d={d} />)}</g>
            <g className="cracks c1">{CRACKS_1.map((d) => <path key={d} d={d} pathLength={1} />)}</g>
            <g className="cracks c2">{CRACKS_2.map((d) => <path key={d} d={d} pathLength={1} />)}</g>
          </svg>
        </span>
      </button>

      {!open ? (
        <div className="cloth-copy">
          <div className="taps" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i < taps ? "on" : ""} />)}</div>
          <p className="hint">{T.explainer}</p>
        </div>
      ) : (
        <div className="match">
          <p className="sub" style={{ margin: "0 auto" }}>{T.keepIt} <i className="hush-ico" aria-hidden="true" /></p>
          {details.length > 0 && (
            <div className="details ob">
              {details.map((d) => <div key={d.k} className={d.wide ? "wide" : undefined}>{d.body}</div>)}
            </div>
          )}
          <div className="idea">
            <div className="eyebrow idea-head"><Ododo size={22} color="var(--indigo)" strokeWidth={5} />{T.idea.head}</div>
            <div className="q" aria-live="polite">{idea}</div>
            <SpecularButton className="btn btn-primary btn-sm" onClick={spin}>{idea === IDLE_IDEA ? T.idea.spin : T.idea.again}</SpecularButton>
          </div>
          {/* Only the budget goes in this URL: never the giver's or receiver's name. Not shown in
              the organiser's preview or pass-the-phone, where leaving would lose the draw. */}
          {context === "link" && Number(e.budget) > 0 && (
            <Link href={`/gifts?max=${Number(e.budget)}`} className="idea-shop">{T.seeGifts(e.budget)} <span aria-hidden="true">→</span></Link>
          )}
          {e.note && <p className="note">&ldquo;{e.note}&rdquo; {T.fromOrganiser}</p>}
          <div style={{ marginTop: 26, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>{actions}{cta && <SpecularButton href={cta.href} className="btn btn-ghost">{cta.label}</SpecularButton>}</div>
        </div>
      )}
    </div></div>
  );
}

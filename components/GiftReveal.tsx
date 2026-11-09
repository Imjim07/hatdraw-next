"use client";
import { useRef, useState } from "react";
import { burst } from "./Ambient";
import { naira } from "@/lib/config";
import type { RevealPayload } from "@/lib/types";

const IDEAS = {
  low: ["A scented candle", "A fun mug + their favourite tea", "Custom keychain with their name", "Chocolate & a handwritten card", "Phone stand or ring holder", "Fancy socks", "A plant in a cute pot", "Notebook + nice pen"],
  mid: ["Bluetooth speaker", "A book you think they'd love", "Perfume oil or body mist", "Wireless charger", "Ankara tote bag", "Skincare set", "Desk organiser", "Board game for game night"],
  high: ["Wireless earbuds", "Smartwatch or fitness band", "A nice bottle of wine", "Leather wallet or bag", "Spa day voucher", "Power bank + fast charger", "Instant camera", "Dinner for two"],
};

function fmtDate(d: string) {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }); } catch { return d; }
}
function daysTo(d: string) {
  const t = new Date(d + "T00:00:00").getTime(), now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((t - now.getTime()) / 864e5);
}

type Props = { data: RevealPayload; context: "link" | "preview" | "phone"; actions?: React.ReactNode };

export default function GiftReveal({ data, context, actions }: Props) {
  const [taps, setTaps] = useState(0);
  const [open, setOpen] = useState(false);
  const [shake, setShake] = useState(0);
  const [idea, setIdea] = useState("Spin for a gift idea");
  const spinning = useRef(false);
  const { e, g, r } = data;

  const tap = () => {
    if (taps >= 3) return;
    const n = taps + 1;
    setTaps(n);
    setShake((s) => s + 1);
    if (n === 3) setTimeout(() => { setOpen(true); burst(); }, 700);
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
      if (++k > 12) { clearInterval(iv); setIdea(pick() + " 🎁"); spinning.current = false; }
    }, 70);
  };

  const dd = e.date ? daysTo(e.date) : null;
  const details: { k: string; wide?: boolean; body: React.ReactNode }[] = [];
  if (e.budget) details.push({ k: "b", body: <><small>Budget</small><b>{naira(e.budget)}</b></> });
  if (e.date) details.push({ k: "d", body: <><small>Gift day</small><b>{fmtDate(e.date)}</b><br /><span className="hint" style={{ margin: 0 }}>{dd! > 1 ? `${dd} days to go` : dd === 1 ? "Tomorrow!" : dd === 0 ? "Today!" : "Already passed"}</span></> });
  if (e.where) details.push({ k: "w", wide: true, body: <><small>Where</small><b>📍 {e.where}</b></> });
  if (details.length === 1) details[0].wide = true;

  return (
    <div className="reveal"><div className="reveal-inner">
      <div className="eyebrow">{e.name}{context === "preview" ? " · preview" : ""}</div>
      <h2 className="serif" style={{ marginTop: 12 }}>Hi {g} 👋</h2>

      {!open ? (
        <>
          <p className="sub" style={{ margin: "0 auto" }}>Someone&apos;s name is waiting inside. Tap the gift three times to unwrap it.</p>
          <div
            key={shake}
            className={`gift ${taps > 0 && taps < 3 ? "shake" : ""} ${taps === 3 ? "open" : ""}`}
            role="button" tabIndex={0} aria-label={`Tap to unwrap (${3 - taps} left)`}
            onClick={tap}
            onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); tap(); } }}
          >
            <div className="box"><div className="rib" /></div>
            <div className="lid"><div className="rib" /><div className="bow" /></div>
          </div>
          <div className="taps" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i < taps ? "on" : ""} />)}</div>
        </>
      ) : (
        <div className="match" aria-live="polite">
          <div className="eyebrow">This Christmas, you&apos;re gifting</div>
          <div className="to">{r}</div>
          <p className="sub" style={{ margin: "0 auto" }}>Keep it to yourself 🤫</p>
          {details.length > 0 && (
            <div className="details">
              {details.map((d) => <div key={d.k} className={d.wide ? "wide" : undefined}>{d.body}</div>)}
            </div>
          )}
          <div className="idea">
            <div className="eyebrow">Stuck for ideas?</div>
            <div className="q">{idea}</div>
            <button className="btn btn-indigo btn-sm" onClick={spin}>Spin for another</button>
          </div>
          {e.note && <p className="note">&ldquo;{e.note}&rdquo; (from the organizer)</p>}
          <div style={{ marginTop: 26, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>{actions}</div>
        </div>
      )}
    </div></div>
  );
}

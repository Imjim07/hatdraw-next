"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import GiftReveal from "@/components/GiftReveal";
import Shekere from "@/components/Shekere";
import { serifName } from "@/lib/marks";
import { burst } from "@/components/Ambient";
import { PRICING, PAYWALL_MODE, naira } from "@/lib/config";
import type { DrawResponse, EventInfo, Kind, RevealPayload } from "@/lib/types";

type Draft = { ev: EventInfo; people: string[]; ex: [string, string][]; circle: boolean; blind: boolean };
type Result = Extract<DrawResponse, { ok: true }>;

const DRAFT_KEY = "hd-draft-v2";
const AV = ["#E3B45A", "#EFE8D8", "#C9CFE3", "#F2CF86", "#9AA4C4", "#D9CCB0"];
const KINDS: { k: Kind; icon: string; label: string }[] = [
  { k: "friends", icon: "🥂", label: "Friends" }, { k: "family", icon: "🏡", label: "Family" }, { k: "company", icon: "💼", label: "Company" },
];
const blankDraft = (): Draft => ({
  ev: { name: "", kind: "friends", budget: "", date: "", where: "", note: "" },
  people: [], ex: [], circle: true, blind: true,
});

// First two letters, counting a letter plus its tone marks as one (Ọ̀pẹ́ → Ọ̀P).
const initials = (s: string) => Array.from(new Intl.Segmenter().segment(s.normalize("NFC")), (x) => x.segment).slice(0, 2).join("").toUpperCase();

async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select();
    try { return document.execCommand("copy"); } catch { return false; } finally { ta.remove(); }
  }
}

declare global { interface Window { PaystackPop?: new () => { newTransaction: (o: object) => void } } }
function loadPaystack(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "https://js.paystack.co/v2/inline.js";
    s.onload = () => res(); s.onerror = () => rej(new Error("Paystack failed to load")); document.head.appendChild(s);
  });
}

export default function DrawPage() {
  const [d, setD] = useState<Draft>(blankDraft);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [nameIn, setNameIn] = useState("");
  const [exA, setExA] = useState(""); const [exB, setExB] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [tab, setTab] = useState<"links" | "phone">("links");
  const [seen, setSeen] = useState<string[]>([]);
  const [view, setView] = useState<{ data: RevealPayload; context: "preview" | "phone" } | null>(null);
  const [confirmFor, setConfirmFor] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payEmail, setPayEmail] = useState("");
  const [peek, setPeek] = useState(false);
  const [toast, setToast] = useState("");
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nameRef = useRef<HTMLInputElement>(null);

  // Draft persistence (this browser only)
  useEffect(() => {
    let saved: Draft | null = null;
    try { saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch {}
    const base = saved?.ev ? { ...blankDraft(), ...saved } : blankDraft();
    if (!base.ev.date) base.ev = { ...base.ev, date: `${new Date().getFullYear()}-12-24` };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
    setD(base);
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} }, [d, loaded]);

  const say = (t: string) => { setToast(t); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(""), 2400); };
  const setEv = (patch: Partial<EventInfo>) => setD((x) => ({ ...x, ev: { ...x.ev, ...patch } }));
  const go = (n: number) => { setErr(""); setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const n = d.people.length;
  const paid = n > PRICING.FREE_LIMIT;

  const next = () => {
    if (step === 0 && !d.ev.name.trim()) { setErr("Give your exchange a name."); return; }
    if (step === 1 && n < 3) { setErr("You need at least 3 people for a Secret Santa."); return; }
    go(step + 1);
  };

  const addNames = (raw: string) => {
    const parts = raw.split(/[\n,;]+/).map((s) => s.replace(/^\s*\d+[.)-]\s*/, "").trim().slice(0, 40)).filter(Boolean);
    const people = [...d.people];
    let dup = 0;
    for (const p of parts) { if (people.some((q) => q.toLowerCase() === p.toLowerCase())) dup++; else people.push(p); }
    setD((x) => ({ ...x, people }));
    if (dup) say(`${dup} duplicate name${dup > 1 ? "s" : ""} skipped`);
  };
  const removeName = (p: string) => setD((x) => ({ ...x, people: x.people.filter((q) => q !== p), ex: x.ex.filter(([a, b]) => a !== p && b !== p) }));

  const addEx = () => {
    const a = exA || d.people[0], b = exB || d.people[1];
    if (!a || !b || a === b) { setErr("Pick two different people."); return; }
    if (d.ex.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) { setErr("That rule already exists."); return; }
    setErr(""); setD((x) => ({ ...x, ex: [...x.ex, [a, b]] }));
  };

  async function runDraw(reference?: string) {
    setErr(""); setDrawing(true); setResult(null); setSeen([]); go(3);
    const minWait = new Promise((r) => setTimeout(r, 1700));
    try {
      const res = await fetch("/api/draw", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: d.ev, people: d.people, ex: d.ex, circle: d.circle, blind: d.blind, reference }),
      });
      const j: DrawResponse = await res.json();
      await minWait;
      if (!j.ok) {
        setStep(2); setErr(j.error);
        if (j.needsPayment) setPayOpen(true);
        return;
      }
      setResult(j); burst();
      if (d.circle && !j.circle) say("Your rules blocked a single circle, so we used a normal shuffle");
    } catch {
      await minWait; setStep(2); setErr("Couldn't reach the hat. Check your connection and try again.");
    } finally { setDrawing(false); }
  }

  const shake = () => { if (paid) setPayOpen(true); else runDraw(); };

  async function pay() {
    if (PAYWALL_MODE !== "live") { setPayOpen(false); runDraw(); return; }
    if (!/^\S+@\S+\.\S+$/.test(payEmail)) { say("Enter a valid email for your receipt"); return; }
    try {
      await loadPaystack();
      new window.PaystackPop!().newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, email: payEmail, amount: PRICING.ONE_TIME * 100, currency: "NGN",
        onSuccess: (t: { reference: string }) => { setPayOpen(false); runDraw(t.reference); },
        onCancel: () => say("Payment cancelled"),
      });
    } catch { say("Couldn't open Paystack. Try again."); }
  }

  const linkFor = (token: string) => `${window.location.origin}/r#${token}`;
  async function openToken(token: string, context: "preview" | "phone") {
    const r = await fetch("/api/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const j = await r.json();
    if (j.ok) { setView({ data: j.data, context }); window.scrollTo(0, 0); } else say("Couldn't open that one");
  }

  // ---------- full-screen reveal (preview / pass-the-phone) ----------
  if (view) {
    const done = () => { if (view.context === "phone") setSeen((s) => [...s, view.data.g]); setView(null); };
    return <GiftReveal data={view.data} context={view.context}
      actions={<button className="btn btn-gold" onClick={done}>{view.context === "phone" ? "🙈 Hide & pass the phone" : "← Back to links"}</button>} />;
  }

  // An ayo board has two rows of six pits; keep at least that, and fill out the last row.
  const emptyPits = Math.max(12, Math.ceil(n / 6) * 6) - n;
  const tier = paid ? `Big Hat: ${naira(PRICING.ONE_TIME)}` : `Free · ${Math.max(0, PRICING.FREE_LIMIT - n)} free spots left`;

  return (
    <div className="wrap">
      <nav className="top"><Logo /><Link href="/" className="btn btn-ghost btn-sm">← Home</Link></nav>
      <main className="app">
        <div className="steps" role="img" aria-label={`Step ${step + 1} of 4`}>{[0, 1, 2, 3].map((i) => <span key={i === step ? `now-${step}` : i} className={i < step ? "on" : i === step ? "on now" : ""} />)}</div>

        {step === 0 && (
          <div className="panel rise">
            <div className="eyebrow">Step 1 of 4</div>
            <h2>What&apos;s the occasion?</h2>
            <div className="field"><span className="lbl">Who&apos;s playing?</span>
              <div className="seg" role="radiogroup">
                {KINDS.map((k) => <button key={k.k} role="radio" aria-checked={d.ev.kind === k.k} className={d.ev.kind === k.k ? "on" : ""} onClick={() => setEv({ kind: k.k })}><b>{k.icon}</b>{k.label}</button>)}
              </div></div>
            <div className="field"><label htmlFor="ev-name">Name your exchange</label>
              <span className="pit"><input id="ev-name" className="in" maxLength={60} placeholder="e.g. Adeyemi Family Christmas" value={d.ev.name} onChange={(e) => setEv({ name: e.target.value })} /></span></div>
            <div className="row">
              <div className="field"><label htmlFor="ev-budget">Budget per gift (₦)</label>
                <span className="pit"><input id="ev-budget" className="in" inputMode="numeric" placeholder="e.g. 15,000"
                  value={d.ev.budget ? Number(d.ev.budget).toLocaleString("en-NG") : ""}
                  onChange={(e) => setEv({ budget: e.target.value.replace(/\D/g, "").slice(0, 9) })} /></span></div>
              <div className="field"><label htmlFor="ev-date">Exchange date</label>
                <span className="pit"><input id="ev-date" className="in" type="date" value={d.ev.date} onChange={(e) => setEv({ date: e.target.value })} /></span></div>
            </div>
            <div className="field"><label htmlFor="ev-where">Where are gifts exchanged? <small>(optional)</small></label>
              <span className="pit"><input id="ev-where" className="in" maxLength={90} placeholder="e.g. Grandma's house, Surulere" value={d.ev.where} onChange={(e) => setEv({ where: e.target.value })} /></span></div>
            <div className="field"><label htmlFor="ev-note">A note for everyone <small>(optional)</small></label>
              <span className="pit ta"><textarea id="ev-note" className="in" maxLength={200} placeholder="e.g. No gift cards! Dress code: something red." value={d.ev.note} onChange={(e) => setEv({ note: e.target.value })} /></span></div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><span /><button className="btn btn-gold" onClick={next}>Next: add names →</button></div>
          </div>
        )}

        {step === 1 && (
          <div className="panel rise">
            <div className="names-head">
              <div>
                <div className="eyebrow">Step 2 of 4</div>
                <h2>Drop the names in the hat</h2>
                <p className="hint">Press Enter after each name, or paste a whole list (one per line or comma-separated). Each name becomes a bead on the {"\u1E63\u1EB9\u0300k\u1EB9\u0300r\u1EB9\u0300"}.</p>
              </div>
              <Shekere names={d.people} filled={false} maxLabeled={0} className="counting" />
            </div>
            <div className="field chips-in">
              <span className="pit"><input ref={nameRef} className="in" maxLength={400} placeholder="Type a name…" autoComplete="off" aria-label="Name" value={nameIn}
                onChange={(e) => setNameIn(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (nameIn.trim()) { addNames(nameIn); setNameIn(""); } } }}
                onPaste={(e) => { const t = e.clipboardData.getData("text"); if (/[\n,;]/.test(t)) { e.preventDefault(); addNames(t); } }} /></span>
              <button className="btn btn-gold" onClick={() => { if (nameIn.trim()) { addNames(nameIn); setNameIn(""); } nameRef.current?.focus(); }}>Add</button>
            </div>
            <ul className="board" aria-label="Names in the hat">
              {d.people.map((p) => (
                <li key={p} className="hole filled"><span className="seed" aria-hidden="true" /><span className="nm" title={p}>{p}</span>
                  <button aria-label={`Remove ${p}`} onClick={() => removeName(p)}>×</button></li>
              ))}
              {Array.from({ length: emptyPits }, (_, i) => <li key={`e${i}`} className="hole empty" aria-hidden="true" />)}
              {!n && <li className="board-empty">Nobody in the hat yet.</li>}
            </ul>
            <div className="counter"><span>{n} {n === 1 ? "person" : "people"}</span><span className={paid ? "over" : undefined}>{tier}</span></div>
            <div className="meter"><i className={paid ? "over" : ""} style={{ width: `${Math.min(100, (n / PRICING.FREE_LIMIT) * 100)}%` }} /></div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><button className="btn btn-ghost" onClick={() => go(0)}>← Back</button><button className="btn btn-gold" onClick={next}>Next: rules →</button></div>
          </div>
        )}

        {step === 2 && (
          <div className="panel rise">
            <div className="eyebrow">Step 3 of 4</div>
            <h2>House rules</h2>
            <label className="toggle"><input type="checkbox" checked={d.circle} onChange={(e) => setD((x) => ({ ...x, circle: e.target.checked }))} /><span className="sw" />
              <span><b>One big circle</b><span className="d">Gifts pass along a single chain (A→B→C→…→A), so the reveal goes round the room. If your rules make that impossible, we use a normal shuffle.</span></span></label>
            <label className="toggle"><input type="checkbox" checked={d.blind} onChange={(e) => setD((x) => ({ ...x, blind: e.target.checked }))} /><span className="sw" />
              <span><b>Keep it secret from me too</b><span className="d">You&apos;ll only get links, never the matches, so you can play as well.</span></span></label>
            <div className="field"><span className="lbl">Keep these people apart <small>(couples, siblings, flatmates)</small></span>
              <div className="ex-row">
                <span className="pit"><select className="in" aria-label="First person" value={exA || d.people[0]} onChange={(e) => setExA(e.target.value)}>{d.people.map((p) => <option key={p}>{p}</option>)}</select></span>
                <span className="pit"><select className="in" aria-label="Second person" value={exB || d.people[1]} onChange={(e) => setExB(e.target.value)}>{d.people.map((p) => <option key={p}>{p}</option>)}</select></span>
                <button className="btn btn-ghost" onClick={addEx}>Add</button>
              </div>
              <div className="ex-list">
                {d.ex.map(([a, b], i) => <div key={a + b} className="ex"><span>{a} ✕ {b} <span className="hint" style={{ display: "inline" }}>won&apos;t draw each other</span></span>
                  <button onClick={() => setD((x) => ({ ...x, ex: x.ex.filter((_, j) => j !== i) }))}>Remove</button></div>)}
              </div>
            </div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><button className="btn btn-ghost" onClick={() => go(1)}>← Back</button>
              <button className="btn btn-gold" onClick={shake} disabled={drawing}>{drawing ? "Shaking…" : `Shake the hat${paid ? ` · ${naira(PRICING.ONE_TIME)}` : ""}`}</button></div>
          </div>
        )}

        {step === 3 && (
          <div className="panel rise">
            {drawing || !result ? (
              <div className="drum" role="status">
                <Shekere names={d.people} filled={false} maxLabeled={0} shaking className="drawing" />
                <div><div className="big">Shaking…</div><p className="hint">Making sure nobody draws themselves…</p></div>
              </div>
            ) : (
              <>
                <div className="eyebrow">Step 4 of 4 · The hat has spoken</div>
                <h2>{n} names drawn 🎄</h2>
                <div className="summary">
                  {[d.ev.name, d.ev.budget && `Budget ${naira(d.ev.budget)}`, d.ev.date, d.ev.where && `📍 ${d.ev.where}`].filter(Boolean).map((b) => <span key={String(b)}>{b}</span>)}
                </div>
                {result.demoUnlock && <div className="notice">Demo mode: payments aren&apos;t switched on yet, so this big draw was unlocked for free.</div>}
                <div className="tabs" role="tablist">
                  <button role="tab" aria-selected={tab === "links"} className={tab === "links" ? "on" : ""} onClick={() => setTab("links")}>Send private links</button>
                  <button role="tab" aria-selected={tab === "phone"} className={tab === "phone" ? "on" : ""} onClick={() => setTab("phone")}>Pass the phone</button>
                </div>

                {tab === "links" ? (
                  <>
                    <p className="hint" style={{ marginTop: 16 }}>Send each person <b>only their own</b> link. The links are encrypted, so nobody can work out a match from the link itself.</p>
                    <div className="res">
                      {result.givers.map(({ name, token }, i) => {
                        const url = linkFor(token);
                        const wa = "https://wa.me/?text=" + encodeURIComponent(`🎅 Hi ${name}! You're in the "${d.ev.name}" Secret Santa.\nOpen this link to find out who you're gifting. It's only for you, so don't share it:\n${url}`);
                        return (
                          <div key={name} className="res-row">
                            <div className="who"><span className="av" style={{ background: AV[i % AV.length] }}>{initials(name)}</span>{name}</div>
                            <div className="acts">
                              <a className="btn btn-gold btn-sm" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                              <button className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(url)) ? "Link copied ✓" : "Couldn't copy")}>Copy link</button>
                              {!d.blind && <button className="btn btn-ghost btn-sm" onClick={() => openToken(token, "preview")}>Preview</button>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="nav-row" style={{ justifyContent: "flex-start" }}>
                      <button className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(result.givers.map((g) => `${g.name}: ${linkFor(g.token)}`).join("\n\n"))) ? "All links copied ✓" : "Couldn't copy")}>Copy all links</button>
                      {result.pairs && <button className="btn btn-ghost btn-sm" onClick={() => setPeek(true)}>Show all matches</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => { if (paid && PAYWALL_MODE === "live") setPayOpen(true); else runDraw(); }}>↻ Redraw</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="hint" style={{ marginTop: 16 }}>Hand the phone around. Each person taps their own name, unwraps privately, then passes it on.</p>
                    <div className="res">
                      {result.givers.map(({ name, token }, i) => (
                        <div key={name} className={`res-row ${seen.includes(name) ? "seen" : ""}`}>
                          <div className="who"><span className="av" style={{ background: AV[i % AV.length] }}>{initials(name)}</span>{name}</div>
                          {seen.includes(name) ? <span className="hint" style={{ margin: 0 }}>Unwrapped ✓</span>
                            : <button className="btn btn-gold btn-sm" onClick={() => setConfirmFor(token + "\u0000" + name)}>That&apos;s me</button>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {confirmFor && (() => { const [token, name] = confirmFor.split("\u0000"); return (
        <div className="modal" role="dialog" aria-modal="true"><div className="panel" style={{ textAlign: "center" }}>
          <div className="eyebrow">Pass the phone</div>
          <h2 style={{ fontSize: "2rem" }}>Are you <span className={serifName(name).className}>{serifName(name).text}</span>?</h2>
          <p className="sub" style={{ margin: "0 auto" }}>Make sure nobody&apos;s looking over your shoulder.</p>
          <div className="nav-row" style={{ justifyContent: "center" }}>
            <button className="btn btn-ghost" onClick={() => setConfirmFor(null)}>Not me</button>
            <button className="btn btn-gold" onClick={() => { setConfirmFor(null); openToken(token, "phone"); }}>Yes, it&apos;s me</button>
          </div>
        </div></div>); })()}

      {payOpen && (
        <div className="modal" role="dialog" aria-modal="true"><div className="panel">
          <div className="eyebrow">Big Hat</div>
          <h2 style={{ fontSize: "1.8rem" }}>{n} people in the hat</h2>
          <p className="sub">Draws with up to {PRICING.FREE_LIMIT} people are free. Bigger groups pay once for this draw.</p>
          <div className="amt" style={{ margin: "18px 0 6px" }}><strong>{naira(PRICING.ONE_TIME)}</strong><small>one-off</small></div>
          {PAYWALL_MODE === "live" ? (
            <div className="field"><label htmlFor="pay-email">Email for your receipt</label>
              <span className="pit"><input id="pay-email" className="in" type="email" value={payEmail} onChange={(e) => setPayEmail(e.target.value)} placeholder="you@example.com" /></span></div>
          ) : <p className="hint">Demo mode: payments aren&apos;t connected yet, so this unlocks the draw for free.</p>}
          <div className="nav-row"><button className="btn btn-ghost" onClick={() => setPayOpen(false)}>Not now</button>
            <button className="btn btn-gold" onClick={pay}>{PAYWALL_MODE === "live" ? `Pay ${naira(PRICING.ONE_TIME)} & draw` : "Unlock (demo) & draw"}</button></div>
        </div></div>
      )}

      {peek && result?.pairs && (
        <div className="modal" role="dialog" aria-modal="true"><div className="panel">
          <div className="eyebrow">Organizer view</div>
          <h2 style={{ fontSize: "1.8rem" }}>All matches</h2>
          <div className="res">{result.pairs.map(([g, r]) => <div key={g} className="res-row"><span>{g}</span><span style={{ color: "var(--gold-2)" }}>→ {r}</span></div>)}</div>
          <div className="nav-row"><span /><button className="btn btn-gold" onClick={() => setPeek(false)}>Hide them</button></div>
        </div></div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

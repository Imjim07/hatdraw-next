"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Logo from "@/components/Logo";
import GiftReveal from "@/components/GiftReveal";
import Shekere from "@/components/Shekere";
import SpecularButton from "@/components/SpecularButton";
import ThemeToggle from "@/components/ThemeToggle";
import CurvedMenu, { SITE_MENU } from "@/components/ui/curved-menu";
import DrawKindSwitch from "@/components/DrawKindSwitch";
import Stepper from "@/components/Stepper";
import DatePicker from "@/components/ui/DatePicker";
import { serifName } from "@/lib/marks";
import { burst } from "@/components/Ambient";
import { PRICING, PAYWALL_MODE, mailto, naira, waLink } from "@/lib/config";
import { common } from "@/lib/copy/common";
import { santa as S } from "@/lib/copy/santa";
import type { DrawResponse, EventInfo, Kind, RevealPayload } from "@/lib/types";

type Draft = { ev: EventInfo; people: string[]; ex: [string, string][]; circle: boolean; blind: boolean };
type Result = Extract<DrawResponse, { ok: true }>;

const DRAFT_KEY = "hd-draft-v2";
// Avatar fills from the palette; the person icon (Icons8) inside is ink (≥4.5:1 on each).
// fixed light fills (dark text in both themes)
const AV = ["#DDE3F5", "var(--palm-gold)", "var(--persimmon)"];
const STEPS = S.steps;
// Icons by Icons8 (icons8.com), served from /public/icons (white glass icons, darkened on light surfaces in CSS).
const KINDS: { k: Kind; label: string }[] = (["friends", "family", "company"] as const).map((k) => ({ k, label: S.step1.kinds[k] }));
const blankDraft = (): Draft => ({
  ev: { name: "", kind: "friends", budget: "", date: "", where: "", note: "" },
  people: [], ex: [], circle: true, blind: true,
});


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
  const [payRef, setPayRef] = useState("");
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
    if (step === 0 && !d.ev.name.trim()) { setErr(S.errors.noName); return; }
    if (step === 1 && n < 3) { setErr(S.errors.tooFew); return; }
    go(step + 1);
  };

  const addNames = (raw: string) => {
    const parts = raw.split(/[\n,;]+/).map((s) => s.replace(/^\s*\d+[.)-]\s*/, "").trim().slice(0, 40)).filter(Boolean);
    const people = [...d.people];
    const dups: string[] = [];
    for (const p of parts) { if (people.some((q) => q.toLowerCase() === p.toLowerCase())) dups.push(p); else people.push(p); }
    setD((x) => ({ ...x, people }));
    if (dups.length) say(dups.length === 1 ? S.step2.duplicate(dups[0]) : S.step2.duplicates(dups.length));
  };
  const removeName = (p: string) => setD((x) => ({ ...x, people: x.people.filter((q) => q !== p), ex: x.ex.filter(([a, b]) => a !== p && b !== p) }));

  const addEx = () => {
    const a = exA || d.people[0], b = exB || d.people[1];
    if (!a || !b || a === b) { setErr(S.step3.pickTwo); return; }
    if (d.ex.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) { setErr(S.step3.ruleExists); return; }
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
      if (d.circle && !j.circle) say(S.results.circleFallback);
    } catch {
      await minWait; setStep(2); setErr(S.errors.network);
    } finally { setDrawing(false); }
  }

  const shake = () => { if (paid) setPayOpen(true); else runDraw(); };

  async function pay() {
    if (PAYWALL_MODE !== "live") { setPayOpen(false); runDraw(); return; }
    if (!/^\S+@\S+\.\S+$/.test(payEmail)) { say(S.paywall.badEmail); return; }
    try {
      await loadPaystack();
      new window.PaystackPop!().newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, email: payEmail, amount: PRICING.ONE_TIME * 100, currency: "NGN",
        onSuccess: (t: { reference: string }) => { setPayRef(t.reference); setPayOpen(false); runDraw(t.reference); },
        onCancel: () => say(S.paywall.cancelled),
      });
    } catch { say(S.paywall.paystackFailed); }
  }

  const linkFor = (token: string) => `${window.location.origin}/r#${token}`;
  async function openToken(token: string, context: "preview" | "phone") {
    const r = await fetch("/api/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const j = await r.json();
    if (j.ok) { setView({ data: j.data, context }); window.scrollTo(0, 0); } else say(S.phone.couldntOpen);
  }

  // ---------- full-screen reveal (preview / pass-the-phone) ----------
  if (view) {
    const done = () => { if (view.context === "phone") setSeen((s) => [...s, view.data.g]); setView(null); };
    return <GiftReveal data={view.data} context={view.context}
      actions={<SpecularButton className="btn btn-primary" onClick={done}>{view.context === "phone" ? <><i className="tint-ico hide-ico" aria-hidden="true" />{S.phone.hide}</> : S.phone.backToLinks}</SpecularButton>} />;
  }

  // An ayo board has two rows of six pits; keep at least that, and fill out the last row.
  const emptyPits = Math.max(12, Math.ceil(n / 6) * 6) - n;
  const tier = paid ? S.step2.bigCircle : S.step2.freeLeft(Math.max(0, PRICING.FREE_LIMIT - n));

  return (
    <div className="wrap ob" data-mode="santa">
      <nav className="top"><Logo /><span className="nav-end"><ThemeToggle /><SpecularButton href="/" className="btn btn-ghost btn-sm nav-cta">{common.home}</SpecularButton><CurvedMenu items={SITE_MENU} /></span></nav>
      <main className="app">
        {step === 0 && <DrawKindSwitch current="gift" />}
        <Stepper steps={STEPS} current={step} />

        {step === 0 && (
          <div className="panel rise">
            <h2>{S.step1.heading}</h2>
            <p className="hint">{S.step1.helper}</p>
            <div className="field"><span className="lbl">{S.step1.who}</span>
              <div className="seg" role="radiogroup">
                {KINDS.map((k) => <button key={k.k} role="radio" aria-checked={d.ev.kind === k.k} className={d.ev.kind === k.k ? "on" : ""} onClick={() => setEv({ kind: k.k })}><span className="kind-ico" aria-hidden="true" style={{ "--ico": `url(/icons/${k.k}.png)` } as CSSProperties} />{k.label}</button>)}
              </div></div>
            <div className="field"><label htmlFor="ev-name">{S.step1.name}</label>
              <span className="pit"><input id="ev-name" className="in" maxLength={60} placeholder={S.step1.namePlaceholder} value={d.ev.name} onChange={(e) => setEv({ name: e.target.value })} /></span></div>
            <div className="row">
              <div className="field"><label htmlFor="ev-budget">{S.step1.budget}</label>
                <span className="pit"><input id="ev-budget" className="in" inputMode="numeric" placeholder={S.step1.budgetPlaceholder}
                  value={d.ev.budget ? Number(d.ev.budget).toLocaleString("en-NG") : ""}
                  onChange={(e) => setEv({ budget: e.target.value.replace(/\D/g, "").slice(0, 9) })} /></span></div>
              <DatePicker id="ev-date" label={S.step1.date} value={d.ev.date} onChange={(date) => setEv({ date })} />
            </div>
            <div className="field"><label htmlFor="ev-where">{S.step1.where} <small>{S.step1.optional}</small></label>
              <span className="pit"><input id="ev-where" className="in" maxLength={90} placeholder={S.step1.wherePlaceholder} value={d.ev.where} onChange={(e) => setEv({ where: e.target.value })} /></span></div>
            <div className="field"><label htmlFor="ev-note">{S.step1.note} <small>{S.step1.optional}</small></label>
              <span className="pit ta"><textarea id="ev-note" className="in" maxLength={200} placeholder={S.step1.notePlaceholder} value={d.ev.note} onChange={(e) => setEv({ note: e.target.value })} /></span></div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><span /><SpecularButton className="btn btn-primary" onClick={next}>{S.step1.button} →</SpecularButton></div>
          </div>
        )}

        {step === 1 && (
          <div className="panel rise">
            <div className="names-head">
              <div>
                <h2>{S.step2.heading}</h2>
                <p className="hint">{S.step2.helper}</p>
              </div>
              <Shekere names={d.people} maxLabeled={0} beadsFromNames shakeOnTap={false} />
            </div>
            <div className="field chips-in">
              <span className="pit"><input ref={nameRef} className="in" maxLength={400} placeholder={S.step2.placeholder} autoComplete="off" aria-label={S.step2.inputLabel} value={nameIn}
                onChange={(e) => setNameIn(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (nameIn.trim()) { addNames(nameIn); setNameIn(""); } } }}
                onPaste={(e) => { const t = e.clipboardData.getData("text"); if (/[\n,;]/.test(t)) { e.preventDefault(); addNames(t); } }} /></span>
              <SpecularButton className="btn btn-primary" onClick={() => { if (nameIn.trim()) { addNames(nameIn); setNameIn(""); } nameRef.current?.focus(); }}>{S.step2.add}</SpecularButton>
            </div>
            <ul className="board" aria-label={S.step2.boardLabel}>
              {d.people.map((p) => (
                <li key={p} className="hole filled"><span className="seed" aria-hidden="true" /><span className="nm" title={p}>{p}</span>
                  <button aria-label={S.step2.remove(p)} onClick={() => removeName(p)}>×</button></li>
              ))}
              {Array.from({ length: emptyPits }, (_, i) => <li key={`e${i}`} className="hole empty" aria-hidden="true" />)}
              {!n && <li className="board-empty">{S.step2.empty}</li>}
            </ul>
            <div className="counter"><span>{S.step2.people(n)}</span><span className={paid ? "over" : undefined}>{tier}</span></div>
            <div className="meter"><i className={paid ? "over" : ""} style={{ width: `${Math.min(100, (n / PRICING.FREE_LIMIT) * 100)}%` }} /></div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => go(0)}>{common.back}</SpecularButton><SpecularButton className="btn btn-primary" onClick={next}>{S.step2.button} →</SpecularButton></div>
          </div>
        )}

        {step === 2 && (
          <div className="panel rise">
            <h2>{S.step3.heading}</h2>
            <p className="hint">{S.step3.helper}</p>
            <label className="toggle"><input type="checkbox" checked={d.circle} onChange={(e) => setD((x) => ({ ...x, circle: e.target.checked }))} /><span className="sw" />
              <span><b>{S.step3.circle}</b><span className="d">{S.step3.circleHelp}</span></span></label>
            <label className="toggle"><input type="checkbox" checked={d.blind} onChange={(e) => setD((x) => ({ ...x, blind: e.target.checked }))} /><span className="sw" />
              <span><b>{S.step3.secret}</b><span className="d">{S.step3.secretHelp}</span></span></label>
            <div className="field"><span className="lbl">{S.step3.apart} <small>{S.step3.apartHint}</small></span>
              <div className="ex-row">
                <span className="pit"><select className="in" aria-label={S.step3.first} value={exA || d.people[0]} onChange={(e) => setExA(e.target.value)}>{d.people.map((p) => <option key={p}>{p}</option>)}</select></span>
                <span className="pit"><select className="in" aria-label={S.step3.second} value={exB || d.people[1]} onChange={(e) => setExB(e.target.value)}>{d.people.map((p) => <option key={p}>{p}</option>)}</select></span>
                <SpecularButton className="btn btn-ghost" onClick={addEx}>{S.step3.add}</SpecularButton>
              </div>
              <div className="ex-list">
                {d.ex.map(([a, b], i) => <div key={a + b} className="ex"><span>{a} ✕ {b} <span className="hint" style={{ display: "inline" }}>{S.step3.wontDraw}</span></span>
                  <button onClick={() => setD((x) => ({ ...x, ex: x.ex.filter((_, j) => j !== i) }))}>{S.step3.remove}</button></div>)}
              </div>
            </div>
            <div className="err" role="alert">{err}</div>
            {paid && PAYWALL_MODE === "live" && err && <a className="hint" href={mailto(S.paywall.support, S.paywall.problemSubject(payRef))}>{S.paywall.problem}</a>}
            <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => go(1)}>{common.back}</SpecularButton>
              <SpecularButton className="btn btn-primary" onClick={shake} disabled={drawing}>{drawing ? S.shaking.heading : paid ? S.step3.buttonPaid : S.step3.button}</SpecularButton></div>
          </div>
        )}

        {step === 3 && (
          <div className="panel rise">
            {drawing || !result ? (
              <div className="drum" role="status">
                <Shekere names={d.people} maxLabeled={0} beadsFromNames shakeOnTap={false} shaking={drawing} />
                <div><div className="big">{S.shaking.heading}</div><p className="hint">{S.shaking.helper}</p></div>
              </div>
            ) : (
              <>
                <div className="eyebrow">{S.results.success}</div>
                <h2>{S.results.heading(n)}</h2>
                <div className="summary">
                  {[d.ev.name, d.ev.budget && S.results.budget(d.ev.budget), d.ev.date, d.ev.where && `📍 ${d.ev.where}`].filter(Boolean).map((b) => <span key={String(b)}>{b}</span>)}
                </div>
                {result.demoUnlock && <div className="notice">{S.results.demo}</div>}
                <div className="tabs" role="tablist">
                  <button role="tab" aria-selected={tab === "links"} className={tab === "links" ? "on" : ""} onClick={() => setTab("links")}>{S.results.tabLinks}</button>
                  <button role="tab" aria-selected={tab === "phone"} className={tab === "phone" ? "on" : ""} onClick={() => setTab("phone")}>{S.results.tabPhone}</button>
                </div>

                {tab === "links" ? (
                  <>
                    <p className="hint" style={{ marginTop: 16 }}>{S.results.helper}</p>
                    <div className="res">
                      {result.givers.map(({ name, token }, i) => {
                        const url = linkFor(token);
                        const wa = waLink(S.results.message(name, d.ev.name, url));
                        return (
                          <div key={name} className="res-row">
                            <div className="who"><span className="av" style={{ background: AV[i % AV.length] }}><i className="av-ico" aria-hidden="true" /></span>{name}</div>
                            <div className="acts">
                              <SpecularButton className="btn btn-primary btn-sm" href={wa} target="_blank" rel="noopener noreferrer">{S.results.whatsapp}</SpecularButton>
                              <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(url)) ? common.copied : common.couldntCopy)}>{S.results.copyLink}</SpecularButton>
                              {!d.blind && <SpecularButton className="btn btn-ghost btn-sm" onClick={() => openToken(token, "preview")}>{S.results.preview}</SpecularButton>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="hint">{S.results.weDontKeep}</p>
                    <div className="nav-row" style={{ justifyContent: "flex-start" }}>
                      <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(result.givers.map((g) => `${g.name}: ${linkFor(g.token)}`).join("\n\n"))) ? S.results.allCopied : common.couldntCopy)}>{S.results.copyAll}</SpecularButton>
                      {result.pairs && <SpecularButton className="btn btn-ghost btn-sm" onClick={() => setPeek(true)}>{S.results.showAll}</SpecularButton>}
                      <SpecularButton className="btn btn-ghost btn-sm" onClick={() => { if (!window.confirm(S.results.redrawConfirm)) return; if (paid && PAYWALL_MODE === "live") setPayOpen(true); else runDraw(); }}>{S.results.redraw}</SpecularButton>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="hint" style={{ marginTop: 16 }}>{S.phone.helper}</p>
                    <div className="res">
                      {result.givers.map(({ name, token }, i) => (
                        <div key={name} className={`res-row ${seen.includes(name) ? "seen" : ""}`}>
                          <div className="who"><span className="av" style={{ background: AV[i % AV.length] }}><i className="av-ico" aria-hidden="true" /></span>{name}</div>
                          {seen.includes(name) ? <span className="hint" style={{ margin: 0 }}>{S.phone.unwrapped}</span>
                            : <SpecularButton className="btn btn-primary btn-sm" onClick={() => setConfirmFor(token + "\u0000" + name)}>{S.phone.button}</SpecularButton>}
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
          <div className="eyebrow">{S.phone.heading}</div>
          <h2 style={{ fontSize: "2rem" }}>{S.phone.areYou}<span className={serifName(name).className}>{serifName(name).text}</span>?</h2>
          <p className="sub" style={{ margin: "0 auto" }}>{S.phone.nobodyLooking}</p>
          <div className="nav-row" style={{ justifyContent: "center" }}>
            <SpecularButton className="btn btn-ghost" onClick={() => setConfirmFor(null)}>{S.phone.notMe}</SpecularButton>
            <SpecularButton className="btn btn-primary" onClick={() => { setConfirmFor(null); openToken(token, "phone"); }}>{S.phone.yesMe}</SpecularButton>
          </div>
        </div></div>); })()}

      {payOpen && (
        <div className="modal" role="dialog" aria-modal="true"><div className="panel">
          <div className="eyebrow">{S.paywall.eyebrow}</div>
          <h2 style={{ fontSize: "1.8rem" }}>{S.paywall.heading(n)}</h2>
          <p className="sub">{S.paywall.line}</p>
          <div className="amt" style={{ margin: "18px 0 6px" }}><strong>{naira(PRICING.ONE_TIME)}</strong><small>{S.paywall.oneOff}</small></div>
          {PAYWALL_MODE === "live" ? (
            <div className="field"><label htmlFor="pay-email">{S.paywall.email}</label>
              <span className="pit"><input id="pay-email" className="in" type="email" value={payEmail} onChange={(e) => setPayEmail(e.target.value)} placeholder={S.paywall.emailPlaceholder} /></span><span className="hint">{S.paywall.emailHint}</span></div>
          ) : <p className="hint">{S.paywall.demo}</p>}
          {PAYWALL_MODE === "live" && <a className="hint" href={mailto(S.paywall.support, S.paywall.problemSubject(payRef))}>{S.paywall.problem}</a>}
          <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => setPayOpen(false)}>{S.paywall.notNow}</SpecularButton>
            <SpecularButton className="btn btn-primary" onClick={pay}>{PAYWALL_MODE === "live" ? S.paywall.button : S.paywall.buttonDemo}</SpecularButton></div>
        </div></div>
      )}

      {peek && result?.pairs && (
        <div className="modal" role="dialog" aria-modal="true"><div className="panel">
          <div className="eyebrow">{S.organiser.eyebrow}</div>
          <h2 style={{ fontSize: "1.8rem" }}>{S.organiser.heading}</h2>
          <div className="res">{result.pairs.map(([g, r]) => <div key={g} className="res-row"><span>{g}</span><span style={{ color: "var(--indigo)", fontWeight: 600 }}>→ {r}</span></div>)}</div>
          <div className="nav-row"><span /><SpecularButton className="btn btn-primary" onClick={() => setPeek(false)}>{S.organiser.hide}</SpecularButton></div>
        </div></div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

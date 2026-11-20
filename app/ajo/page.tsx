"use client";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import SpecularButton from "@/components/SpecularButton";
import ThemeToggle from "@/components/ThemeToggle";
import CurvedMenu, { SITE_MENU } from "@/components/ui/curved-menu";
import DrawKindSwitch from "@/components/DrawKindSwitch";
import Stepper from "@/components/Stepper";
import DatePicker from "@/components/ui/DatePicker";
import { waLink } from "@/lib/config";
import { ajo as A } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";
import { api, copyText, longDate } from "@/lib/ajo/client";
import { MAX_AMOUNT, MAX_MEMBERS, MIN_MEMBERS, payoutAmount, payoutDates } from "@/lib/ajo/logic";
import type { CreateGroupRequest, CreateGroupResponse, Frequency } from "@/lib/ajo/types";

type Draft = { name: string; amount: string; frequency: Frequency; startDate: string; members: string[]; pins: { name: string; turn: number }[]; researchConsent: boolean };
type Created = Extract<CreateGroupResponse, { ok: true }>;

const DRAFT_KEY = "hd-ajo-draft-v1";
// Avatar fills from the palette; initials are ink (≥4.5:1 on each).
// fixed light fills (dark text in both themes)
const AV = ["#DDE3F5", "var(--palm-gold)"];
const STEPS = A.steps;
const FREQS: Frequency[] = ["weekly", "biweekly", "monthly"];
const blank = (): Draft => ({ name: "", amount: "", frequency: "monthly", startDate: "", members: [], pins: [], researchConsent: false });
const initials = (s: string) => Array.from(new Intl.Segmenter().segment(s.normalize("NFC")), (x) => x.segment).slice(0, 2).join("").toUpperCase();

export default function AjoSetup() {
  const [d, setD] = useState<Draft>(blank);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [nameIn, setNameIn] = useState("");
  const [pinWho, setPinWho] = useState("");
  const [pinTurn, setPinTurn] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [toast, setToast] = useState("");
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nameRef = useRef<HTMLInputElement>(null);

  // Draft persistence (this browser only). Tokens are never stored.
  useEffect(() => {
    let saved: Draft | null = null;
    try { saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
    setD(saved?.members ? { ...blank(), ...saved, researchConsent: false } : blank());
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded && !created) try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} }, [d, loaded, created]);

  const say = (t: string) => { setToast(t); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(""), 2400); };
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const go = (k: number) => { setErr(""); setStep(k); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const n = d.members.length;
  const amount = Number(d.amount) || 0;

  const next = () => {
    if (step === 0) {
      if (!d.name.trim()) return setErr(A.errors.noName);
      if (amount <= 0 || amount > MAX_AMOUNT) return setErr(A.errors.amountUpTo);
      if (!d.startDate) return setErr(A.errors.noStart);
    }
    if (step === 1 && n < MIN_MEMBERS) return setErr(A.errors.tooFew(MIN_MEMBERS));
    go(step + 1);
  };

  const addNames = (raw: string) => {
    const parts = raw.split(/[\n,;]+/).map((s) => s.replace(/^\s*\d+[.)-]\s*/, "").trim().slice(0, 40)).filter(Boolean);
    const members = [...d.members];
    const dups: string[] = [];
    let full = 0;
    for (const p of parts) {
      if (members.some((q) => q.toLowerCase() === p.toLowerCase())) dups.push(p);
      else if (members.length >= MAX_MEMBERS) full++;
      else members.push(p);
    }
    set({ members });
    if (dups.length) say(dups.length === 1 ? A.setup2.duplicate(dups[0]) : A.setup2.duplicates(dups.length));
    if (full) say(A.setup2.full(MAX_MEMBERS));
  };
  const removeName = (p: string) => setD((x) => ({ ...x, members: x.members.filter((q) => q !== p), pins: x.pins.filter((q) => q.name !== p).filter((q) => q.turn <= x.members.length - 1) }));

  const freeMembers = d.members.filter((m) => !d.pins.some((p) => p.name === m));
  const freeTurns = Array.from({ length: n }, (_, i) => i + 1).filter((t) => !d.pins.some((p) => p.turn === t));
  const addPin = () => {
    const who = pinWho || freeMembers[0], turn = Number(pinTurn || freeTurns[0]);
    if (!who || !turn) return setErr(A.setup3.allPinned);
    setErr(""); set({ pins: [...d.pins, { name: who, turn }].sort((a, b) => a.turn - b.turn) }); setPinWho(""); setPinTurn("");
  };

  async function create() {
    setBusy(true); setErr("");
    const body: CreateGroupRequest = { name: d.name.trim(), amount, frequency: d.frequency, startDate: d.startDate, members: d.members, pins: d.pins, researchConsent: d.researchConsent };
    const r = await api<Omit<Created, "ok">>("/api/ajo/groups", body);
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setCreated(r as Created);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    window.scrollTo({ top: 0 });
  }

  const dates = d.startDate ? payoutDates(d.startDate, d.frequency, Math.max(n, 1)) : [];
  const perTurn = amount ? A.setup1.total(payoutAmount(amount, Math.max(n, 1))) : "";
  const emptyPits = Math.max(12, Math.ceil(n / 6) * 6) - n;

  // ---------- after creating: hand out the links ----------
  if (created) {
    const origin = window.location.origin;
    const pub = `${origin}/ajo/${created.publicId}`;
    const admin = `${pub}/admin#${created.adminToken}`;
    return (
      <div className="wrap ob" data-mode="ajo">
        <nav className="top"><Logo /><span className="nav-end"><ThemeToggle /><SpecularButton href="/" className="btn btn-ghost btn-sm nav-cta">{common.home}</SpecularButton><CurvedMenu items={SITE_MENU} /></span></nav>
        <main className="app">
          <div className="panel rise">
            <div className="eyebrow">{d.name}</div>
            <h2>{A.handoff.heading}</h2>
            <p className="sub">{A.handoff.helper}</p>
            <div className="notice"><b>{A.handoff.shownOnce}</b> {A.handoff.shownOnceMore}</div>

            <div className="field"><span className="lbl">{A.handoff.schedule}</span>
              <div className="res-row"><span className="link-text">{pub}</span>
                <div className="acts"><SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(pub)) ? A.schedule.copied : common.couldntCopy)}>{A.handoff.copyLink}</SpecularButton></div></div></div>

            <div className="field"><span className="lbl">{A.handoff.organiser}</span>
              <div className="notice">{A.handoff.organiserWarn}</div>
              <div className="res-row" style={{ marginTop: 10 }}><span className="link-text">{admin}</span>
                <div className="acts">
                  <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(admin)) ? common.copied : common.couldntCopy)}>{A.handoff.copy}</SpecularButton>
                  {/* A full page load, not an in-app navigation, so analytics loaded here never sees the organiser link. */}
                  <SpecularButton className="btn btn-primary btn-sm" href={admin}>{A.handoff.openOrganiser}</SpecularButton>
                </div></div></div>

            <div className="field"><span className="lbl">{A.handoff.personal}</span>
              <p className="hint" style={{ marginTop: 0 }}>{A.handoff.personalHelp}</p>
              <div className="res">
                {created.members.map(({ name, token }, i) => {
                  const url = `${pub}/me#${token}`;
                  const wa = waLink(A.handoff.message(name, d.name, url));
                  return (
                    <div key={name} className="res-row">
                      <div className="who"><span className="av" style={{ background: AV[i % AV.length] }}>{initials(name)}</span>{name}</div>
                      <div className="acts">
                        <SpecularButton className="btn btn-primary btn-sm" href={wa} target="_blank" rel="noopener noreferrer">{A.handoff.whatsapp}</SpecularButton>
                        <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(url)) ? common.copied : common.couldntCopy)}>{A.handoff.copyLink}</SpecularButton>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="nav-row" style={{ justifyContent: "flex-start" }}>
                <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(created.members.map((m) => `${m.name}: ${pub}/me#${m.token}`).join("\n\n"))) ? A.handoff.allCopied : common.couldntCopy)}>{A.handoff.copyAll}</SpecularButton>
              </div>
            </div>
          </div>
        </main>
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="wrap ob" data-mode="ajo">
      <nav className="top"><Logo /><span className="nav-end"><ThemeToggle /><SpecularButton href="/" className="btn btn-ghost btn-sm nav-cta">{common.home}</SpecularButton><CurvedMenu items={SITE_MENU} /></span></nav>
      <main className="app">
        {step === 0 && <DrawKindSwitch current="ajo" />}
        <Stepper steps={STEPS} current={step} />

        {step === 0 && (
          <div className="panel rise">
            <h2>{A.setup1.heading}</h2>
            <p className="hint">{A.setup1.helper}</p>
            <div className="field"><label htmlFor="aj-name">{A.setup1.name}</label>
              <span className="pit"><input id="aj-name" className="in" maxLength={60} placeholder={A.setup1.namePlaceholder} value={d.name} onChange={(e) => set({ name: e.target.value })} /></span></div>
            <div className="row">
              <div className="field"><label htmlFor="aj-amount">{A.setup1.amount}</label>
                <span className="pit"><input id="aj-amount" className="in" inputMode="numeric" placeholder={A.setup1.amountPlaceholder}
                  value={d.amount ? Number(d.amount).toLocaleString("en-NG") : ""}
                  onChange={(e) => set({ amount: e.target.value.replace(/\D/g, "").slice(0, 8) })} /></span></div>
              <DatePicker id="aj-start" label={A.setup1.start} value={d.startDate} onChange={(startDate) => set({ startDate })} />
            </div>
            <div className="field"><span className="lbl" id="aj-freq">{A.setup1.often}</span>
              <div className="seg" role="radiogroup" aria-labelledby="aj-freq">
                {FREQS.map((f) => <button key={f} role="radio" aria-checked={d.frequency === f} className={d.frequency === f ? "on" : ""} onClick={() => set({ frequency: f })}>{A.freq[f]}</button>)}
              </div></div>
            <p className="hint" aria-live="polite">{perTurn && <><b>{perTurn}</b> · {A.setup1.totalHelper}</>}</p>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><span /><SpecularButton className="btn btn-primary" onClick={next}>{A.setup1.button} →</SpecularButton></div>
          </div>
        )}

        {step === 1 && (
          <div className="panel rise">
            <h2>{A.setup2.heading}</h2>
            <p className="hint">{A.setup2.helper} {A.setup2.namesHint}</p>
            <div className="field chips-in">
              <span className="pit"><input ref={nameRef} className="in" maxLength={400} placeholder={A.setup2.placeholder} autoComplete="off" aria-label={A.setup2.inputLabel} value={nameIn}
                onChange={(e) => setNameIn(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (nameIn.trim()) { addNames(nameIn); setNameIn(""); } } }}
                onPaste={(e) => { const t = e.clipboardData.getData("text"); if (/[\n,;]/.test(t)) { e.preventDefault(); addNames(t); } }} /></span>
              <SpecularButton className="btn btn-primary" onClick={() => { if (nameIn.trim()) { addNames(nameIn); setNameIn(""); } nameRef.current?.focus(); }}>{A.setup2.add}</SpecularButton>
            </div>
            <ul className="board" aria-label={A.setup2.boardLabel}>
              {d.members.map((p) => (
                <li key={p} className="hole filled"><span className="seed" aria-hidden="true" /><span className="nm" title={p}>{p}</span>
                  <button aria-label={A.setup2.remove(p)} onClick={() => removeName(p)}>×</button></li>
              ))}
              {Array.from({ length: emptyPits }, (_, i) => <li key={`e${i}`} className="hole empty" aria-hidden="true" />)}
              {!n && <li className="board-empty">{A.setup2.empty}</li>}
            </ul>
            <div className="counter"><span>{A.setup2.count(n)}</span>{amount > 0 && n > 0 && <span>{A.setup1.total(payoutAmount(amount, n))}</span>}</div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => go(0)}>{common.back}</SpecularButton><SpecularButton className="btn btn-primary" onClick={next}>{A.setup2.button} →</SpecularButton></div>
          </div>
        )}

        {step === 2 && (
          <div className="panel rise">
            <div className="eyebrow">{A.setup3.eyebrow}</div>
            <h2>{A.setup3.heading}</h2>
            <p className="hint">{A.setup3.helper}</p>
            <div className="field"><span className="lbl">{A.setup3.pinLabel}</span>
              <div className="ex-row">
                <span className="pit"><select className="in" aria-label={A.setup3.member} value={pinWho || freeMembers[0] || ""} onChange={(e) => setPinWho(e.target.value)} disabled={!freeMembers.length}>{freeMembers.map((p) => <option key={p}>{p}</option>)}</select></span>
                <span className="pit"><select className="in" aria-label={A.setup3.turn} value={pinTurn || freeTurns[0] || ""} onChange={(e) => setPinTurn(e.target.value)} disabled={!freeTurns.length}>
                  {freeTurns.map((t) => <option key={t} value={t}>{A.setup3.turnOption(t, dates[t - 1] ? longDate(dates[t - 1]) : undefined)}</option>)}</select></span>
                <SpecularButton className="btn btn-ghost" onClick={addPin} disabled={!freeMembers.length || !freeTurns.length}>{A.setup3.pin}</SpecularButton>
              </div>
              <div className="ex-list">
                {d.pins.map((p) => <div key={p.name} className="ex"><span>{A.setup3.pinned(p.name, p.turn)} <span className="hint" style={{ display: "inline" }}>{A.setup3.agreed}</span></span>
                  <button onClick={() => set({ pins: d.pins.filter((q) => q.name !== p.name) })}>{A.setup3.remove}</button></div>)}
              </div>
            </div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => go(1)}>{common.back}</SpecularButton><SpecularButton className="btn btn-primary" onClick={next}>{A.setup3.button} →</SpecularButton></div>
          </div>
        )}

        {step === 3 && (
          <div className="panel rise">
            <h2>{A.setup4.heading}</h2>
            <div className="summary">
              <span>{d.name}</span><span>{A.setup4.each(amount)}</span><span>{A.freq[d.frequency]}</span>
              <span>{A.setup4.members(n)}</span><span>{A.setup4.perTurn(payoutAmount(amount, n))}</span>
              {d.startDate && <span>{A.setup4.range(longDate(dates[0]), longDate(dates[n - 1]))}</span>}
              {d.pins.length > 0 && <span>{A.setup4.pins(d.pins.length)}</span>}
            </div>
            <div className="notice">{A.noMoney}</div>
            <label className="toggle"><input type="checkbox" checked={d.researchConsent} onChange={(e) => set({ researchConsent: e.target.checked })} /><span className="sw" />
              <span><b>{A.setup4.research}</b><span className="d">{A.setup4.researchHelp}</span></span></label>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => go(2)}>{common.back}</SpecularButton>
              <SpecularButton className="btn btn-primary" onClick={create} disabled={busy}>{busy ? A.setup4.creating : A.setup4.button}</SpecularButton></div>
          </div>
        )}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

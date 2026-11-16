"use client";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import SpecularButton from "@/components/SpecularButton";
import ThemeToggle from "@/components/ThemeToggle";
import CurvedMenu, { SITE_MENU } from "@/components/ui/curved-menu";
import DrawKindSwitch from "@/components/DrawKindSwitch";
import Stepper from "@/components/Stepper";
import { NO_MONEY } from "@/components/ajo/GroupView";
import { naira } from "@/lib/config";
import { FREQ_LABEL, api, copyText, longDate } from "@/lib/ajo/client";
import { MAX_AMOUNT, MAX_MEMBERS, MIN_MEMBERS, payoutAmount, payoutDates } from "@/lib/ajo/logic";
import type { CreateGroupRequest, CreateGroupResponse, Frequency } from "@/lib/ajo/types";

type Draft = { name: string; amount: string; frequency: Frequency; startDate: string; members: string[]; pins: { name: string; turn: number }[]; researchConsent: boolean };
type Created = Extract<CreateGroupResponse, { ok: true }>;

const DRAFT_KEY = "hd-ajo-draft-v1";
// Avatar fills from the palette; initials are ink (≥4.5:1 on each).
// fixed light fills (dark text in both themes)
const AV = ["#DDE3F5", "var(--palm-gold)"];
const STEPS = ["Group", "Members", "Turns", "Review"];
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
      if (!d.name.trim()) return setErr("Give your ajo group a name.");
      if (amount <= 0 || amount > MAX_AMOUNT) return setErr("Enter each member's contribution (up to ₦10,000,000).");
      if (!d.startDate) return setErr("Choose the first payout date.");
    }
    if (step === 1 && n < MIN_MEMBERS) return setErr(`An ajo needs at least ${MIN_MEMBERS} members.`);
    go(step + 1);
  };

  const addNames = (raw: string) => {
    const parts = raw.split(/[\n,;]+/).map((s) => s.replace(/^\s*\d+[.)-]\s*/, "").trim().slice(0, 40)).filter(Boolean);
    const members = [...d.members];
    let dup = 0, full = 0;
    for (const p of parts) {
      if (members.some((q) => q.toLowerCase() === p.toLowerCase())) dup++;
      else if (members.length >= MAX_MEMBERS) full++;
      else members.push(p);
    }
    set({ members });
    if (dup) say(`${dup} duplicate name${dup > 1 ? "s" : ""} skipped`);
    if (full) say(`An ajo can have up to ${MAX_MEMBERS} members`);
  };
  const removeName = (p: string) => setD((x) => ({ ...x, members: x.members.filter((q) => q !== p), pins: x.pins.filter((q) => q.name !== p).filter((q) => q.turn <= x.members.length - 1) }));

  const freeMembers = d.members.filter((m) => !d.pins.some((p) => p.name === m));
  const freeTurns = Array.from({ length: n }, (_, i) => i + 1).filter((t) => !d.pins.some((p) => p.turn === t));
  const addPin = () => {
    const who = pinWho || freeMembers[0], turn = Number(pinTurn || freeTurns[0]);
    if (!who || !turn) return setErr("Every member or turn is already pinned.");
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
  const perTurn = amount ? (n ? `With ${n} members, each turn collects ${naira(payoutAmount(amount, n))}.` : `Each turn collects ${naira(amount)} × the number of members.`) : "";
  const emptyPits = Math.max(12, Math.ceil(n / 6) * 6) - n;

  // ---------- after creating: hand out the links ----------
  if (created) {
    const origin = window.location.origin;
    const pub = `${origin}/ajo/${created.publicId}`;
    const admin = `${pub}/admin#${created.adminToken}`;
    return (
      <div className="wrap ob" data-mode="ajo">
        <nav className="top"><Logo /><span className="nav-end"><ThemeToggle /><SpecularButton href="/" className="btn btn-ghost btn-sm nav-cta">← Home</SpecularButton><CurvedMenu items={SITE_MENU} /></span></nav>
        <main className="app">
          <div className="panel rise">
            <div className="eyebrow">Group created</div>
            <h2>{d.name}</h2>
            <p className="sub">Send each member their own link. Then open your admin page to draw the payout order.</p>
            <div className="notice"><b>These links are shown once.</b> Copy them now: HatDraw can&apos;t show them again.</div>

            <div className="field"><span className="lbl">Public schedule (share with everyone)</span>
              <div className="res-row"><span className="link-text">{pub}</span>
                <div className="acts"><SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(pub)) ? "Schedule link copied ✓" : "Couldn't copy")}>Copy link</SpecularButton></div></div></div>

            <div className="field"><span className="lbl">Your admin link</span>
              <div className="notice">Keep this private. Anyone with it can draw your group&apos;s order (and redraw it for 10 minutes after an instant draw).</div>
              <div className="res-row" style={{ marginTop: 10 }}><span className="link-text">{admin}</span>
                <div className="acts">
                  <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(admin)) ? "Admin link copied ✓" : "Couldn't copy")}>Copy</SpecularButton>
                  <SpecularButton className="btn btn-primary btn-sm" href={`/ajo/${created.publicId}/admin#${created.adminToken}`}>Open admin page</SpecularButton>
                </div></div></div>

            <div className="field"><span className="lbl">Each member&apos;s personal link</span>
              <p className="hint" style={{ marginTop: 0 }}>Members use their link to see their turn, get email reminders and agree swaps. Send each person <b>only their own</b>.</p>
              <div className="res">
                {created.members.map(({ name, token }, i) => {
                  const url = `${pub}/me#${token}`;
                  const wa = "https://wa.me/?text=" + encodeURIComponent(`Hi ${name}! You're in the "${d.name}" ajo on HatDraw.\nThis is your personal link to see your turn, get reminders and agree swaps. It's only for you:\n${url}`);
                  return (
                    <div key={name} className="res-row">
                      <div className="who"><span className="av" style={{ background: AV[i % AV.length] }}>{initials(name)}</span>{name}</div>
                      <div className="acts">
                        <SpecularButton className="btn btn-primary btn-sm" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</SpecularButton>
                        <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(url)) ? "Link copied ✓" : "Couldn't copy")}>Copy link</SpecularButton>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="nav-row" style={{ justifyContent: "flex-start" }}>
                <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(created.members.map((m) => `${m.name}: ${pub}/me#${m.token}`).join("\n\n"))) ? "All links copied ✓" : "Couldn't copy")}>Copy all member links</SpecularButton>
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
      <nav className="top"><Logo /><span className="nav-end"><ThemeToggle /><SpecularButton href="/" className="btn btn-ghost btn-sm nav-cta">← Home</SpecularButton><CurvedMenu items={SITE_MENU} /></span></nav>
      <main className="app">
        {step === 0 && <DrawKindSwitch current="ajo" />}
        <Stepper steps={STEPS} current={step} />

        {step === 0 && (
          <div className="panel rise">
            <h2>Set up your ajo</h2>
            <div className="field"><label htmlFor="aj-name">Group name</label>
              <span className="pit"><input id="aj-name" className="in" maxLength={60} placeholder="e.g. Ikoyi Wives Monthly" value={d.name} onChange={(e) => set({ name: e.target.value })} /></span></div>
            <div className="row">
              <div className="field"><label htmlFor="aj-amount">Each member pays (₦ per turn)</label>
                <span className="pit"><input id="aj-amount" className="in" inputMode="numeric" placeholder="e.g. 20,000"
                  value={d.amount ? Number(d.amount).toLocaleString("en-NG") : ""}
                  onChange={(e) => set({ amount: e.target.value.replace(/\D/g, "").slice(0, 8) })} /></span></div>
              <div className="field"><label htmlFor="aj-start">First payout date</label>
                <span className="pit"><input id="aj-start" className="in" type="date" value={d.startDate} onChange={(e) => set({ startDate: e.target.value })} /></span></div>
            </div>
            <div className="field"><span className="lbl" id="aj-freq">How often?</span>
              <div className="seg" role="radiogroup" aria-labelledby="aj-freq">
                {FREQS.map((f) => <button key={f} role="radio" aria-checked={d.frequency === f} className={d.frequency === f ? "on" : ""} onClick={() => set({ frequency: f })}>{FREQ_LABEL[f]}</button>)}
              </div></div>
            <p className="hint" aria-live="polite">{perTurn}</p>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><span /><SpecularButton className="btn btn-primary" onClick={next}>Next: members →</SpecularButton></div>
          </div>
        )}

        {step === 1 && (
          <div className="panel rise">
            <h2>Who&apos;s in the group?</h2>
            <p className="hint">Press Enter after each name, or paste a whole list (one per line or comma-separated). Each name takes one turn.</p>
            <div className="field chips-in">
              <span className="pit"><input ref={nameRef} className="in" maxLength={400} placeholder="Type a name…" autoComplete="off" aria-label="Member name" value={nameIn}
                onChange={(e) => setNameIn(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (nameIn.trim()) { addNames(nameIn); setNameIn(""); } } }}
                onPaste={(e) => { const t = e.clipboardData.getData("text"); if (/[\n,;]/.test(t)) { e.preventDefault(); addNames(t); } }} /></span>
              <SpecularButton className="btn btn-primary" onClick={() => { if (nameIn.trim()) { addNames(nameIn); setNameIn(""); } nameRef.current?.focus(); }}>Add</SpecularButton>
            </div>
            <ul className="board" aria-label="Members">
              {d.members.map((p) => (
                <li key={p} className="hole filled"><span className="seed" aria-hidden="true" /><span className="nm" title={p}>{p}</span>
                  <button aria-label={`Remove ${p}`} onClick={() => removeName(p)}>×</button></li>
              ))}
              {Array.from({ length: emptyPits }, (_, i) => <li key={`e${i}`} className="hole empty" aria-hidden="true" />)}
              {!n && <li className="board-empty">No members yet.</li>}
            </ul>
            <div className="counter"><span>{n} {n === 1 ? "member" : "members"} · {n} turns</span>{amount > 0 && n > 0 && <span>Each turn collects {naira(payoutAmount(amount, n))}</span>}</div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => go(0)}>← Back</SpecularButton><SpecularButton className="btn btn-primary" onClick={next}>Next: pins →</SpecularButton></div>
          </div>
        )}

        {step === 2 && (
          <div className="panel rise">
            <div className="eyebrow">Optional</div>
            <h2>Any turns already agreed?</h2>
            <p className="hint">If the group agreed before the draw that someone takes a particular turn, pin them here. Pinned members keep their turn; everyone else is drawn into the remaining turns. Skip this if nothing was agreed.</p>
            <div className="field"><span className="lbl">Pin a member to a turn</span>
              <div className="ex-row">
                <span className="pit"><select className="in" aria-label="Member" value={pinWho || freeMembers[0] || ""} onChange={(e) => setPinWho(e.target.value)} disabled={!freeMembers.length}>{freeMembers.map((p) => <option key={p}>{p}</option>)}</select></span>
                <span className="pit"><select className="in" aria-label="Turn" value={pinTurn || freeTurns[0] || ""} onChange={(e) => setPinTurn(e.target.value)} disabled={!freeTurns.length}>
                  {freeTurns.map((t) => <option key={t} value={t}>Turn {t}{dates[t - 1] ? ` · ${longDate(dates[t - 1])}` : ""}</option>)}</select></span>
                <SpecularButton className="btn btn-ghost" onClick={addPin} disabled={!freeMembers.length || !freeTurns.length}>Pin</SpecularButton>
              </div>
              <div className="ex-list">
                {d.pins.map((p) => <div key={p.name} className="ex"><span>{p.name} · turn {p.turn} <span className="hint" style={{ display: "inline" }}>agreed before the draw</span></span>
                  <button onClick={() => set({ pins: d.pins.filter((q) => q.name !== p.name) })}>Remove</button></div>)}
              </div>
            </div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => go(1)}>← Back</SpecularButton><SpecularButton className="btn btn-primary" onClick={next}>Next: review →</SpecularButton></div>
          </div>
        )}

        {step === 3 && (
          <div className="panel rise">
            <h2>Check and create</h2>
            <div className="summary">
              <span>{d.name}</span><span>{naira(amount)} each</span><span>{FREQ_LABEL[d.frequency]}</span>
              <span>{n} members</span><span>Each turn collects {naira(payoutAmount(amount, n))}</span>
              {d.startDate && <span>{longDate(dates[0])} to {longDate(dates[n - 1])}</span>}
              {d.pins.length > 0 && <span>{d.pins.length} pinned {d.pins.length === 1 ? "turn" : "turns"}</span>}
            </div>
            <div className="notice">{NO_MONEY}</div>
            <p className="hint">After you create the group you&apos;ll get a public schedule link, a private admin link, and a personal link for each member. You draw the order from the admin page, either straight away or live, with everyone watching.</p>
            <label className="toggle"><input type="checkbox" checked={d.researchConsent} onChange={(e) => set({ researchConsent: e.target.checked })} /><span className="sw" />
              <span><b>Help us learn how ajo groups run</b><span className="d">Allow HatDraw to use this group&apos;s size, amount band and frequency, anonymously. Nothing else is used. Off unless you switch it on.</span></span></label>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => go(2)}>← Back</SpecularButton>
              <SpecularButton className="btn btn-primary" onClick={create} disabled={busy}>{busy ? "Creating…" : "Create group"}</SpecularButton></div>
          </div>
        )}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

"use client";
// One member's private page. Calm and plain, like a money page should be: who you are,
// your payout (the biggest thing here), this turn and your part of it, the next few turns,
// email reminders (one control), and swaps (folded away until asked for).
// Dates that depend on "today" (countdown, this turn, past turns) are worked out after
// the data arrives, from the server's clock in Lagos, never during prerender.
import { use, useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import SpecularButton from "@/components/SpecularButton";
import Select from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle, IconCheck, IconClock, IconError, IconInfo, IconSwap, IconX, type AlertVariant } from "@/components/ui/alert";
import { Loading, Problem, Shell } from "@/components/ajo/Shell";
import { api, clockOffset, fragment, longDate, shortDate } from "@/lib/ajo/client";
import { lagosToday } from "@/lib/ajo/logic";
import { countdown, firstName, lastSwap, maskEmail, payoutIcs, previewRows, thisTurn } from "@/lib/ajo/member-page";
import { ajo as A } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";
import { CONTACT, mailto, naira } from "@/lib/config";
import type { MemberView, PublicGroup } from "@/lib/ajo/types";

type Data = { me: MemberView; group: PublicGroup };
const M = A.member;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Lock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
const Chevron = () => (
  <svg className="mp-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);
const Spinner = () => <span className="mp-spin" aria-hidden="true" />;

export default function MemberPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = use(params);
  const [token, setToken] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [today, setToday] = useState(""); // Lagos date by the server clock; "" until the data arrives
  const [toast, setToast] = useState("");
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2800); };

  // Reminders
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [askOff, setAskOff] = useState(false);

  // Swaps
  const [open, setOpen] = useState(false);
  const [swapWith, setSwapWith] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ variant: AlertVariant; text: string } | null>(null);

  const emailId = useId(), emailErrId = useId(), foldId = useId();

  const take = useCallback((r: Data) => {
    setData(r);
    setToday(lagosToday(new Date(Date.now() + clockOffset(r.group.serverNow))));
  }, []);
  const load = useCallback(async () => {
    const t = fragment();
    setToken(t);
    // Another member's link opened in this tab: start clean.
    setNote(null); setSwapWith(""); setOpen(false); setAskOff(false); setEmail(""); setEmailErr("");
    if (!t) { setErr(M.missing); return; }
    const r = await api<Data>("/api/ajo/members/me", { token: t, publicId });
    if (!r.ok) { setErr(r.error); return; }
    take(r);
  }, [publicId, take]);

  // Read the fragment and fetch on mount, and again if another link is opened in this tab
  // (only the # part changes, so the page itself doesn't reload).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value (the URL fragment)
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, [load]);

  async function saveReminders(on: boolean) {
    const e = email.trim();
    if (on && !EMAIL.test(e)) { setEmailErr(M.badEmail); return; }
    setSaving(true); setEmailErr("");
    const r = await api<Data>("/api/ajo/members/me", { token, publicId, save: on ? { email: e, remind: true } : { email: "", remind: false } });
    setSaving(false); setAskOff(false);
    if (!r.ok) {
      if (r.error === A.errors.badEmail) setEmailErr(M.badEmail);
      else say(r.error === common.networkError ? M.saveFailed : r.error);
      return;
    }
    take(r);
    if (!on) setEmail("");
    say(on ? M.saved : M.off);
  }

  async function swap(action: "request" | "confirm" | "decline" | "cancel", extra: { with?: string; swapId?: string }) {
    setBusy(true); setNote(null);
    const r = await api<Data>("/api/ajo/swaps", { token, publicId, action, ...extra });
    setBusy(false);
    if (!r.ok) return setNote({ variant: "error", text: r.error });
    take(r);
    if (action === "request") { setSwapWith(""); setOpen(false); }
    setNote(action === "request" ? { variant: "success", text: M.sent(extra.with ?? "") }
      : action === "confirm" ? { variant: "success", text: r.me.date ? M.confirmed(longDate(r.me.date)) : M.confirmedShort }
      : action === "cancel" ? { variant: "default", text: M.cancelled }
      : { variant: "default", text: M.declined });
  }

  if (err && !data) return <Problem title={common.hmm} text={err} />;
  if (!data) return <Loading label={M.loading} />;
  const { me, group: g } = data;
  const turns = g.turns ?? [];
  const drawn = me.turn != null && turns.length > 0;
  const when = drawn && today ? countdown(today, me.date!) : null;
  const myPast = when?.kind === "past";
  const swapped = lastSwap(g.swaps, me.name);
  const next = drawn && today ? thisTurn(turns, me.name, today) : null;
  const rows = drawn && today && !next?.finished ? previewRows(turns, me.name, today) : [];
  // Who I could swap with: not pinned (the server's list) and their turn hasn't passed.
  const options = turns
    .filter((t) => me.others.includes(t.name) && !!today && t.date >= today)
    .map((t) => ({ id: t.name, label: M.swapOption(t.name, t.turn, t.date) }));
  const target = turns.find((t) => t.name === swapWith);
  const pending = me.swapsIn.length + me.swapsOut.length > 0;

  function addToCalendar() {
    const ics = payoutIcs({
      uid: `${g.publicId}-turn-${me.turn}-me@ajo`, date: me.date!,
      summary: M.icsSummary(g.name, me.amount!), description: M.icsDescription(g.name), stamp: new Date().toISOString(),
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "my-ajo-turn.ics" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Shell toast={toast}>
      <div className="mp rise">
        <header className="mp-head">
          <div className="eyebrow">{M.eyebrow(g.name)}</div>
          <h1>{M.hi(firstName(me.name))}</h1>
          <p className="mp-trust"><Lock />{A.noMoney}</p>
        </header>

        {!drawn ? (
          <section className="mp-card">
            <h2 className="mp-label">{M.notDrawn}</h2>
            <p className="mp-body">{M.notDrawnHelp}</p>
          </section>
        ) : (
          <>
            {/* Your payout: the hero of the page */}
            <section className={`mp-card mp-payout${when?.kind === "today" ? " is-today" : ""}${myPast ? " is-past" : ""}`} aria-labelledby="mp-payout">
              <div className="mp-row">
                <h2 id="mp-payout" className="mp-label">{M.yourPayout}</h2>
                <span className="mp-sec">{M.turnOf(me.turn!, turns.length)}</span>
              </div>
              <p className="mp-amount">{naira(me.amount!)}</p>
              <p className="mp-when">
                {when?.kind === "today" ? <b>{M.todayIsYours}</b>
                  : myPast ? M.wasOn(longDate(me.date!))
                  : <>{longDate(me.date!)}{when && <> · {M.countdown(when)}</>}</>}
              </p>
              {(me.pinned || swapped) && (
                <p className="mp-tags">
                  {me.pinned && <span className="mp-tag">{M.agreed}</span>}
                  {swapped && <span className="mp-tag">{M.swappedWith(swapped.with, swapped.at)}</span>}
                </p>
              )}
              {!myPast && <SpecularButton className="btn btn-ghost mp-btn" onClick={addToCalendar}>{M.addToCalendar}</SpecularButton>}
            </section>

            {/* This turn */}
            {next && (
              <section className="mp-card" aria-labelledby="mp-this">
                <h2 id="mp-this" className="mp-label">{M.thisTurn}</h2>
                {next.finished ? <p className="mp-body">{M.finished}</p>
                  : next.mineNext ? <p className="mp-body">{M.youNext(g.amount)}</p>
                  : <>
                      <p className="mp-strong">{M.collectsOn(next.turn!.name, next.turn!.date)}</p>
                      <p className="mp-body mp-num">{M.yourContribution(g.amount)}</p>
                    </>}
                <Link className="mp-link" href={`/ajo/${g.publicId}`}>{M.fullSchedule} <span aria-hidden="true">→</span></Link>
              </section>
            )}

            {/* Schedule preview */}
            {rows.length > 0 && (
              <section className="mp-card" aria-labelledby="mp-up">
                <h2 id="mp-up" className="mp-label">{M.upcoming}</h2>
                <ol className="mp-list">
                  {rows.map((t) => {
                    const mine = t.name === me.name;
                    return (
                      <li key={t.turn} className={mine ? "is-me" : undefined} aria-current={mine ? "true" : undefined}>
                        <span className="mp-n">{t.turn}</span>
                        <span className="mp-name">{t.name}{mine && <span className="mp-you">{M.you}</span>}</span>
                        <span className="mp-date">{shortDate(t.date)}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
          </>
        )}

        {/* Reminders: one control, two states */}
        <section className="mp-card" aria-labelledby="mp-rem">
          <h2 id="mp-rem" className="mp-label">{M.reminders}</h2>
          {me.remind && me.email ? (
            <>
              <p className="mp-strong">{M.onFor(maskEmail(me.email))}</p>
              <p className="mp-body">{M.onHelp}</p>
              {askOff ? (
                <Alert variant="warning" layout="complex" icon={<IconInfo />} className="alert-in mp-gap"
                  action={<>
                    <SpecularButton className="btn btn-ghost btn-sm" onClick={() => setAskOff(false)} disabled={saving}>{M.keepOn}</SpecularButton>
                    <SpecularButton className="btn btn-primary btn-sm" onClick={() => saveReminders(false)} disabled={saving}>{saving && <Spinner />}{M.confirmOffYes}</SpecularButton>
                  </>}>
                  <AlertTitle>{M.confirmOff}</AlertTitle>
                </Alert>
              ) : (
                <SpecularButton className="btn btn-ghost mp-btn" onClick={() => setAskOff(true)}>{M.turnOff}</SpecularButton>
              )}
            </>
          ) : (
            <form className="mp-form" noValidate onSubmit={(e) => { e.preventDefault(); saveReminders(true); }}>
              <p className="mp-body">{M.remindersHelp}</p>
              <label htmlFor={emailId} className="lbl">{M.email}</label>
              <input id={emailId} className="mp-in" type="email" inputMode="email" autoComplete="email" placeholder={M.emailPlaceholder}
                value={email} onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }}
                onBlur={() => { const e = email.trim(); if (e && !EMAIL.test(e)) setEmailErr(M.badEmail); }}
                aria-invalid={emailErr ? true : undefined} aria-describedby={emailErr ? emailErrId : undefined} />
              {emailErr && <p id={emailErrId} className="mp-err">{emailErr}</p>}
              <SpecularButton type="submit" className="btn btn-primary mp-btn" disabled={saving || !EMAIL.test(email.trim())}>{saving && <Spinner />}{saving ? M.saving : M.turnOn}</SpecularButton>
            </form>
          )}
        </section>

        {/* Swaps: pending requests always show; the rest folds away. Hidden once my turn has passed. */}
        {drawn && today && !myPast && (
          <section className="mp-card" aria-labelledby="mp-swap">
            <h2 id="mp-swap" className="mp-label">{M.swapHeading}</h2>
            {(pending || note) && (
              <div className="swap-list mp-gap">
                {me.swapsIn.map((s) => {
                  const t = turns.find((x) => x.name === s.from);
                  return (
                    <Alert key={s.id} variant="info" layout="complex" icon={<IconSwap />}
                      action={<>
                        <SpecularButton className="btn btn-ghost btn-sm" onClick={() => swap("decline", { swapId: s.id })} disabled={busy}>{M.decline}</SpecularButton>
                        <SpecularButton className="btn btn-primary btn-sm" onClick={() => swap("confirm", { swapId: s.id })} disabled={busy}>{M.accept}</SpecularButton>
                      </>}>
                      <AlertTitle>{t ? M.incoming(s.from, t.turn, t.date, me.turn!, me.date!) : M.incomingShort(s.from)}</AlertTitle>
                    </Alert>
                  );
                })}
                {me.swapsOut.map((s) => (
                  <Alert key={s.id} layout="complex" icon={<IconClock />}
                    action={<SpecularButton className="btn btn-ghost btn-sm" onClick={() => swap("cancel", { swapId: s.id })} disabled={busy}>{M.cancelRequest}</SpecularButton>}>
                    <AlertTitle>{M.waiting(s.to)}</AlertTitle>
                    <AlertDescription>{M.waitingHelp(shortDate(s.requestedAt.slice(0, 10)))}</AlertDescription>
                  </Alert>
                ))}
                {note && (
                  <Alert key={note.text} variant={note.variant} icon={note.variant === "error" ? <IconError /> : note.variant === "success" ? <IconCheck /> : <IconInfo />} className="alert-in"
                    action={<button type="button" className="alert-x" aria-label={M.dismiss} onClick={() => setNote(null)}><IconX /></button>}>
                    {note.text}
                  </Alert>
                )}
              </div>
            )}
            {me.pinned ? <p className="mp-body">{M.swapPinned}</p> : options.length > 0 && (
              <>
                <button type="button" className="mp-expander" aria-expanded={open} aria-controls={foldId} onClick={() => setOpen((o) => !o)}>
                  <span>{M.swapOpen}</span><Chevron />
                </button>
                <div id={foldId} role="region" aria-label={M.swapOpen} hidden={!open} className="mp-fold">
                  <p className="mp-body">{M.swapHelp}</p>
                  <div className="mp-field">
                    <Select aria-label={M.swapWith} label={M.swapWith} placeholder={M.choose} value={swapWith} onChange={setSwapWith} options={options} />
                  </div>
                  {target && <p className="mp-body">{M.swapPreview(target.name, target.date, me.date!)}</p>}
                  <SpecularButton className="btn btn-primary mp-btn" onClick={() => swap("request", { with: swapWith })} disabled={busy || !target}>{busy && <Spinner />}{M.sendRequest}</SpecularButton>
                </div>
              </>
            )}
          </section>
        )}

        <footer className="mp-foot">{M.questions} <a href={mailto(CONTACT.support)}>{CONTACT.support}</a></footer>
      </div>
    </Shell>
  );
}

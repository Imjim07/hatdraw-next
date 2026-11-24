"use client";
import { use, useCallback, useEffect, useState } from "react";
import SpecularButton from "@/components/SpecularButton";
import Select from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle, IconCheck, IconClock, IconError, IconInfo, IconSwap, IconX, type AlertVariant } from "@/components/ui/alert";
import { ScheduleDownloads, GroupHead, NO_MONEY } from "@/components/ajo/GroupView";
import { Loading, Problem, Shell } from "@/components/ajo/Shell";
import { api, fragment, longDate, shortDate } from "@/lib/ajo/client";
import { ajo as A } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";
import type { MemberView, PublicGroup } from "@/lib/ajo/types";

type Data = { me: MemberView; group: PublicGroup };

export default function MemberPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = use(params);
  const [token, setToken] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [remind, setRemind] = useState(false);
  const [swapWith, setSwapWith] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  // Swaps answer in the swap section itself: the question before a request is sent,
  // then what happened (sent, done, declined, or what went wrong).
  const [asking, setAsking] = useState("");
  const [note, setNote] = useState<{ variant: AlertVariant; text: string } | null>(null);
  // The question replaces the "Ask to swap" button, so keyboard focus moves to "Send request".
  useEffect(() => { if (asking) document.querySelector<HTMLElement>("#swap-confirm .btn-primary")?.focus(); }, [asking]);
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2400); };

  const take = useCallback((r: Data) => { setData(r); setEmail(r.me.email ?? ""); setRemind(r.me.remind); }, []);
  const load = useCallback(async () => {
    const t = fragment();
    setToken(t);
    setAsking(""); setNote(null); setSwapWith(""); // another member's link: start clean
    if (!t) { setErr(A.member.missing); return; }
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

  async function save() {
    setBusy(true); setErr("");
    const r = await api<Data>("/api/ajo/members/me", { token, publicId, save: { email: email.trim(), remind } });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    take(r);
    say(r.me.remind ? A.member.saved : A.member.off);
  }

  async function swap(action: "request" | "confirm" | "decline", extra: { with?: string; swapId?: string }) {
    setBusy(true); setErr(""); setNote(null); setAsking("");
    const r = await api<Data>("/api/ajo/swaps", { token, publicId, action, ...extra });
    setBusy(false);
    if (!r.ok) return setNote({ variant: "error", text: r.error });
    take(r);
    setNote(action === "request" ? { variant: "success", text: A.member.sent(extra.with ?? "") }
      : action === "confirm" ? { variant: "success", text: r.me.date ? A.member.confirmed(shortDate(r.me.date)) : A.member.confirmedShort }
      : { variant: "default", text: A.member.declined });
  }

  if (err && !data) return <Problem title={common.hmm} text={err} />;
  if (!data) return <Loading label={A.member.loading} />;
  const { me, group: g } = data;
  const drawn = me.turn != null;
  const choices = me.others;
  const target = swapWith || choices[0] || "";

  return (
    <Shell toast={toast}>
      <div className="panel rise">
        <GroupHead g={g} eyebrow={A.member.eyebrow(me.name)} />

        <div className="details ob">
          <div className="wide">
            <b style={{ display: "block" }}>{drawn ? A.member.yourTurn(me.turn!, me.date!, me.amount!) : A.member.notDrawn}</b>
            {drawn && <span className="hint" style={{ display: "block", marginTop: 4 }}>{longDate(me.date!)}{me.pinned ? ` · ${A.member.agreed}` : ""}</span>}
            {!drawn && <span className="hint" style={{ display: "block", marginTop: 4 }}>{A.member.notDrawnHelp}</span>}
          </div>
        </div>

        <div className="field"><span className="lbl">{A.member.reminders}</span>
          <p className="hint" style={{ marginTop: 0 }}>{A.member.remindersHelp}</p>
          <div className="field" style={{ marginTop: 10 }}><label htmlFor="me-email">{A.member.email}</label>
            <span className="pit"><input id="me-email" className="in" type="email" autoComplete="email" placeholder={A.member.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} /></span></div>
          <label className="toggle"><input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} /><span className="sw" />
            <span><b>{A.member.remindMe}</b><span className="d">{A.member.remindMeHelp}</span></span></label>
          <div className="nav-row" style={{ marginTop: 14 }}><span /><SpecularButton className="btn btn-primary btn-sm" onClick={save} disabled={busy}>{A.member.save}</SpecularButton></div>
        </div>

        {drawn && (
          <div className="field"><span className="lbl">{A.member.swapHeading}</span>
            <p className="hint" style={{ marginTop: 0 }}>{A.member.swapHelp}{me.pinned ? A.member.swapPinned : ""}</p>
            <div className="swap-list">
              {me.swapsIn.map((s) => {
                const t = g.turns?.find((x) => x.name === s.from);
                return (
                  <Alert key={s.id} variant="info" layout="complex" icon={<IconSwap />} className="alert-in"
                    action={<>
                      <SpecularButton className="btn btn-ghost btn-sm" onClick={() => swap("decline", { swapId: s.id })} disabled={busy}>{A.member.decline}</SpecularButton>
                      <SpecularButton className="btn btn-primary btn-sm" onClick={() => swap("confirm", { swapId: s.id })} disabled={busy}>{A.member.accept}</SpecularButton>
                    </>}>
                    <AlertTitle>{A.member.incomingShort(s.from)}</AlertTitle>
                    {t && <AlertDescription>{A.member.incoming(t.turn, t.date, me.turn!, me.date!)}</AlertDescription>}
                  </Alert>
                );
              })}
              {me.swapsOut.map((s) => (
                <Alert key={s.id} layout="complex" icon={<IconClock />}>
                  <AlertTitle>{A.member.waiting(s.to)}</AlertTitle>
                  <AlertDescription>{A.member.waitingHelp(shortDate(s.requestedAt.slice(0, 10)))}</AlertDescription>
                </Alert>
              ))}
              {asking && (
                <Alert id="swap-confirm" variant="warning" layout="complex" icon={<IconInfo />} className="alert-in"
                  action={<>
                    <SpecularButton className="btn btn-ghost btn-sm" onClick={() => setAsking("")} disabled={busy}>{A.member.cancel}</SpecularButton>
                    <SpecularButton className="btn btn-primary btn-sm" onClick={() => swap("request", { with: asking })} disabled={busy}>{A.member.sendRequest}</SpecularButton>
                  </>}>
                  <AlertTitle>{A.member.confirmSwap(asking)}</AlertTitle>
                  <AlertDescription>{A.member.confirmSwapHelp(asking, g.turns?.find((x) => x.name === asking)?.date)}</AlertDescription>
                </Alert>
              )}
              {note && (
                <Alert key={note.text} variant={note.variant} icon={note.variant === "error" ? <IconError /> : note.variant === "success" ? <IconCheck /> : <IconInfo />} className="alert-in"
                  action={<button type="button" className="alert-x" aria-label={A.member.dismiss} onClick={() => setNote(null)}><IconX /></button>}>
                  {note.text}
                </Alert>
              )}
            </div>
            {!me.pinned && choices.length > 0 && !asking && (
              <div className="swap-ask">
                <Select aria-label={A.member.swapWith} value={target} onChange={setSwapWith} options={choices.map((c) => ({ id: c, label: c }))} />
                <SpecularButton className="btn btn-ghost" onClick={() => { setNote(null); setAsking(target); }} disabled={busy || !target}>{A.member.askToSwap}</SpecularButton>
              </div>
            )}
          </div>
        )}

        <div className="err" role="alert">{err}</div>
        <div className="nav-row sched-acts" role="group" aria-label={A.schedule.actions}>
          {drawn && <ScheduleDownloads publicId={g.publicId} />}
          <SpecularButton className="btn btn-ghost btn-sm" href={`/ajo/${g.publicId}`}>{A.member.fullSchedule}</SpecularButton>
        </div>
        <div className="notice">{NO_MONEY}</div>
      </div>
    </Shell>
  );
}

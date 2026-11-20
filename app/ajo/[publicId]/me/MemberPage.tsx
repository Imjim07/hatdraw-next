"use client";
import { use, useCallback, useEffect, useState } from "react";
import SpecularButton from "@/components/SpecularButton";
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
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2400); };

  const take = useCallback((r: Data) => { setData(r); setEmail(r.me.email ?? ""); setRemind(r.me.remind); }, []);
  const load = useCallback(async () => {
    const t = fragment();
    setToken(t);
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
    if (action === "request" && !window.confirm(A.member.confirmSwap(extra.with ?? ""))) return;
    setBusy(true); setErr("");
    const r = await api<Data>("/api/ajo/swaps", { token, publicId, action, ...extra });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    take(r);
    say(action === "request" ? A.member.sent(extra.with ?? "") : action === "confirm" ? (r.me.date ? A.member.confirmed(shortDate(r.me.date)) : A.member.confirmedShort) : A.member.declined);
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
            <div className="res">
              {me.swapsIn.map((s) => (
                <div key={s.id} className="res-row">
                  <span>{(() => { const t = g.turns?.find((x) => x.name === s.from); return t && drawn ? A.member.incoming(s.from, t.turn, t.date, me.turn!, me.date!) : A.member.incomingShort(s.from); })()}</span>
                  <div className="acts">
                    <SpecularButton className="btn btn-ghost btn-sm" onClick={() => swap("decline", { swapId: s.id })} disabled={busy}>{A.member.decline}</SpecularButton>
                    <SpecularButton className="btn btn-primary btn-sm" onClick={() => swap("confirm", { swapId: s.id })} disabled={busy}>{A.member.accept}</SpecularButton>
                  </div>
                </div>
              ))}
              {me.swapsOut.map((s) => (
                <div key={s.id} className="res-row"><span>{A.member.waiting(s.to)} <span className="hint" style={{ display: "block", marginTop: 2 }}>{A.member.waitingHelp(shortDate(s.requestedAt.slice(0, 10)))}</span></span></div>
              ))}
            </div>
            {!me.pinned && choices.length > 0 && (
              <div className="ex-row" style={{ marginTop: 12, gridTemplateColumns: "1fr auto" }}>
                <span className="pit"><select className="in" aria-label={A.member.swapWith} value={target} onChange={(e) => setSwapWith(e.target.value)}>{choices.map((c) => <option key={c}>{c}</option>)}</select></span>
                <SpecularButton className="btn btn-ghost" onClick={() => swap("request", { with: target })} disabled={busy || !target}>{A.member.askToSwap}</SpecularButton>
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

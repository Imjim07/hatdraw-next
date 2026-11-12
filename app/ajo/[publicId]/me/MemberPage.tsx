"use client";
import { use, useCallback, useEffect, useState } from "react";
import SpecularButton from "@/components/SpecularButton";
import { CalendarButton, GroupHead, NO_MONEY } from "@/components/ajo/GroupView";
import { Loading, Problem, Shell } from "@/components/ajo/Shell";
import { naira } from "@/lib/config";
import { api, fragment, longDate, shortDate } from "@/lib/ajo/client";
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
    if (!t) { setErr("This personal link is missing its private part (after the #). Ask your organizer to resend it."); return; }
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
    say(r.me.remind ? "Reminders on ✓" : "Saved ✓");
  }

  async function swap(action: "request" | "confirm" | "decline", extra: object) {
    setBusy(true); setErr("");
    const r = await api<Data>("/api/ajo/swaps", { token, publicId, action, ...extra });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    take(r);
    say(action === "request" ? "Swap request sent" : action === "confirm" ? "Swap confirmed ✓" : "Swap declined");
  }

  if (err && !data) return <Problem title="Hmm" text={err} />;
  if (!data) return <Loading label="Opening your turn" />;
  const { me, group: g } = data;
  const drawn = me.turn != null;
  const choices = me.others;
  const target = swapWith || choices[0] || "";

  return (
    <Shell toast={toast}>
      <div className="panel rise">
        <GroupHead g={g} eyebrow={`Ajo · ${me.name}`} />

        <div className="details">
          <div className="wide">
            <small>Your turn</small>
            {drawn && <span className="mode-pill">Turn {me.turn}: you</span>}
            <b style={{ display: "block" }}>{drawn ? `${shortDate(me.date!)} · ${naira(me.amount!)}` : "Not drawn yet"}</b>
            {drawn && <span className="hint" style={{ display: "block", marginTop: 4 }}>{longDate(me.date!)}{me.pinned ? " · agreed before the draw" : ""}</span>}
            {!drawn && <span className="hint" style={{ display: "block", marginTop: 4 }}>Your organizer hasn&apos;t drawn the payout order yet. Check back after the draw.</span>}
          </div>
        </div>

        <div className="field"><span className="lbl">Email reminders</span>
          <p className="hint" style={{ marginTop: 0 }}>One email 3 days before each payout date. Only you and HatDraw see your address.</p>
          <div className="field" style={{ marginTop: 10 }}><label htmlFor="me-email">Your email</label>
            <span className="pit"><input id="me-email" className="in" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></span></div>
          <label className="toggle"><input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} /><span className="sw" />
            <span><b>Remind me</b><span className="d">Email me 3 days before each payout date. You can switch this off any time.</span></span></label>
          <div className="nav-row" style={{ marginTop: 14 }}><span /><SpecularButton className="btn btn-primary btn-sm" onClick={save} disabled={busy}>Save</SpecularButton></div>
        </div>

        {drawn && (
          <div className="field"><span className="lbl">Swap turns</span>
            <p className="hint" style={{ marginTop: 0 }}>A swap only happens if you <b>both</b> confirm from your own links. Every swap is shown on the schedule.{me.pinned ? " Your turn was agreed before the draw, so it can't be swapped." : ""}</p>
            <div className="res">
              {me.swapsIn.map((s) => (
                <div key={s.id} className="res-row">
                  <span>{s.from} wants to swap turns with you</span>
                  <div className="acts">
                    <SpecularButton className="btn btn-ghost btn-sm" onClick={() => swap("decline", { swapId: s.id })} disabled={busy}>Decline</SpecularButton>
                    <SpecularButton className="btn btn-primary btn-sm" onClick={() => swap("confirm", { swapId: s.id })} disabled={busy}>Confirm swap</SpecularButton>
                  </div>
                </div>
              ))}
              {me.swapsOut.map((s) => (
                <div key={s.id} className="res-row"><span>Waiting for {s.to} to confirm your swap request <span className="hint" style={{ display: "block", marginTop: 2 }}>Asked {shortDate(s.requestedAt.slice(0, 10))}. Requests expire after 72 hours.</span></span></div>
              ))}
            </div>
            {!me.pinned && choices.length > 0 && (
              <div className="ex-row" style={{ marginTop: 12, gridTemplateColumns: "1fr auto" }}>
                <span className="pit"><select className="in" aria-label="Swap with" value={target} onChange={(e) => setSwapWith(e.target.value)}>{choices.map((c) => <option key={c}>{c}</option>)}</select></span>
                <SpecularButton className="btn btn-ghost" onClick={() => swap("request", { with: target })} disabled={busy || !target}>Ask to swap</SpecularButton>
              </div>
            )}
          </div>
        )}

        <div className="err" role="alert">{err}</div>
        <div className="nav-row" style={{ justifyContent: "flex-start" }}>
          {drawn && <CalendarButton publicId={g.publicId} />}
          <SpecularButton className="btn btn-ghost btn-sm" href={`/ajo/${g.publicId}`}>See the full schedule</SpecularButton>
        </div>
        <div className="notice">{NO_MONEY}</div>
      </div>
    </Shell>
  );
}

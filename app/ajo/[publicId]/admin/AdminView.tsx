"use client";
import { use, useCallback, useEffect, useState } from "react";
import SpecularButton from "@/components/SpecularButton";
import { ScheduleDownloads, GroupHead, NO_MONEY, OrderView } from "@/components/ajo/GroupView";
import { Loading, Problem, Shell } from "@/components/ajo/Shell";
import { api, clockOffset, copyText, fragment } from "@/lib/ajo/client";
import { ajo as A } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";
import type { PublicGroup } from "@/lib/ajo/types";

type AdminData = { group: PublicGroup; canDraw: boolean; redrawUntil: string | null };
const LIVE_SECONDS = 30;

export default function AdminView({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = use(params);
  const [token, setToken] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [offset, setOffset] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sowFrom, setSowFrom] = useState<number | null>(null);
  const [confirmRedraw, setConfirmRedraw] = useState(false);
  const [left, setLeft] = useState(0); // ms left in the redraw window
  const [toast, setToast] = useState("");
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2400); };
  const base = `/api/ajo/groups/${encodeURIComponent(publicId)}`;

  const take = useCallback((r: AdminData & { group: PublicGroup }) => { setOffset(clockOffset(r.group.serverNow)); setData(r); }, []);
  const refresh = useCallback(async () => {
    const t = fragment();
    setToken(t);
    if (!t) { setErr(A.admin.missing); return; }
    const r = await api<AdminData>(`${base}/admin`, { token: t });
    if (!r.ok) { setErr(r.error); return; }
    take(r);
  }, [base, take]);

  // Read the fragment and fetch on mount, and again if another link is opened in this tab
  // (only the # part changes, so the page itself doesn't reload).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value (the URL fragment)
    refresh();
    window.addEventListener("hashchange", refresh);
    return () => window.removeEventListener("hashchange", refresh);
  }, [refresh]);

  // Count down the 10-minute redraw window (server-synced).
  const until = data?.redrawUntil ? Date.parse(data.redrawUntil) - offset : null;
  useEffect(() => {
    if (!until) return;
    const tick = () => { const ms = until - Date.now(); setLeft(ms); if (ms <= 0) refresh(); };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [until, refresh]);

  async function draw(mode: "instant" | "live") {
    setBusy(true); setErr("");
    const r = await api<{ group: PublicGroup }>(`${base}/draw`, { token, mode, startInSeconds: LIVE_SECONDS });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    if (mode === "instant") setSowFrom(Date.now());
    await refresh();
  }

  async function redraw() {
    setConfirmRedraw(false); setBusy(true); setErr("");
    const r = await api<{ group: PublicGroup }>(`${base}/redraw`, { token });
    setBusy(false);
    if (!r.ok) { setErr(r.error); await refresh(); return; }
    setSowFrom(Date.now());
    await refresh();
  }

  if (err && !data) return <Problem title={common.hmm} text={err} />;
  if (!data) return <Loading label={A.admin.loading} />;
  const g = data.group;
  const pub = typeof window === "undefined" ? "" : `${window.location.origin}/ajo/${g.publicId}`;
  const mins = Math.max(0, Math.floor(left / 60000)), secs = Math.max(0, Math.floor((left % 60000) / 1000));

  return (
    <Shell toast={toast}>
      <div className="panel rise">
        <GroupHead g={g} eyebrow={A.admin.eyebrow} />

        {data.canDraw ? (
          <>
            <h3 style={{ marginTop: 18 }}>{A.admin.choice}</h3>
            <p className="hint">{A.admin.choiceHelp}</p>
            <div className="draw-choice">
              <div className="toggle" style={{ cursor: "default" }}>
                <span><b>{A.admin.now}</b><span className="d">{A.admin.nowHelp}</span></span>
              </div>
              <div className="toggle" style={{ cursor: "default" }}>
                <span><b>{A.admin.live}</b><span className="d">{A.admin.liveHelp}</span></span>
              </div>
            </div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row">
              <SpecularButton className="btn btn-ghost" onClick={() => draw("live")} disabled={busy}>{A.admin.live}</SpecularButton>
              <SpecularButton className="btn btn-primary" onClick={() => draw("instant")} disabled={busy}>{busy ? A.admin.drawing : A.admin.now}</SpecularButton>
            </div>
          </>
        ) : (
          <>
            <OrderView g={g} offset={offset} refresh={refresh} sowFrom={sowFrom}
              action={(t) => (
                <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(A.announcement(t, pub))) ? A.admin.announced : common.couldntCopy)}>
                  {A.admin.announce}
                </SpecularButton>
              )} />
            <div className="err" role="alert">{err}</div>
            {g.turns && (
              <div className="nav-row sched-acts" role="group" aria-label={A.schedule.actions}>
                {data.redrawUntil && left > 0 && (
                  <SpecularButton className="btn btn-ghost btn-sm" onClick={() => setConfirmRedraw(true)} disabled={busy}>
                    {A.admin.redraw(mins, secs)}
                  </SpecularButton>
                )}
                <ScheduleDownloads publicId={g.publicId} />
                <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(pub)) ? A.admin.scheduleCopied : common.couldntCopy)}>{A.admin.shareSchedule}</SpecularButton>
                <SpecularButton className="btn btn-ghost btn-sm" href={`/ajo/${g.publicId}`}>{A.admin.openSchedule}</SpecularButton>
              </div>
            )}
            {g.turns && !data.redrawUntil && g.draw?.mode === "instant" && <p className="hint">{A.admin.final}</p>}
          </>
        )}
        <div className="notice">{NO_MONEY}</div>
      </div>

      {confirmRedraw && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="redraw-title"><div className="panel">
          <div className="eyebrow">{A.admin.redrawEyebrow}</div>
          <h2 id="redraw-title" style={{ fontSize: "1.8rem" }}>{A.admin.redrawConfirm}</h2>
          <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => setConfirmRedraw(false)}>{A.admin.keep}</SpecularButton>
            <SpecularButton className="btn btn-primary" onClick={redraw}>{A.admin.redrawEyebrow}</SpecularButton></div>
        </div></div>
      )}
    </Shell>
  );
}

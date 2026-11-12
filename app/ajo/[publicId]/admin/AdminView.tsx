"use client";
import { use, useCallback, useEffect, useState } from "react";
import SpecularButton from "@/components/SpecularButton";
import { CalendarButton, GroupHead, NO_MONEY, OrderView } from "@/components/ajo/GroupView";
import { Loading, Problem, Shell } from "@/components/ajo/Shell";
import { naira } from "@/lib/config";
import { api, clockOffset, copyText, fragment, shortDate } from "@/lib/ajo/client";
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
    if (!t) { setErr("This admin link is missing its private part (after the #). Copy the whole link again."); return; }
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

  if (err && !data) return <Problem title="Hmm" text={err} />;
  if (!data) return <Loading label="Opening your admin page" />;
  const g = data.group;
  const pub = typeof window === "undefined" ? "" : `${window.location.origin}/ajo/${g.publicId}`;
  const mins = Math.max(0, Math.floor(left / 60000)), secs = Math.max(0, Math.floor((left % 60000) / 1000));

  return (
    <Shell toast={toast}>
      <div className="panel rise">
        <GroupHead g={g} eyebrow="Ajo admin · keep this page private" />

        {data.canDraw ? (
          <>
            <p className="hint" style={{ marginTop: 18 }}>When everyone is ready, draw the payout order. Pinned members keep their agreed turns; everyone else is drawn at random into the rest.</p>
            <div className="draw-choice">
              <div className="toggle" style={{ cursor: "default" }}>
                <span><b>Draw now</b><span className="d">The order is set straight away. You can redraw within 10 minutes if you spot a typo, and every redraw is shown on the schedule.</span></span>
              </div>
              <div className="toggle" style={{ cursor: "default" }}>
                <span><b>Draw live</b><span className="d">Everyone with the schedule link watches the draw at the same moment, {LIVE_SECONDS} seconds after you start it. A live draw can&apos;t be redrawn.</span></span>
              </div>
            </div>
            <div className="err" role="alert">{err}</div>
            <div className="nav-row">
              <SpecularButton className="btn btn-ghost" onClick={() => draw("live")} disabled={busy}>Draw live (starts in {LIVE_SECONDS}s)</SpecularButton>
              <SpecularButton className="btn btn-primary" onClick={() => draw("instant")} disabled={busy}>{busy ? "Drawing…" : "Draw now"}</SpecularButton>
            </div>
          </>
        ) : (
          <>
            <OrderView g={g} offset={offset} refresh={refresh} sowFrom={sowFrom}
              action={(t) => (
                <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(`Turn ${t.turn}: ${t.name} collects ${naira(t.amount)} on ${shortDate(t.date)}. Contributions due by then.`)) ? "Announcement copied ✓" : "Couldn't copy")}>
                  Copy announcement
                </SpecularButton>
              )} />
            <div className="err" role="alert">{err}</div>
            {g.turns && (
              <div className="nav-row" style={{ justifyContent: "flex-start" }}>
                {data.redrawUntil && left > 0 && (
                  <SpecularButton className="btn btn-ghost btn-sm" onClick={() => setConfirmRedraw(true)} disabled={busy}>
                    Redraw ({mins}:{String(secs).padStart(2, "0")} left)
                  </SpecularButton>
                )}
                <CalendarButton publicId={g.publicId} />
                <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(pub)) ? "Schedule link copied ✓" : "Couldn't copy")}>Copy schedule link</SpecularButton>
                <SpecularButton className="btn btn-ghost btn-sm" href={`/ajo/${g.publicId}`}>Open public schedule</SpecularButton>
              </div>
            )}
            {g.turns && !data.redrawUntil && g.draw?.mode === "instant" && <p className="hint">The redraw window has closed. This order is final.</p>}
          </>
        )}
        <div className="notice">{NO_MONEY}</div>
      </div>

      {confirmRedraw && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="redraw-title"><div className="panel">
          <div className="eyebrow">Redraw</div>
          <h2 id="redraw-title" style={{ fontSize: "1.8rem" }}>Draw the order again?</h2>
          <p className="sub">Use this only to fix a mistake. Everyone will see on the schedule that the order was redrawn{g.draw?.redrawCount ? ` (it already has been ${g.draw.redrawCount === 1 ? "once" : `${g.draw.redrawCount} times`})` : ""}.</p>
          <div className="nav-row"><SpecularButton className="btn btn-ghost" onClick={() => setConfirmRedraw(false)}>Keep this order</SpecularButton>
            <SpecularButton className="btn btn-primary" onClick={redraw}>Redraw</SpecularButton></div>
        </div></div>
      )}
    </Shell>
  );
}

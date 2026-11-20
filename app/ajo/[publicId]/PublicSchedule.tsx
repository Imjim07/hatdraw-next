"use client";
import { use, useCallback, useEffect, useState } from "react";
import SpecularButton from "@/components/SpecularButton";
import { CalendarButton, GroupHead, NO_MONEY, OrderView } from "@/components/ajo/GroupView";
import { Loading, Problem, Shell } from "@/components/ajo/Shell";
import { api, clockOffset, copyText } from "@/lib/ajo/client";
import type { PublicGroup } from "@/lib/ajo/types";
import { ajo as A } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";

export default function PublicSchedule({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = use(params);
  const [g, setG] = useState<PublicGroup | null>(null);
  const [offset, setOffset] = useState(0);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const refresh = useCallback(async () => {
    const r = await api<{ group: PublicGroup }>(`/api/ajo/groups/${encodeURIComponent(publicId)}`);
    if (!r.ok) { setErr(r.error); return; }
    setOffset(clockOffset(r.group.serverNow));
    setG(r.group);
  }, [publicId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch once on mount
  useEffect(() => { refresh(); }, [refresh]);

  if (err && !g) return <Problem title={common.hmm} text={err} />;
  if (!g) return <Loading />;
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2400); };

  return (
    <Shell toast={toast}>
      <div className="panel rise">
        <GroupHead g={g} eyebrow={A.schedule.eyebrow} />
        <OrderView g={g} offset={offset} refresh={refresh} />
        <div className="nav-row" style={{ justifyContent: "flex-start" }}>
          {g.turns && <CalendarButton publicId={g.publicId} />}
          <SpecularButton className="btn btn-ghost btn-sm" onClick={async () => say((await copyText(window.location.href.split("#")[0])) ? A.schedule.copied : common.couldntCopy)}>{A.schedule.copySchedule}</SpecularButton>
        </div>
        <div className="notice">{NO_MONEY}</div>
      </div>
    </Shell>
  );
}

"use client";
import { lazy, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import LoaderOne from "@/components/ui/loader-one";
import type { RevealPayload } from "@/lib/types";
import { reveal as T } from "@/lib/copy/reveal";

// The reveal UI loads in parallel with the decrypt request (both start on mount),
// so first-load JS stays small for people opening links on slow mobile data.
const loadReveal = () => import("@/components/GiftReveal");
const GiftReveal = lazy(loadReveal);

function Opening() {
  return (
    <div className="reveal" data-mode="santa"><div className="reveal-inner">
      <LoaderOne label={T.opening} />
      <p className="sub" style={{ margin: "18px auto 0" }} aria-hidden="true">{T.opening}…</p>
    </div></div>
  );
}

// Links look like /r#<token>. The token stays in the URL fragment, which
// browsers never send to servers, and is posted to /api/reveal to decrypt.
export default function RevealPage() {
  const [state, setState] = useState<{ data?: RevealPayload; error?: string }>({});

  useEffect(() => {
    const token = window.location.hash.slice(1);
    loadReveal();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
    if (!token) { setState({ error: T.broken }); return; }
    fetch("/api/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then((r) => r.json())
      .then((j) => setState(j.ok ? { data: j.data } : { error: T.broken }))
      .catch(() => setState({ error: T.network }));
  }, []);

  if (state.data)
    return (
      <Suspense fallback={<Opening />}>
        <GiftReveal data={state.data} context="link" cta={{ href: "/draw", label: T.loopBack }} />
      </Suspense>
    );
  if (!state.error) return <Opening />;

  return (
    <div className="reveal" data-mode="santa"><div className="reveal-inner">
      <h2 className="serif">{T.hmm}</h2><p className="sub" style={{ margin: "0 auto 24px" }}>{state.error}</p><Link href="/" className="btn btn-ghost">{T.goHome}</Link>
      {state.error === T.broken && <p className="hint"><a href={T.stillStuckHref}>{T.stillStuck}</a></p>}
    </div></div>
  );
}

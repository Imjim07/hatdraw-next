"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import GiftReveal from "@/components/GiftReveal";
import type { RevealPayload } from "@/lib/types";
import { BRAND } from "@/lib/config";

// Links look like /r#<token>. The token stays in the URL fragment, which
// browsers never send to servers, and is posted to /api/reveal to decrypt.
export default function RevealPage() {
  const [state, setState] = useState<{ data?: RevealPayload; error?: string }>({});

  useEffect(() => {
    const token = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value, read once after hydration
    if (!token) { setState({ error: "This link is missing its secret part. Ask your organizer to resend it." }); return; }
    fetch("/api/reveal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then((r) => r.json())
      .then((j) => setState(j.ok ? { data: j.data } : { error: "This link looks broken. Ask your organizer to resend it." }))
      .catch(() => setState({ error: "Couldn't reach the hat. Check your connection and try again." }));
  }, []);

  if (state.data)
    return <GiftReveal data={state.data} context="link" actions={<Link href="/draw" className="btn btn-ghost">Run your own draw on {BRAND.name}</Link>} />;

  return (
    <div className="reveal"><div className="reveal-inner">
      {state.error ? (
        <><h2 className="serif">Hmm 🎩</h2><p className="sub" style={{ margin: "0 auto 24px" }}>{state.error}</p><Link href="/" className="btn btn-ghost">Go to {BRAND.name}</Link></>
      ) : (
        <p className="sub" style={{ margin: "0 auto" }}>Opening the hat…</p>
      )}
    </div></div>
  );
}

"use client";
import { useEffect, useState } from "react";
import SpecularButton from "@/components/SpecularButton";
import { Shell } from "@/components/ajo/Shell";
import AdireLoader from "@/components/AdireLoader";
import { api, fragment } from "@/lib/ajo/client";

// One-click unsubscribe from ajo reminder emails: /ajo/unsubscribe#<member>.<signature>
export default function Unsubscribe() {
  const [state, setState] = useState<"working" | "done" | "error">("working");
  useEffect(() => {
    const [m, s] = fragment().split(".");
    api("/api/ajo/unsubscribe", { m, s }).then((r) => setState(r.ok ? "done" : "error"));
  }, []);
  return (
    <Shell>
      <div className="panel rise" style={{ textAlign: "center" }}>
        {state === "working" ? <div className="loading-screen" style={{ minHeight: 200 }}><AdireLoader label="Switching reminders off" /></div> : (
          <>
            <h2>{state === "done" ? "Reminders off" : "Hmm"}</h2>
            <p className="sub" style={{ margin: "0 auto 24px" }}>{state === "done"
              ? "You won't get any more ajo reminder emails. You can switch them back on from your personal link."
              : "This unsubscribe link doesn't work. You can switch reminders off from your personal link instead."}</p>
            <SpecularButton href="/" className="btn btn-ghost">Go to HatDraw</SpecularButton>
          </>
        )}
      </div>
    </Shell>
  );
}

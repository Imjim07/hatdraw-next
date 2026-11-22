"use client";
import { useEffect, useState } from "react";
import SpecularButton from "@/components/SpecularButton";
import { Shell } from "@/components/ajo/Shell";
import LoaderOne from "@/components/ui/loader-one";
import { api, fragment } from "@/lib/ajo/client";
import { ajo } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";

const U = ajo.unsubscribe;

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
        {state === "working" ? <div className="loading-screen" style={{ minHeight: 200 }}><LoaderOne label={U.working} /></div> : (
          <>
            <h2>{state === "done" ? U.done : common.hmm}</h2>
            <p className="sub" style={{ margin: "0 auto 24px" }}>{state === "done" ? U.doneText : U.error}</p>
            <SpecularButton href="/" className="btn btn-ghost">{common.goHome}</SpecularButton>
          </>
        )}
      </div>
    </Shell>
  );
}

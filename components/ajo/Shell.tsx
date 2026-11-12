import type { ReactNode } from "react";
import Logo from "@/components/Logo";
import SpecularButton from "@/components/SpecularButton";
import AdireLoader from "@/components/AdireLoader";

/** The page frame every ajo screen uses (same as the draw wizard's). */
export function Shell({ children, toast }: { children: ReactNode; toast?: string }) {
  return (
    <div className="wrap">
      <nav className="top"><Logo /><SpecularButton href="/" className="btn btn-ghost btn-sm">← Home</SpecularButton></nav>
      <main className="app">{children}</main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export function Loading({ label = "Opening the schedule" }: { label?: string }) {
  return (
    <Shell>
      <div className="loading-screen" style={{ minHeight: "50vh" }}>
        <AdireLoader label={label} />
        <p className="hint" aria-hidden="true">{label}…</p>
      </div>
    </Shell>
  );
}

export function Problem({ title, text }: { title: string; text: string }) {
  return (
    <Shell>
      <div className="panel rise" style={{ textAlign: "center" }}>
        <h2>{title}</h2>
        <p className="sub" style={{ margin: "0 auto 24px" }}>{text}</p>
        <SpecularButton href="/ajo" className="btn btn-ghost">Start an ajo draw</SpecularButton>
      </div>
    </Shell>
  );
}

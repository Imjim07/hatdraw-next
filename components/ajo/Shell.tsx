import type { ReactNode } from "react";
import Logo from "@/components/Logo";
import SpecularButton from "@/components/SpecularButton";
import ThemeToggle from "@/components/ThemeToggle";
import FloatingMenu, { SITE_MENU } from "@/components/ui/liquid-morph-floating-menu";
import LoaderOne from "@/components/ui/loader-one";
import { ajo } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";

/** The page frame every ajo screen uses (same as the draw wizard's), in the ajo mode. */
export function Shell({ children, toast }: { children: ReactNode; toast?: string }) {
  return (
    <div className="wrap" data-mode="ajo">
      <nav className="top"><Logo /><span className="nav-end"><ThemeToggle /><SpecularButton href="/" className="btn btn-ghost btn-sm nav-cta">{common.home}</SpecularButton><FloatingMenu items={SITE_MENU} /></span></nav>
      <main className="app">{children}</main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export function Loading({ label = ajo.schedule.loadingLabel }: { label?: string }) {
  return (
    <Shell>
      <div className="loading-screen" style={{ minHeight: "50vh" }}>
        <LoaderOne label={label} />
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
        <SpecularButton href="/ajo" className="btn btn-ghost">{ajo.problemButton}</SpecularButton>
      </div>
    </Shell>
  );
}

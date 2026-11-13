"use client";
import { useEffect, useId, useRef, useState } from "react";
import { MenuIcon } from "@/components/ui/icons-menu";
import SpecularButton from "./SpecularButton";

// The landing page's menu on phones and tablets (≤860px, where the section pill nav
// is hidden): a menu button that opens a panel under the nav with the section links
// and "Start a draw". Closes on a link, Escape, a tap outside, or growing past 860px.
const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const wide = matchMedia("(min-width: 861px)");
    const onWide = () => { if (wide.matches) setOpen(false); };
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", onDown);
    wide.addEventListener("change", onWide);
    panel.current?.querySelector("a")?.focus();
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("pointerdown", onDown);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="menu-btn"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        <MenuIcon size={22} open={open} />
      </button>
      <div ref={panel} id={id} className={`menu-panel${open ? " open" : ""}`} hidden={!open}>
        <nav aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
        </nav>
        <SpecularButton href="/draw" className="btn btn-primary">Start a draw</SpecularButton>
      </div>
    </>
  );
}

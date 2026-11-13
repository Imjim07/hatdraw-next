"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MenuIcon } from "./icons-menu";
import SpecularButton from "../SpecularButton";

// Curved slide-in menu (after the 21st.dev "curved-menu"): a full-height panel slides
// in from the right while the bulge on its left edge flattens, with big numbered links
// whose letters ripple on hover. Ported to CSS (no framer-motion): the panel slide is a
// transform transition; the curve is one fixed bulge path scaled to flat on the x axis,
// which is the same shape as morphing the path's control point. Styles: .cm-* in globals.css.
//
// The panel is portalled to <body> so it sits above the weather chip; it has its own
// close button in the same spot as the menu button.

export type CurvedMenuItem = { heading: string; href: string };

const noop = () => () => {};

export default function CurvedMenu({ items, footer }: { items: CurvedMenuItem[]; footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const close = (refocus = true) => { setOpen(false); if (refocus) btn.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("cm-lock");
    const wide = matchMedia("(min-width: 1025px)");
    const onWide = () => { if (wide.matches) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btn.current?.focus(); return; }
      if (e.key !== "Tab" || !panel.current) return; // keep Tab inside the open menu
      const f = panel.current.querySelectorAll<HTMLElement>("a[href],button");
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>(".cm-link")?.focus({ preventScroll: true }), 50);
    return () => { root.classList.remove("cm-lock"); removeEventListener("keydown", onKey); wide.removeEventListener("change", onWide); clearTimeout(t); };
  }, [open]);

  return (
    <>
      <button ref={btn} type="button" className="menu-btn" aria-expanded={open} aria-controls="curved-menu" aria-label="Open menu" onClick={() => setOpen(true)}>
        <MenuIcon size={22} />
      </button>
      {mounted && createPortal(
        <>
          <div className={`cm-scrim${open ? " open" : ""}`} onClick={() => close(false)} aria-hidden="true" />
          <div ref={panel} id="curved-menu" className={`cm-panel${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu">
            <svg className="cm-curve" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true">
              <path d="M100 0 Q-100 500 100 1000 Z" />
            </svg>
            <button type="button" className="menu-btn cm-close" aria-label="Close menu" onClick={() => close()}>
              <MenuIcon size={22} open={open} />
            </button>
            <div className="cm-body">
              <p className="cm-label">Navigation</p>
              <nav aria-label="Menu">
                {items.map((it, i) => (
                  <Link key={it.href} href={it.href} className="cm-link" onClick={() => close(false)}>
                    <span className="cm-num" aria-hidden="true">{i + 1}.</span>
                    <span className="sr-only">{it.heading}</span>
                    <span className="cm-word" aria-hidden="true">
                      {it.heading.split("").map((ch, j) => (
                        <span key={j} style={{ "--i": j } as CSSProperties}>{ch === " " ? " " : ch}</span>
                      ))}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
            {footer && <div className="cm-foot">{footer}</div>}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

export function StartDrawFooter() {
  return (
    <>
      <SpecularButton href="/draw" className="btn btn-primary">Start a draw</SpecularButton>
      <span className="cm-note">Free up to 15 people · Made in Lagos</span>
    </>
  );
}

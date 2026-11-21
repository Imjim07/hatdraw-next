"use client";
// Liquid morph floating menu (after the 21st.dev "liquid-morph-floating-menu"), the menu on
// phones and tablets. A gold "Menu" pill floats at the bottom centre, in thumb reach; tapped,
// it grows into a rounded panel while an indigo circle rises from the bottom to fill it, and
// the links fade in one after another. On hover (mouse or trackpad) each letter of a link
// rolls up (the copy that rolls in is drawn by CSS, so the link text appears once). Ported to CSS transitions: no framer-motion, Tailwind or fonts beyond the site's.
// Styles: .lm-* in globals.css (shown only where the top section nav is hidden).
//
// - The pill is a real <button> (aria-expanded); the links are real links, unreachable and
//   hidden from screen readers while the menu is closed (inert).
// - Escape, a tap outside, or picking a link closes it; focus goes to the first link on
//   open and back to the button on Escape.
// - Reduced motion: it opens and closes without the morph.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { common } from "@/lib/copy/common";

export type MenuItem = { heading: string; href: string };

/** Menu for every page except the landing page (which links to its own sections). */
const M = common.menuItems;
export const SITE_MENU: MenuItem[] = [
  { heading: M.home, href: "/" },
  { heading: M.santa, href: "/draw" },
  { heading: M.ajo, href: "/ajo" },
  { heading: M.gifts, href: "/gifts" },
  { heading: M.pricing, href: "/#pricing" },
];

const noop = () => () => {};
// Where the top section nav is hidden (globals.css uses the same query).
const SMALL = "(max-width: 1024px), (hover: none) and (pointer: coarse) and (max-width: 1366px)";

export default function FloatingMenu({ items, cta }: { items: MenuItem[]; cta?: { label: string; href: string } }) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    const small = matchMedia(SMALL);
    const onResize = () => { if (!small.matches) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    addEventListener("keydown", onKey);
    small.addEventListener("change", onResize);
    const t = setTimeout(() => root.current?.querySelector<HTMLElement>(".lm-link")?.focus({ preventScroll: true }), 420);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      removeEventListener("keydown", onKey);
      small.removeEventListener("change", onResize);
      clearTimeout(t);
    };
  }, [open]);

  if (!mounted) return null;
  const close = () => setOpen(false);
  const n = items.length;

  return createPortal(
    <div ref={root} className={`lm${open ? " is-open" : ""}`} style={{ "--n": n, "--cta": cta ? 1 : 0 } as CSSProperties}>
      <div className="lm-shape">
        <span className="lm-fill" aria-hidden="true" />
        <nav id="lm-panel" className="lm-items" aria-label={common.menu.dialog} inert={!open}>
          {items.map((it, i) => (
            <Link key={it.href} href={it.href} className="lm-link" onClick={close} style={{ "--i": i } as CSSProperties}>
              <span className="sr-only">{it.heading}</span>
              <span className="lm-word" aria-hidden="true">
                {[...it.heading].map((ch, j) => (
                  <span key={j} className="lm-ch" style={{ "--j": j } as CSSProperties}>
                    <span className="lm-roll" data-ch={ch === " " ? " " : ch}><span>{ch === " " ? " " : ch}</span></span>
                  </span>
                ))}
              </span>
            </Link>
          ))}
          {cta && <Link href={cta.href} className="lm-cta" onClick={close} style={{ "--i": n } as CSSProperties}>{cta.label} <span aria-hidden="true">→</span></Link>}
        </nav>
        <button ref={toggle} type="button" className="lm-bar" aria-expanded={open} aria-controls="lm-panel"
          aria-label={open ? common.menu.close : common.menu.open} onClick={() => setOpen(!open)}>
          <span className="lm-label" aria-hidden="true">{common.menu.dialog}</span>
          <span className="lm-burger" aria-hidden="true"><i /><i /></span>
        </button>
      </div>
    </div>,
    document.body,
  );
}

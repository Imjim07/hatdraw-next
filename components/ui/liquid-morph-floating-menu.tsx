"use client";
// Liquid morph menu (after the 21st.dev "liquid-morph-floating-menu"), the menu on phones and
// tablets. The trigger is a round hamburger in the top bar, to the right of the theme toggle.
// Tapped, a panel grows out of it (same top-right corner) while an indigo circle drops in to
// fill it; the page behind blurs; the links fade in one after another, then a glass Start a
// draw button (home page) and the Instagram and TikTok links. On hover (mouse or trackpad)
// each link's letters roll up; the copy that rolls in is drawn by CSS, so the text appears once.
// Ported to CSS transitions: no framer-motion or Tailwind. Styles: .lm-* in globals.css.
//
// - Real buttons (aria-expanded on the trigger); the panel's links are hidden and inert while
//   it's closed. Escape, the blurred backdrop, the ✕ or a link closes it; focus goes to the
//   first link on open and back to the hamburger on close.
// - The panel is portalled to <body> (above the weather chip and effects) and placed over
//   the trigger from its measured position.
// - Reduced motion: it opens and closes without the morph.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import SpecularButton from "../SpecularButton";
import { SOCIAL_ICONS } from "../SocialIcons";
import { BRAND, SOCIAL } from "@/lib/config";
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

const SOCIALS = SOCIAL.filter((s) => s.id === "instagram" || s.id === "tiktok");
const noop = () => () => {};
// Where the top section nav is hidden (globals.css uses the same query).
const SMALL = "(max-width: 1024px), (hover: none) and (pointer: coarse) and (max-width: 1366px)";

function Burger() {
  return <span className="lm-burger" aria-hidden="true"><i /><i /></span>;
}

export default function FloatingMenu({ items, cta }: { items: MenuItem[]; cta?: { label: string; href: string } }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState({ top: 0, right: 0 });
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const trigger = useRef<HTMLButtonElement>(null);
  const shape = useRef<HTMLDivElement>(null);

  const place = () => {
    const r = trigger.current?.getBoundingClientRect();
    if (r) setAt({ top: r.top, right: document.documentElement.clientWidth - r.right });
  };
  const close = (refocus = true) => { setOpen(false); if (refocus) trigger.current?.focus({ preventScroll: true }); };

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("lm-lock");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const small = matchMedia(SMALL);
    const onSmall = () => { if (!small.matches) setOpen(false); };
    addEventListener("keydown", onKey);
    addEventListener("resize", place);
    small.addEventListener("change", onSmall);
    const t = setTimeout(() => shape.current?.querySelector<HTMLElement>(".lm-link")?.focus({ preventScroll: true }), 420);
    return () => {
      root.classList.remove("lm-lock");
      removeEventListener("keydown", onKey);
      removeEventListener("resize", place);
      small.removeEventListener("change", onSmall);
      clearTimeout(t);
    };
  }, [open]);

  const n = items.length;
  return (
    <>
      <button ref={trigger} type="button" className="lm-trigger" aria-expanded={open} aria-controls="lm-panel"
        aria-label={common.menu.open} onClick={() => { place(); setOpen(true); }}>
        <Burger />
      </button>
      {mounted && createPortal(
        <>
          <div className={`lm-scrim${open ? " is-open" : ""}`} onClick={() => close(false)} aria-hidden="true" />
          <div ref={shape} id="lm-panel" className={`lm${open ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label={common.menu.dialog}
            inert={!open} style={{ top: at.top, right: at.right, "--r": `${at.right}px`, "--n": n, "--cta": cta ? 1 : 0 } as CSSProperties}>
            <span className="lm-fill" aria-hidden="true" />
            <div className="lm-bar">
              <button type="button" className="lm-close" aria-label={common.menu.close} onClick={() => close()}><Burger /></button>
            </div>
            <nav className="lm-items" aria-label={common.menu.dialog}>
              {items.map((it, i) => (
                <Link key={it.href} href={it.href} className="lm-link" onClick={() => close(false)} style={{ "--i": i } as CSSProperties}>
                  <span className="sr-only">{it.heading}</span>
                  <span className="lm-word" aria-hidden="true">
                    {[...it.heading].map((ch, j) => {
                      const c = ch === " " ? " " : ch;
                      return <span key={j} className="lm-ch" style={{ "--j": j } as CSSProperties}><span className="lm-roll" data-ch={c}><span>{c}</span></span></span>;
                    })}
                  </span>
                </Link>
              ))}
              {cta && (
                <span className="lm-in" style={{ "--i": n } as CSSProperties}>
                  <SpecularButton href={cta.href} className="btn lm-cta" onClick={() => close(false)}>{cta.label} <span aria-hidden="true">→</span></SpecularButton>
                </span>
              )}
              <ul className="lm-social lm-in" style={{ "--i": n + 1 } as CSSProperties}>
                {SOCIALS.map((s) => (
                  <li key={s.id}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${BRAND.name} on ${s.label}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{SOCIAL_ICONS[s.id]}</svg>
                      <span aria-hidden="true">{s.handle || s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

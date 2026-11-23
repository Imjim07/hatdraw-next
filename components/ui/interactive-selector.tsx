"use client";
// Interactive selector (a rewrite of the 21st.dev "InteractiveSelector"): a row of photo
// panels, one open at a time. Ported to plain CSS (.uc-* in globals.css): no Tailwind.
// - Phone first: a vertical stack, 620px tall, so six panels leave each closed one ≥48px
//   to tap. From 768px: a horizontal row, min(440px, 80svh) tall (fits a phone on its side).
//   Fixed heights, and next/image `fill` in sized boxes, so nothing shifts as photos load.
// - Every panel is one real button (aria-expanded) that opens it: tap, click, or keyboard
//   (arrows move and open, Home/End jump). Never on hover. The open panel's text sits in a
//   region labelled by its button; closed regions are inert. Only live panels have a link.
// - The panels slide in one after another when the section first scrolls into view.
//   Reduced motion: no slide, no fade, panels switch instantly.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

export type SelectorOption = {
  id: string;
  title: string;
  description: string;
  image: { src: string; alt: string; credit?: string };
  icon: ReactNode;
  status: "live" | "soon";
  href?: string;
  cta?: string;
};

type Props = {
  options: SelectorOption[];
  soonLabel: string;
  defaultIndex?: number;
};

export default function InteractiveSelector({ options, soonLabel, defaultIndex = 0 }: Props) {
  const [active, setActive] = useState(defaultIndex);
  const [shown, setShown] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // The staggered entrance runs once, when the section scrolls into view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const focusPanel = (i: number) => {
    const n = (i + options.length) % options.length;
    setActive(n);
    btnRefs.current[n]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: options.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    focusPanel(to);
  };

  return (
    <div ref={rootRef} className={`uc${shown ? " is-shown" : ""}`}>
      {options.map((o, i) => {
        const open = i === active;
        const panelId = `uc-panel-${o.id}`;
        const btnId = `uc-btn-${o.id}`;
        return (
          <div key={o.id} className={`uc-item${open ? " is-open" : ""}`} style={{ "--i": i } as CSSProperties}>
            <Image src={o.image.src} alt={o.image.alt} fill sizes="(min-width: 768px) 60vw, 100vw" className="uc-img" />
            <div className="uc-shade" aria-hidden="true" />

            {/* The whole panel is the button. Nothing interactive sits inside it. */}
            <button
              ref={(el) => { btnRefs.current[i] = el; }}
              id={btnId}
              type="button"
              className="uc-btn"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <span className="uc-tab">
                <span className="uc-icon">{o.icon}</span>
                {/* Closed panels show the title on phones; in the row, only the icon shows. */}
                <span className="uc-tab-title">{o.title}</span>
              </span>
            </button>

            <div id={panelId} role="region" aria-labelledby={btnId} inert={!open} className="uc-body">
              <div className="uc-head">
                <span className="uc-icon" aria-hidden="true">{o.icon}</span>
                <h3>{o.title}</h3>
                {o.status === "soon" && <span className="uc-soon">{soonLabel}</span>}
              </div>
              <p className="uc-desc">{o.description}</p>
              {o.status === "live" && o.href && o.cta && (
                <Link href={o.href} className="uc-cta">{o.cta} <span aria-hidden="true">→</span></Link>
              )}
              {o.image.credit && <p className="uc-credit">{o.image.credit}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

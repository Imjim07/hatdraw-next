"use client";
import { useEffect, useRef, useState } from "react";
import GooeyNav from "./GooeyNav";

// Landing-page section links. The gold pill follows the section you're reading;
// after a click it stays on the clicked item until the smooth scroll ends, so it
// doesn't hop through the sections in between.
const ITEMS = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

// Indigo & Starch instead of the stock grey (passed as style: the component sets its theme inline).
// --gn-y 14px makes each item ≥44px tall.
const THEME = {
  "--gn-frame": "rgba(30, 47, 102, 0.55)",
  "--gn-frame-edge": "rgba(239, 232, 216, 0.12)",
  "--gn-frame-highlight": "rgba(239, 232, 216, 0.08)",
  "--gn-ink": "var(--starch)",
  "--gn-muted": "var(--starch-dim)",
  "--gn-y": "14px",
} as React.CSSProperties;

export default function SectionNav() {
  const [active, setActive] = useState(0);
  const locked = useRef(false);

  useEffect(() => {
    const sections = ITEMS.map((i) => document.getElementById(i.href.slice(1)));
    let frame = 0;
    const spy = () => {
      frame = 0;
      if (locked.current) return;
      const line = innerHeight * 0.35;
      let idx = 0;
      sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= line) idx = i; });
      setActive(idx);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(spy); };
    const unlock = () => { locked.current = false; onScroll(); };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("scrollend", unlock);
    spy();
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
      removeEventListener("scrollend", unlock);
    };
  }, []);

  return (
    <GooeyNav
      aria-label="Sections"
      className="section-nav"
      items={ITEMS}
      activeIndex={active}
      onChange={(i) => {
        locked.current = true;
        setTimeout(() => { locked.current = false; }, 1500); // in case scrollend never fires
        setActive(i);
      }}
      theme="dark"
      size="md"
      color="#E3B45A"
      activeTextColor="#0E1838"
      particleCount={15}
      spread={56}
      animationTime={600}
      timeVariance={300}
      gooeyness={0.5}
      wobble={0.5}
      style={THEME}
    />
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import GooeyNav from "./GooeyNav";
import { PALETTE } from "@/lib/palette";

// Landing-page section links. The gold pill follows the section you're reading;
// after a click it stays on the clicked item until the smooth scroll ends, so it
// doesn't hop through the sections in between.
const ITEMS = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

// The neutral indigo pill on an indigo-mist frame, instead of the stock grey (passed as style: the component sets its theme inline).
// --gn-y 14px makes each item ≥44px tall.
const THEME = {
  "--gn-frame": "rgba(221, 227, 245, 0.75)", // indigo mist
  "--gn-frame-edge": "rgba(20, 26, 51, 0.12)", // --line
  "--gn-frame-highlight": "rgba(255, 255, 255, 0.6)",
  "--gn-frame-shadow": "0 18px 36px -24px rgba(20, 26, 51, 0.35)",
  "--gn-ink": "var(--ink)",
  "--gn-muted": "var(--text-muted)",
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
      theme="light"
      size="md"
      color={PALETTE.indigo}
      activeTextColor={PALETTE.cloud}
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

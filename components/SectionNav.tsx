"use client";
import { useEffect, useRef, useState } from "react";
import GooeyNav from "./GooeyNav";
import { DARK, PALETTE } from "@/lib/palette";
import { useTheme } from "@/lib/theme";
import { landing } from "@/lib/copy/landing";

// Landing-page section links. The gold pill follows the section you're reading;
// after a click it stays on the clicked item until the smooth scroll ends, so it
// doesn't hop through the sections in between.
const N = landing.nav;
const ITEMS = [
  { label: N.how, href: "#how" },
  { label: N.offers, href: "#features" },
  { label: N.pricing, href: "#pricing" },
  { label: N.gifts, href: "/gifts" }, // a page, not a section: the spy below skips it
];

// The neutral pill (indigo on light, indigo mist on dark) on a tinted frame, instead of
// the stock grey (passed as style: the component sets its theme inline). The pill is
// drawn in WebGL, so it takes real colours, not CSS variables.
// --gn-y 14px makes each item ≥44px tall.
const THEME = {
  "--gn-frame": "color-mix(in srgb, var(--indigo-mist) 75%, transparent)",
  "--gn-frame-edge": "var(--line)",
  "--gn-frame-highlight": "color-mix(in srgb, var(--cloud) 40%, transparent)",
  "--gn-frame-shadow": "0 18px 36px -24px rgba(20, 26, 51, 0.35)",
  "--gn-ink": "var(--ink)",
  "--gn-muted": "var(--text-muted)",
  "--gn-y": "14px",
} as React.CSSProperties;

export default function SectionNav() {
  const [active, setActive] = useState(0);
  const dark = useTheme() === "dark";
  const locked = useRef(false);

  useEffect(() => {
    const sections = ITEMS.map((i) => (i.href.startsWith("#") ? document.getElementById(i.href.slice(1)) : null));
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
      aria-label={N.sections}
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
      color={dark ? DARK.brand : PALETTE.indigo}
      activeTextColor={dark ? PALETTE.ink : PALETTE.cloud}
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

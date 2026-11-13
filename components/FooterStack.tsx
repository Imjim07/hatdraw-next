"use client";
import { useEffect, useRef } from "react";

// The footer as one stacking card, after React Bits' <ScrollStack>: on the last scroll
// the section above it (`under`) holds still while the footer slides up over it, and
// the covered section shrinks and darkens like a buried card (React Bits' defaults:
// -0.05 scale, +0.2 dim for one card on top).
//
// React Bits pins with position: sticky, which can't work inside GSAP ScrollSmoother
// (the page sits in a fixed wrapper), so this uses a ScrollTrigger pin instead. The
// pinned section's own transform belongs to the pin, so the shrink goes on its inner
// .wrap; the dim is `.stack-under::after` reading --sf-dim (globals.css).
//
// Runs only once the smoother is up (SmoothScroll fires "smoother:ready"), with motion
// allowed and a viewport at least 560px tall. Otherwise the footer just follows the page.
const SCALE = 0.95, DIM = 0.2;

export default function FooterStack({ under, children }: { under: string; children: React.ReactNode }) {
  const foot = useRef<HTMLElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { ScrollSmoother }] = await Promise.all([
        import("gsap"), import("gsap/ScrollTrigger"), import("gsap/ScrollSmoother"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

      const start = () => {
        const card = foot.current, below = document.querySelector<HTMLElement>(under);
        const inner = below?.querySelector<HTMLElement>(":scope > .wrap");
        const smoother = ScrollSmoother.get();
        if (cancelled || !card || !below || !inner || !smoother) return;

        const mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference) and (min-height: 560px)", () => {
          // hold the section still from when its bottom meets the screen's bottom
          // until the footer has fully arrived (the end of the page)
          ScrollTrigger.create({
            trigger: below, start: "bottom bottom",
            endTrigger: card, end: "bottom bottom",
            pin: true, pinSpacing: false,
          });
          const cover = ScrollTrigger.create({
            trigger: card, start: "top bottom", end: "bottom bottom",
            onUpdate: ({ progress }) => {
              gsap.set(inner, { scale: 1 - progress * (1 - SCALE) });
              below.style.setProperty("--sf-dim", (progress * DIM).toFixed(3));
            },
          });

          // Tabbing back into the covered section: scroll to where it's uncovered.
          const onFocus = () => { if (smoother.scrollTop() > cover.start + 4) smoother.scrollTo(cover.start, true); };
          const deferred = () => requestAnimationFrame(onFocus); // after ScrollSmoother's own focus handling
          below.addEventListener("focusin", deferred);
          ScrollTrigger.refresh();

          return () => {
            below.removeEventListener("focusin", deferred);
            below.style.removeProperty("--sf-dim");
          };
        });
        cleanup = () => mm.revert();
      };

      if (ScrollSmoother.get()) start();
      else {
        addEventListener("smoother:ready", start, { once: true });
        cleanup = () => removeEventListener("smoother:ready", start);
      }
    })();

    return () => { cancelled = true; cleanup(); };
  }, [under]);

  return <footer className="site-foot" ref={foot}>{children}</footer>;
}

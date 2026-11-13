"use client";
import { useEffect, useRef } from "react";

// Footer card stack, after React Bits' <ScrollStack>: as you scroll into the footer,
// each card pins near the top while the next one slides over it; cards underneath
// shrink and dim. Only the footer does this.
//
// React Bits pins its cards with position: sticky, which can't work inside GSAP
// ScrollSmoother (the page sits in a fixed wrapper), and its own wheel smoothing
// would fight the smoother. So this is the same effect built on ScrollTrigger pins,
// with React Bits' defaults: 15% from the top, 24px between pinned cards, -0.05 scale
// and +0.2 dim per card on top, never smaller than 0.8.
//
// It runs only once the smoother is up (SmoothScroll fires "smoother:ready"), and only
// with motion allowed and a viewport at least 560px tall. Otherwise the cards are
// just laid out one after another. Cards are `.sf-card`, each with a `.sf-shade`.
const STACK_TOP = 0.15, OFFSET = 24, ITEM_SCALE = 0.05, BASE_SCALE = 0.8, DIM = 0.2, CHIP = 96;

export default function FooterStack({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);

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
        const box = root.current, spacer = end.current;
        const smoother = ScrollSmoother.get();
        if (cancelled || !box || !spacer || !smoother) return;
        const cards = Array.from(box.querySelectorAll<HTMLElement>(":scope > .sf-card"));
        const n = cards.length;
        if (n < 2) return;

        const mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference) and (min-height: 560px)", () => {
          const pin = (i: number) => innerHeight * STACK_TOP + i * OFFSET;
          // Room under the last card so it can reach its slot; never less than the
          // weather chip's height, so the chip doesn't cover the © line.
          const fit = () => { spacer.style.height = `${Math.max(CHIP, innerHeight - pin(n - 1) - cards[n - 1].offsetHeight)}px`; };
          fit();
          ScrollTrigger.addEventListener("refreshInit", fit);

          const cover = new Array<number>(n).fill(0); // cover[j]: how far card j is over card j-1
          const paint = () => {
            let depth = 0;
            for (let i = n - 1; i >= 0; i--) {
              // card i's depth is the sum of how far every card after it has landed
              const scale = Math.max(BASE_SCALE, 1 - depth * ITEM_SCALE);
              gsap.set(cards[i], { scale: depth < 0.0005 ? 1 : scale });
              cards[i].style.setProperty("--sf-dim", (1 - Math.pow(1 - DIM, depth)).toFixed(3));
              depth += cover[i];
            }
          };

          const pins = cards.slice(0, -1).map((card, i) => ScrollTrigger.create({
            trigger: card, start: () => `top ${pin(i)}px`,
            endTrigger: cards[n - 1], end: () => `top ${pin(n - 1)}px`,
            pin: true, pinSpacing: false,
          }));
          const covers = cards.map((card, j) => j === 0 ? null : ScrollTrigger.create({
            trigger: card,
            start: () => `top ${pin(j - 1) + cards[j - 1].offsetHeight}px`, // touching the card it covers
            end: () => `top ${pin(j)}px`, // in its own slot
            onUpdate: (self) => { cover[j] = self.progress; paint(); },
            onRefresh: (self) => { cover[j] = self.progress; paint(); },
          }));

          // Tabbing to a link in a buried card: scroll back to where that card is on top.
          const onFocus = (e: FocusEvent) => {
            const i = cards.findIndex((c) => c.contains(e.target as Node));
            const next = covers[i + 1];
            if (i < 0 || i >= n - 1 || !next || smoother.scrollTop() <= next.start) return;
            // next frame: ScrollSmoother handles the same focus event and would cancel this
            requestAnimationFrame(() => smoother.scrollTo(pins[i].start, true));
          };
          box.addEventListener("focusin", onFocus);
          ScrollTrigger.refresh();

          return () => {
            box.removeEventListener("focusin", onFocus);
            ScrollTrigger.removeEventListener("refreshInit", fit);
            spacer.style.height = "";
            cards.forEach((c) => c.style.removeProperty("--sf-dim"));
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
  }, []);

  return (
    <div className="sf-stack" ref={root}>
      {children}
      <div className="sf-stack-end" ref={end} aria-hidden="true" />
    </div>
  );
}

"use client";
import { useEffect, useRef } from "react";

// Smooth scrolling for the landing page, after the GSAP ScrollSmoother demo. The page
// still scrolls natively; ScrollSmoother fixes the wrapper in place and eases the
// content to the real scroll position, so the wheel glides instead of stepping.
// `effects: true` turns on data-speed (parallax) and data-lag (trailing) attributes
// anywhere inside the content.
//
// - GSAP is loaded after the page is interactive (dynamic import), so it adds nothing
//   to first-load JS and never reaches /r.
// - Reduced motion: GSAP is never loaded and the page scrolls normally, so the
//   data-speed / data-lag attributes do nothing.
// - Touch screens get a light ease too (smoothTouch 0.1). With purely native touch
//   scrolling the footer's pin (FooterStack) was positioned a frame behind the finger,
//   so scrolling back up from the footer jerked; eased, it slides back like on desktop.
// - Phones' address bar showing and hiding doesn't re-measure the page (ignoreMobileResize),
//   which otherwise made the pinned section jump mid-scroll.
// - Same-page #links go through smoother.scrollTo: the browser's own jump would
//   scroll the fixed wrapper instead of the page.
// - normalizeScroll from the demo is left off: it takes over touch scrolling.
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { ScrollSmoother }] = await Promise.all([
        import("gsap"), import("gsap/ScrollTrigger"), import("gsap/ScrollSmoother"),
      ]);
      if (cancelled || !wrapper.current || !content.current) return;
      gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
      ScrollTrigger.config({ ignoreMobileResize: true });

      const root = document.documentElement;
      root.classList.add("smooth-on"); // CSS scroll-behavior:smooth would fight it
      const smoother = ScrollSmoother.create({
        wrapper: wrapper.current,
        content: content.current,
        smooth: 1.2,
        effects: true,
        smoothTouch: 0.1,
      });
      dispatchEvent(new Event("smoother:ready")); // FooterStack builds its pins after this

      // Land a section just below the fixed nav (.site-head) rather than under it.
      const at = () => `top ${Math.round(document.querySelector(".site-head")?.getBoundingClientRect().height ?? 0) + 16}px`;

      const target = (hash: string) => {
        try { return hash.length > 1 ? document.querySelector<HTMLElement>(decodeURIComponent(hash)) : null; }
        catch { return null; }
      };
      // Same-page anchors: the section nav, hero buttons, footer and the menu.
      const onClick = (e: MouseEvent) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
        if (!a || a.origin !== location.origin || a.pathname !== location.pathname || !a.hash) return;
        const el = target(a.hash);
        if (!el) return;
        e.preventDefault();
        smoother.scrollTo(el, true, at());
        history.pushState(null, "", a.hash);
      };
      // capture: runs before Next's <Link> handler, which would jump natively
      document.addEventListener("click", onClick, true);

      // Arrived with a hash (e.g. /#pricing from another page): undo any native jump
      // of the wrapper and go there through the smoother.
      const arrived = target(location.hash);
      if (arrived) {
        wrapper.current.scrollTop = 0;
        requestAnimationFrame(() => smoother.scrollTo(arrived, false, at()));
      }

      cleanup = () => {
        document.removeEventListener("click", onClick, true);
        smoother.kill();
        root.classList.remove("smooth-on");
      };
    })();

    return () => { cancelled = true; cleanup(); };
  }, []);

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content" ref={content}>{children}</div>
    </div>
  );
}

"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LoaderOne from "./ui/loader-one";

// Page change between /, /draw and /ajo (the way into a draw): the moment a link to one
// of them is tapped, the page dims and the three-dot loader shows; when the new page is
// in, the loader fades away and the page rises in. Never blocks input (pointer-events:
// none). Never on first load, never on /r (people arrive there from WhatsApp on slow
// data), and not at all with reduced motion.
const ROUTES = new Set(["/", "/draw", "/ajo"]);
const MIN_MS = 350;    // once shown, long enough to read as a loader, not a flicker
const GIVE_UP = 8000;  // a navigation that never lands (offline, cancelled)

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The page content is never inside the Suspense boundary: only the loader reads
// the pathname, so pages with runtime params (e.g. /ajo/[publicId]) can still
// prerender under Cache Components.
// The label comes from the (server) layout, so the copy isn't shipped to every page.
export default function TransitionLayer({ children, label }: { children: React.ReactNode; label: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={wrap}>{children}</div>
      <Suspense fallback={null}><RouteLoader wrap={wrap} label={label} /></Suspense>
    </>
  );
}

// loading: waiting for the new page. landed: it's in, but the loader holds for MIN_MS.
// fading: going.
type Phase = "idle" | "loading" | "landed" | "fading";

function RouteLoader({ wrap, label }: { wrap: React.RefObject<HTMLDivElement | null>; label: string }) {
  const pathname = usePathname();
  const [prev, setPrev] = useState(pathname);
  const [phase, setPhase] = useState<Phase>("idle");
  const shownAt = useRef(0);

  // A tap on a link to another of the three pages: show the loader straight away.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (!ROUTES.has(location.pathname) || !ROUTES.has(url.pathname) || reduced()) return;
      shownAt.current = performance.now();
      setPhase("loading");
    };
    // Capture phase: next/link cancels the click's default before a bubbling listener sees it.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // The new page is in (render-time, no effect needed): let the loader go.
  if (pathname !== prev) {
    setPrev(pathname);
    if (phase === "loading") setPhase("landed");
  }

  useEffect(() => {
    if (phase === "loading") {
      const t = setTimeout(() => setPhase("idle"), GIVE_UP);
      return () => clearTimeout(t);
    }
    if (phase === "landed") {
      const t = setTimeout(() => setPhase("fading"), Math.max(0, MIN_MS - (performance.now() - shownAt.current)));
      return () => clearTimeout(t);
    }
    if (phase !== "fading") return;
    wrap.current?.animate(
      [{ opacity: 0.25, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
      { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
    const t = setTimeout(() => setPhase("idle"), 260);
    return () => clearTimeout(t);
  }, [phase, wrap]);

  if (phase === "idle") return null;
  return (
    <div className={`route-loader${phase === "fading" ? " is-leaving" : ""}`}>
      <LoaderOne label={label} />
    </div>
  );
}

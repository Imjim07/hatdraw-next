"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Owo } from "./motifs";

// Cowrie page transition: a cord draws across the screen and cowries pop onto
// it, then the overlay fades and the new page rises in. ≤600ms, never blocks
// input (pointer-events: none) and never delays content.
// Only between / and /draw. Never on first load, never on /r (people arrive
// there from WhatsApp on slow data), and not at all with reduced motion.
const ROUTES = new Set(["/", "/draw"]);
const COWRIES = [0.16, 0.3, 0.44, 0.58, 0.72, 0.86];
const sag = (t: number) => 20 + 160 * t * (1 - t); // y (px) on the cord path below at t ∈ 0..1

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function TransitionLayer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [prev, setPrev] = useState(pathname);
  const [run, setRun] = useState(0); // which navigation is playing (0 = none)
  const wrap = useRef<HTMLDivElement>(null);

  // Adjust state when the route changes (render-time, no effect needed).
  if (pathname !== prev) {
    setPrev(pathname);
    if (ROUTES.has(prev) && ROUTES.has(pathname) && !reduced()) setRun((r) => r + 1);
  }

  useEffect(() => {
    if (!run) return;
    wrap.current?.animate(
      [{ opacity: 0.25, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
      { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }, [run]);

  return (
    <>
      <div ref={wrap}>{children}</div>
      {run > 0 && (
        <div key={run} className="cowrie-cord" aria-hidden="true"
          onAnimationEnd={(e) => { if (e.target === e.currentTarget) setRun(0); }}>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d="M0 20 Q500 100 1000 20" pathLength={1} />
          </svg>
          {COWRIES.map((t, i) => (
            <span key={t} className="cowrie" style={{ left: `${t * 100}%`, top: sag(t), animationDelay: `${80 + i * 40}ms`, rotate: `${(0.5 - t) * -24}deg` }}>
              <Owo size={44} color="var(--indigo-deep)" strokeWidth={5} />
            </span>
          ))}
        </div>
      )}
    </>
  );
}

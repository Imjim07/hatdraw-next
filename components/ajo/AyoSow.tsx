"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// The ayo sowing draw: turns are pits on the existing ayo board, and one gold
// seed is sown pit to pit in turn order; each pit takes its name as the seed
// lands. 2–4 seconds whatever the group size. Calm: no confetti, no sound.
// `startAt` is a Date.now()-based time, so viewers of a live draw (and anyone
// who arrives late) see the same moment. Reduced motion: the order, at once.
const TOTAL_MS = (n: number) => Math.min(4000, Math.max(2000, n * 350));

export default function AyoSow({ names, startAt, onDone }: { names: string[]; startAt: number; onDone?: () => void }) {
  const n = names.length;
  const [shown, setShown] = useState(0); // pits filled so far
  const [seed, setSeed] = useState<{ x: number; y: number } | null>(null);
  const board = useRef<HTMLOListElement>(null);
  const done = useRef(onDone);
  useLayoutEffect(() => { done.current = onDone; });

  const per = TOTAL_MS(n) / Math.max(1, n);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = -1;
    const tick = () => {
      const elapsed = Date.now() - startAt;
      const k = reduced ? n : Math.max(0, Math.min(n, Math.floor(elapsed / per) + (elapsed >= 0 ? 1 : 0)));
      if (k !== last) {
        last = k;
        setShown(k);
        // The seed is on its way to the next pit, which fills as it lands.
        const pit = board.current?.children[k] as HTMLElement | undefined;
        if (pit && !reduced && k > 0 && k < n) setSeed({ x: pit.offsetLeft + pit.offsetWidth / 2, y: pit.offsetTop + pit.offsetHeight / 2 });
        else setSeed(null);
        if (k >= n) { done.current?.(); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n, per, startAt]);

  // An ayo board has two rows of six pits; fill out the last row.
  const empty = Math.max(12, Math.ceil(n / 6) * 6) - n;
  return (
    <div className="sow">
      <p className="sr-only" aria-live="polite">{shown >= n ? `Payout order drawn. ${names.map((x, i) => `Turn ${i + 1}: ${x}`).join(". ")}.` : ""}</p>
      <ol ref={board} className="board sow-board" aria-hidden="true">
        {names.map((name, i) => (
          <li key={i} className={`hole ${i < shown ? "filled" : "empty"}`}>
            <span className="turn-n">Turn {i + 1}</span>
            {i < shown && <span className="nm" title={name}>{name}</span>}
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => <li key={`e${i}`} className="hole empty" />)}
      </ol>
      {seed && <span className="sow-seed" aria-hidden="true" style={{ transform: `translate(${seed.x}px, ${seed.y}px)`, transitionDuration: `${Math.round(per * 0.7)}ms` }} />}
    </div>
  );
}

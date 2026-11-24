"use client";
// A faint "?" that explains something in a small bubble (a toggletip):
// - desktop: shows while the mouse is over it; a click keeps it open
// - phone: a tap opens it, another tap (or a tap anywhere else) closes it
// - keyboard: Enter/Space toggles it, Escape closes it and focus stays on the "?"
// The "?" is drawn 20px but its tap area is 44px. The bubble's text follows the button in
// the page, and aria-expanded says whether it's showing.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export default function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false); // opened by a click or tap: hovering away doesn't close it
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) { setOpen(false); setPinned(false); } };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setPinned(false); } };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <span ref={ref} className="info-tip"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpen(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse" && !pinned) setOpen(false); }}>
      <button type="button" className="info-tip-btn" aria-label={label} aria-expanded={open} aria-controls={id}
        onClick={() => { const next = !(open && pinned); setOpen(next); setPinned(next); }}>
        <span aria-hidden="true">?</span>
      </button>
      <span id={id} role="note" className="info-tip-bubble" hidden={!open}>{children}</span>
    </span>
  );
}

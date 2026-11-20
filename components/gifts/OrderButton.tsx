"use client";
import { useState, type MouseEvent } from "react";
import SpecularButton from "@/components/SpecularButton";

// "Order from [Vendor] on WhatsApp". A click asks the server for a ref (recorded with the
// product and vendor only) and opens the vendor's WhatsApp with it. If that fails, WhatsApp
// still opens with the same message minus the ref: a lost ref costs less than a lost order.
// Without JavaScript the link itself is that fallback.
export default function OrderButton({ productId, fallback, label, busyLabel }: { productId: string; fallback: string; label: string; busyLabel: string }) {
  const [busy, setBusy] = useState(false);

  async function order(e: MouseEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    // Open the tab now, inside the click, so pop-up blockers allow it; point it at WhatsApp below.
    const tab = window.open("about:blank", "_blank");
    let url = fallback;
    try {
      const r = await fetch("/api/gift-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
      const j = await r.json();
      if (j?.ok && typeof j.url === "string" && j.url.startsWith("https://wa.me/")) url = j.url;
    } catch { /* fall back to the message without a ref */ }
    if (tab) { tab.opener = null; tab.location.href = url; } else window.location.href = url;
    setBusy(false);
  }

  return (
    <SpecularButton href={fallback} target="_blank" rel="noopener noreferrer" className="btn btn-primary gp-order" onClick={order} aria-busy={busy || undefined}>
      {busy ? busyLabel : label}
    </SpecularButton>
  );
}

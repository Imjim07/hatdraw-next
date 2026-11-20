// Browser-side helpers for the ajo screens (formatting, copying, API calls).
import type { Frequency } from "./types";
import { ajo } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";

export const FREQ_LABEL: Record<Frequency, string> = ajo.freq;

/** "Tue, 1 Dec 2026" (calendar date, no time zone shift). */
export const longDate = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
/** "1 Dec" */
export const shortDate = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });

/** "12 Nov, 4:32pm" in the viewer's time zone. */
export function drawnLabel(iso: string) {
  const t = new Date(iso);
  const day = t.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  const time = t.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s/g, "").toLowerCase();
  return `${day}, ${time}`;
}

export async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select();
    try { return document.execCommand("copy"); } catch { return false; } finally { ta.remove(); }
  }
}

/** Token from the URL fragment (/ajo/x/me#token). Never sent to the server as part of the URL. */
export const fragment = () => (typeof window === "undefined" ? "" : decodeURIComponent(window.location.hash.slice(1)));

export async function api<T>(path: string, body?: object): Promise<{ ok: true } & T | { ok: false; error: string }> {
  try {
    const r = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
    return await r.json();
  } catch {
    return { ok: false, error: common.networkError };
  }
}

/** Server time minus this device's time, so countdowns agree across phones. */
export const clockOffset = (serverNow: string) => Date.parse(serverNow) - Date.now();

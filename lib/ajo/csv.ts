// The payout schedule as a spreadsheet (CSV): one row per turn, in payout order.
// Opens in Excel, Google Sheets and Numbers. Starts with a byte-order mark so Excel reads
// Yoruba tone marks correctly, and uses CRLF line ends.
import { ajo } from "@/lib/copy/ajo";
import type { PublicTurn } from "./types";

/** One CSV cell. Quotes when needed; a leading = + - @ is defused so a name can't run as a formula. */
export function cell(v: string | number): string {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n']/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const weekday = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-NG", { weekday: "long", timeZone: "UTC" });

export function scheduleCsv(turns: PublicTurn[]): string {
  const S = ajo.schedule;
  const rows: (string | number)[][] = [
    S.csvHeader,
    ...turns.map((t) => [t.turn, t.date, weekday(t.date), t.name, t.amount, t.pinned ? S.yes : ""]),
  ];
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** "Ikoyi Wives Monthly" → "Ikoyi-Wives-Monthly" for file names. */
export const fileSafe = (name: string) => name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "ajo";

// The member page's arithmetic, kept pure so it can be tested: the countdown to a
// member's payout, which turn comes next, the schedule preview, the masked email and
// the member's own calendar file. No DOM or Node APIs; dates are Lagos calendar dates
// (YYYY-MM-DD), compared as strings.
import { daysBetween } from "./logic";
import type { PublicTurn } from "./types";

export type Countdown = { kind: "days"; days: number } | { kind: "tomorrow" } | { kind: "today" } | { kind: "past" };

/** How far `date` is from `today`. */
export function countdown(today: string, date: string): Countdown {
  const d = daysBetween(today, date);
  if (d < 0) return { kind: "past" };
  if (d === 0) return { kind: "today" };
  if (d === 1) return { kind: "tomorrow" };
  return { kind: "days", days: d };
}

/** The member's first name, for "Hi Amaka". */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

/**
 * "This turn": the next turn from today that isn't the member's own.
 * mineNext: the member's own turn is the next one. finished: every date has passed.
 */
export function thisTurn(turns: PublicTurn[], me: string, today: string): { turn: PublicTurn | null; mineNext: boolean; finished: boolean } {
  const ahead = turns.filter((t) => t.date >= today);
  if (!ahead.length) return { turn: null, mineNext: false, finished: true };
  if (ahead[0].name === me) return { turn: ahead[0], mineNext: true, finished: false };
  return { turn: ahead[0], mineNext: false, finished: false };
}

/** The next three turns from today, plus the member's own row if it isn't among them. */
export function previewRows(turns: PublicTurn[], me: string, today: string, n = 3): PublicTurn[] {
  const rows = turns.filter((t) => t.date >= today).slice(0, n);
  const mine = turns.find((t) => t.name === me);
  if (mine && !rows.includes(mine)) rows.push(mine);
  return rows.sort((a, b) => a.turn - b.turn);
}

/** "t••••@gmail.com": the first character and the domain. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  return `${email[0]}${"•".repeat(4)}${email.slice(at)}`;
}

/** The most recent confirmed swap that moved this member, if any. */
export function lastSwap(swaps: { a: string; b: string; at: string }[], me: string): { with: string; at: string } | null {
  const mine = swaps.filter((s) => s.a === me || s.b === me);
  const s = mine[mine.length - 1];
  return s ? { with: s.a === me ? s.b : s.a, at: s.at } : null;
}

const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * The member's own payout as an all-day calendar event (made in the browser; nothing
 * is sent anywhere). `uid` should be stable per group and turn so re-adding replaces it.
 */
export function payoutIcs(p: { uid: string; date: string; summary: string; description: string; stamp: string }): string {
  const day = p.date.replace(/-/g, "");
  const next = new Date(Date.parse(p.date + "T00:00:00Z") + 86_400_000).toISOString().slice(0, 10).replace(/-/g, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ajo//member//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${p.uid}`,
    `DTSTAMP:${p.stamp.replace(/[-:]/g, "").replace(/\.\d+/, "")}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${next}`,
    `SUMMARY:${icsText(p.summary)}`,
    `DESCRIPTION:${icsText(p.description)}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

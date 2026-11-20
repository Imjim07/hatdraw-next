// SERVER ONLY. Cron routes accept only: Authorization: Bearer $CRON_SECRET.
// Without CRON_SECRET every request is refused, in production and everywhere else.
import { timingSafeEqual } from "node:crypto";

export function cronAuthorised(req: Request, secret = process.env.CRON_SECRET): boolean {
  if (!secret) return false;
  const a = Buffer.from(`Bearer ${secret}`), b = Buffer.from(req.headers.get("authorization") ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}

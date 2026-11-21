# Kádàrá (Next.js 16)

Fair draws for Secret Santa and ajo, at [kadaradraw.com](https://kadaradraw.com). Every user-facing string lives in `lib/copy.ts` (from `docs/copy-deck.md`); the brand name, contact addresses and prices live in `lib/config.ts`.

Secret Santa draws for friends, families and companies, with encrypted reveal links and weather-aware ambient effects.

## Run it

```bash
npm install
cp .env.example .env.local   # set DRAW_SECRET (openssl rand -base64 32)
npm run dev                  # http://localhost:3000
```

Preview any weather scene: `/?wx=snow|rain|storm|clear-day|clear-night|cloudy|fog|harmattan`

## How it works

| Piece | Where | Notes |
|---|---|---|
| Draw | `app/api/draw/route.ts` + `lib/draw.ts` | Runs on the **server** with `crypto.randomInt`. Enforces the free limit (15 people) and the paywall: Mid circle ₦1,500 (16–50), Big circle ₦7,500 (51–500), or a Year pass. |
| Reveal links | `lib/seal.ts`, `app/api/reveal/route.ts`, `app/r/page.tsx` | Links are `/r#<token>`. The token is AES-256-GCM encrypted, so nobody (organizer included) can read a match from the link. The `#` part never reaches server logs. |
| Weather | `app/api/weather/route.ts`, `lib/weather.ts`, `components/Ambient.tsx` | Reads the visitor's approximate location from the host's headers (Vercel, Netlify or Cloudflare) and gets current weather from MET Norway (free for commercial use, CC BY 4.0, attribution in footer). Falls back to festive snow. "Let it snow" overrides. Harmattan = West Africa + Nov–Mar + humidity < 40%. |
| Rename / prices | `lib/config.ts` | One file. |

The Secret Santa draw needs no database: drafts live in the organiser's browser.

## Ajo payout order

A second kind of draw at `/ajo`: a fair payout order for an ajo (rotating savings group), a public schedule, optional email reminders, swaps and a calendar file. **HatDraw never holds or moves money.**

| Piece | Where |
|---|---|
| Schema (run once in Supabase) | `supabase/migrations/20261112000000_ajo.sql` |
| Pure logic + unit tests | `lib/ajo/logic.ts`, `npm test` |
| Storage (server only, service-role key) | `lib/ajo/store*.ts` |
| API | `app/api/ajo/**`, `app/api/cron/ajo-reminders` |

Links work like the Secret Santa ones: secret tokens in the URL fragment (`#token`), posted to the API. Only SHA-256 hashes of tokens are stored.

**Local development without Supabase:** set `AJO_STORE=memory` (data lives in the server process and vanishes on restart). Never set it in production.

### Daily reminder cron

`GET /api/cron/ajo-reminders` with `Authorization: Bearer $CRON_SECRET`, once a day (07:00 UTC = 08:00 in Lagos works well). It emails opted-in members 3 days before each payout date through Resend's batch send API, records every (group, turn) in `ajo_reminders_sent` so reruns never send twice, and stays within `REMINDER_DAILY_LIMIT` (default 100, Resend's free tier). Turns that don't fit today's budget are sent on the next run.

- **Netlify:** add `netlify/functions/ajo-reminders.mts`:
  ```ts
  export default async () => {
    await fetch(`${process.env.URL}/api/cron/ajo-reminders`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
  };
  export const config = { schedule: "0 7 * * *" };
  ```
- **Vercel:** `vercel.json` already schedules both crons (reminders at 07:00 UTC, cleanup at 02:30 UTC). Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set.
- **Supabase pg_cron + pg_net:**
  ```sql
  select cron.schedule('ajo-reminders', '0 7 * * *', $$
    select net.http_get(url := 'https://YOUR-SITE/api/cron/ajo-reminders',
                        headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'));
  $$);
  ```

Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` (a verified Resend sender; replies go to support), `CRON_SECRET` and `NEXT_PUBLIC_SITE_URL` in the host's environment.

## Deploy

- **Netlify** (free plan allows commercial use) or **Vercel Pro**. Vercel's free Hobby plan is non-commercial only.
- Set `DRAW_SECRET` in the host's environment variables **before** the first real draw, and never change it afterwards.
- Cloudflare: turn on *Managed Transforms → Add visitor location headers* for weather to work.

## Pricing and payments

Prices live in `PRICING` (`lib/config.ts`); `tierFor()` in `lib/pricing.ts` picks the tier. The browser never sets an amount:

1. Shake with more than 15 names → `POST /api/pay/start { kind: "draw", peopleCount }`. The server picks the tier, makes a `KDR-` reference and stores a `payments` row (`pending`), and returns the amount in kobo.
2. Paystack Inline opens with that reference and amount. The email Paystack needs is typed in the paywall and sent only to Paystack.
3. `/api/draw { reference }` checks Paystack (success, NGN, exactly that amount), that the circle fits the tier, and that the reference is unused; works the draw out; then marks the reference `used`. A draw that fails on our side leaves it usable. Names added after paying → the server offers to pay only the difference (`upgradeFrom`).
4. `POST /api/paystack/webhook` (signature: HMAC SHA-512 of `PAYSTACK_SECRET_KEY`) marks payments paid even if the browser closes. Point Paystack's webhook URL at it.

**Year pass** (₦15,000, 12 months, up to 25 draws of up to 500 people): bought the same way (`kind: "pass"`), then `/api/pass/issue` shows the code once (`KDR-XXXX-XXXX-XXXX-XXXX`); only its SHA-256 is stored. The buyer can email it to themselves (`/api/pass/email`; the address is used once and dropped). It's remembered on the phone (`localStorage` key `kdr-pass`). Lost code: `node scripts/reissue-pass.ts <Paystack reference>` prints a new one (same expiry and draws).

Before `NEXT_PUBLIC_PAYWALL_MODE=live`: run the migrations, set `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, add the webhook URL in Paystack, and test in Paystack test mode.

## Known gaps (next steps)

1. **Live Paystack checkout is untested.** It uses the v2 inline script. Test in Paystack test mode before going live.
2. **Fonts** load from Google Fonts via `<link>`. Switch to `next/font/google` for self-hosted fonts and no layout shift.

## Data we keep, and for how long

- **Secret Santa:** nothing. Names, matches, budgets and dates live only in the encrypted links. The draw and reveal routes log no request data (`lib/privacy.test.ts` checks).
- **Paid draws and Year passes:** the reference, what it bought (tier or pass, max people), the amount, the status and times (`payments`); a pass's code hash, expiry and draws used (`year_passes`). Never the payer's email or name. One reference unlocks one draw.
- **Ajo:** groups, member names, amounts, dates and swaps. Emails only for members who opt in on their own page; "Stop reminders" (or switching reminders off) deletes the address. `GET /api/cron/cleanup` (daily, `Authorization: Bearer $CRON_SECRET`) deletes each group 90 days after its last turn, with everything under it.
- **Ajo research (opt-in):** group size, contribution, frequency and creation month, in `ajo_research_stats`, with no link back to the group.
- **Gift orders:** `gift_clicks` holds a ref, the product and the vendor. Nothing about the buyer; the order itself happens on the vendor's WhatsApp.

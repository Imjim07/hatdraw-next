# HatDraw (Next.js 16)

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
| Draw | `app/api/draw/route.ts` + `lib/draw.ts` | Runs on the **server** with `crypto.randomInt`. Enforces the 15-person free limit and the paywall. |
| Reveal links | `lib/seal.ts`, `app/api/reveal/route.ts`, `app/r/page.tsx` | Links are `/r#<token>`. The token is AES-256-GCM encrypted, so nobody (organizer included) can read a match from the link. The `#` part never reaches server logs. |
| Weather | `app/api/weather/route.ts`, `lib/weather.ts`, `components/Ambient.tsx` | Reads the visitor's approximate location from the host's headers (Vercel, Netlify or Cloudflare) and gets current weather from MET Norway (free for commercial use, CC BY 4.0, attribution in footer). Falls back to festive snow. "Let it snow" overrides. Harmattan = West Africa + Nov–Mar + humidity < 40%. |
| Rename / prices | `lib/config.ts` | One file. |

No database yet. Drafts live in the organizer's browser.

## Deploy

- **Netlify** (free plan allows commercial use) or **Vercel Pro**. Vercel's free Hobby plan is non-commercial only.
- Set `DRAW_SECRET` in the host's environment variables **before** the first real draw, and never change it afterwards.
- Cloudflare: turn on *Managed Transforms → Add visitor location headers* for weather to work.

## Known gaps (next steps)

1. **Paystack reference reuse.** `lib/paystack.ts` verifies a payment, but without a database one reference could unlock several draws. Add a `payments` table (Supabase) and mark references as used.
2. **Live Paystack checkout is untested.** It uses the v2 inline script. Test in Paystack test mode before setting `NEXT_PUBLIC_PAYWALL_MODE=live`.
3. **Fonts** load from Google Fonts via `<link>`. Switch to `next/font/google` for self-hosted fonts and no layout shift.
4. Yearly plan, resolutions and email (Resend) need accounts: Supabase auth + tables.

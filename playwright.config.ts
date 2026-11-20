import { defineConfig } from "@playwright/test";

// End-to-end tests for the ajo payout-order draw. They run against a production
// build with the in-memory store (AJO_STORE=memory), so no Supabase or Resend
// account is needed: emails go to an in-process outbox and the server clock can
// be moved with the x-ajo-now header (honoured only by the memory store).
// One worker: the reminder cron is global, so tests must not overlap.
const PORT = 3210;
const EMPTY_PORT = 3213; // e2e/gifts.spec.ts uses this port for the empty catalogue
const ENV = {
  AJO_STORE: "memory", CRON_SECRET: "e2e-cron-secret", DRAW_SECRET: "e2e-only-draw-secret",
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`, NEXT_PUBLIC_KADARA_WHATSAPP: "10000000009", LEGAL_REVIEWED: "false",
  // Hermetic: blank anything .env.local might set, so the in-memory stores and outbox are used.
  SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "", SUPABASE_ANON_KEY: "", RESEND_API_KEY: "", PAYSTACK_SECRET_KEY: "", NEXT_PUBLIC_PAYWALL_MODE: "demo",
};
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, channel: "chrome", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: "desktop-reduced", use: { viewport: { width: 1440, height: 900 }, contextOptions: { reducedMotion: "reduce" } } },
    { name: "phone-reduced", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, contextOptions: { reducedMotion: "reduce" } } },
  ],
  // Two servers from one build: the main one (sample gift catalogue, GIFTS_STORE=memory),
  // then a second with no gifts at all for the Gift Finder's empty state. They start in order.
  webServer: [
    {
      command: `npm run build && npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/ajo`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: { ...ENV, GIFTS_STORE: "memory" },
    },
    {
      command: `npx next start -p ${EMPTY_PORT}`,
      url: `http://localhost:${EMPTY_PORT}/gifts/policy`,
      timeout: 60_000,
      reuseExistingServer: false,
      env: { ...ENV, GIFTS_STORE: "empty" },
    },
  ],
});

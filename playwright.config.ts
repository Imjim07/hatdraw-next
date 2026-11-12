import { defineConfig } from "@playwright/test";

// End-to-end tests for the ajo payout-order draw. They run against a production
// build with the in-memory store (AJO_STORE=memory), so no Supabase or Resend
// account is needed: emails go to an in-process outbox and the server clock can
// be moved with the x-ajo-now header (honoured only by the memory store).
// One worker: the reminder cron is global, so tests must not overlap.
const PORT = 3210;
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
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/ajo`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: { AJO_STORE: "memory", CRON_SECRET: "e2e-cron-secret", DRAW_SECRET: "e2e-only-draw-secret", NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
  },
});

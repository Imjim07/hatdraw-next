import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";

// Ajo payout-order draw, end to end. See playwright.config.ts for the setup.
const CRON = { Authorization: "Bearer e2e-cron-secret" };
const MEMBERS = ["Tolu", "Ada", "Chidi", "Bisi", "Kemi", "Dayo", "Ngozi", "Emeka"];

/** Nigeria's date plus `days`, as YYYY-MM-DD. */
function lagosDate(days: number) {
  const t = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const d = new Date(t + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type Created = { publicId: string; adminToken: string; members: { name: string; token: string }[] };
async function createGroup(request: APIRequestContext, over: Partial<{ name: string; members: string[]; startDate: string; pins: { name: string; turn: number }[] }> = {}): Promise<Created> {
  const res = await request.post("/api/ajo/groups", {
    data: { name: "Test ajo", amount: 20000, frequency: "monthly", startDate: lagosDate(3), members: MEMBERS, pins: [], ...over },
  });
  expect(res.status()).toBe(201);
  return res.json();
}
const tokenOf = (c: Created, name: string) => c.members.find((m) => m.name === name)!.token;
const scheduleNames = (page: Page) => page.locator(".sched-row .sched-who b").allTextContents();

async function shot(page: Page, name: string) {
  await page.waitForTimeout(600); // let the panel's rise-in finish
  await page.screenshot({ path: `e2e/screens/${test.info().project.name}/${name}.png`, fullPage: true });
}

test("instant draw with pins, redraw within the window, refused after it", async ({ page, request }) => {
  await page.goto("/draw");
  await page.getByRole("link", { name: /ajo payout order/i }).click();
  await page.waitForURL("**/ajo");

  // Setup wizard
  await page.locator("#aj-name").fill("Ikoyi Wives Monthly");
  await page.locator("#aj-amount").fill("20000");
  // the date field is segmented (day / month / year): type into it
  const [yy, mm, dd] = lagosDate(10).split("-");
  await page.getByRole("group", { name: "First payout date" }).getByRole("spinbutton").first().click();
  await page.keyboard.type(dd + mm + yy);
  await page.getByRole("radio", { name: "Monthly" }).click();
  await expect(page.getByText("Each turn pays ₦20,000")).toBeVisible();
  await shot(page, "01-setup");
  await page.getByRole("button", { name: /next: members/i }).click();
  const box = page.getByRole("textbox", { name: "Member name" });
  await box.fill(MEMBERS.join(", "));
  await box.press("Enter");
  await expect(page.getByText("Each turn pays ₦160,000")).toBeVisible();
  await page.getByRole("button", { name: /next: agreed turns/i }).click();
  // The member picker starts on "None": nothing to pin, so the turn and Pin wait.
  const member = page.getByRole("button", { name: /Member$/ }), turn = page.getByRole("button", { name: /Turn$/ });
  const pin = page.getByRole("button", { name: "Pin", exact: true });
  await expect(member).toContainText("None");
  await expect(pin).toBeDisabled();
  await expect(turn).toBeDisabled();
  const choose = async (picker: Locator, option: string | RegExp) => {
    await picker.click();
    await page.getByRole("option", { name: option }).click();
  };
  await choose(member, "Chidi");
  await expect(pin).toBeEnabled();
  await choose(member, "None"); // changing your mind: back to nobody
  await expect(pin).toBeDisabled();
  await choose(member, "Chidi");
  await choose(turn, /^Turn 3\b/);
  await pin.click();
  await expect(member).toContainText("None"); // back to "None" after each pin
  await choose(member, "Kemi");
  await choose(turn, /^Turn 1\b/);
  await pin.click();
  await page.getByRole("button", { name: /next: review/i }).click();
  await expect(page.getByText(/never holds or moves your money/)).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /for research/i })).not.toBeChecked(); // research consent is off by default

  const createdP = page.waitForResponse((r) => r.url().endsWith("/api/ajo/groups") && r.request().method() === "POST");
  await page.getByRole("button", { name: /create group/i }).click();
  const created: Created = await (await createdP).json();
  await expect(page.getByText("Your group is ready")).toBeVisible();
  await expect(page.locator(".res-row .who")).toHaveCount(8);
  await shot(page, "02-handoff");

  // Admin: draw now
  await page.getByRole("link", { name: /open organiser page/i }).click();
  await page.getByRole("button", { name: "Draw now" }).waitFor();
  await shot(page, "03-admin");
  await page.getByRole("button", { name: "Draw now" }).click();
  if (!test.info().project.name.includes("reduced")) {
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `e2e/screens/${test.info().project.name}/04-sowing.png`, fullPage: true });
  }
  await page.locator(".sched").waitFor({ timeout: 10_000 });
  let names = await scheduleNames(page);
  expect(names).toHaveLength(8);
  expect(names[0]).toBe("Kemi"); // pinned to turn 1
  expect(names[2]).toBe("Chidi"); // pinned to turn 3
  await expect(page.locator(".sched-row").nth(0)).toContainText("Agreed before the draw");

  // Redraw inside the 10-minute window
  await page.getByRole("button", { name: /^Redraw \(/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Redraw", exact: true }).click();
  // The new order sows in, then the schedule (with its "redrawn once" line) replaces it.
  await expect(page.getByText(/redrawn once/)).toBeVisible({ timeout: 10_000 });
  names = await scheduleNames(page);
  expect([names[0], names[2]]).toEqual(["Kemi", "Chidi"]);

  await page.goto(`/ajo/${created.publicId}`);
  await expect(page.getByText(/redrawn once/)).toBeVisible();
  await shot(page, "05-public");

  // 11 minutes later (server clock moved for the test): no more redraws
  const later = new Date(Date.now() + 11 * 60_000).toISOString();
  const res = await request.post(`/api/ajo/groups/${created.publicId}/redraw`, { data: { token: created.adminToken }, headers: { "x-ajo-now": later } });
  expect(res.status()).toBe(409);
  expect((await res.json()).error).toMatch(/window has closed/);
  await page.route("**/api/ajo/**", (route) => route.continue({ headers: { ...route.request().headers(), "x-ajo-now": later } }));
  await page.goto(`/ajo/${created.publicId}/admin#${created.adminToken}`);
  await expect(page.getByText("The redraw window has closed. This order is final.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Redraw \(/ })).toHaveCount(0);
});

test("live draw: no order before the reveal, the same order for everyone after", async ({ browser, request }) => {
  const c = await createGroup(request, { name: "Live ajo", members: ["A1", "B2", "C3", "D4", "E5"] });
  const viewers = await Promise.all([browser.newContext(), browser.newContext()]);
  const pages = await Promise.all(viewers.map((v) => v.newPage()));
  await Promise.all(pages.map((p) => p.goto(`/ajo/${c.publicId}`)));

  const res = await request.post(`/api/ajo/groups/${c.publicId}/draw`, { data: { token: c.adminToken, mode: "live", startInSeconds: 10 } });
  expect(res.status()).toBe(200);
  const before = await (await request.get(`/api/ajo/groups/${c.publicId}`)).json();
  expect(before.group.turns).toBeNull();
  expect(before.group.liveRevealAt).toBeTruthy();

  await Promise.all(pages.map((p) => p.reload()));
  for (const p of pages) {
    await expect(p.getByRole("timer")).toBeVisible();
    await expect(p.locator(".sched")).toHaveCount(0);
  }
  await Promise.all(pages.map((p) => p.locator(".sched").waitFor({ timeout: 30_000 })));
  const [a, b] = await Promise.all(pages.map(scheduleNames));
  expect(a).toHaveLength(5);
  expect(a).toEqual(b);
  await expect(pages[0].getByText(/Order locked/)).toBeVisible();
  await expect(pages[0].getByText(/never redrawn/)).toBeVisible();
  // Live draws can't be redrawn
  expect((await request.post(`/api/ajo/groups/${c.publicId}/redraw`, { data: { token: c.adminToken } })).status()).toBe(409);
  await Promise.all(viewers.map((v) => v.close()));
});

test("reminders: one email for a turn 3 days away, none on a rerun", async ({ page, request }) => {
  const c = await createGroup(request, { name: "Reminder ajo", members: ["Rita", "Sola", "Uche"], startDate: lagosDate(3) });
  await request.post(`/api/ajo/groups/${c.publicId}/draw`, { data: { token: c.adminToken, mode: "instant" } });
  expect((await request.get("/api/cron/ajo-reminders")).status()).toBe(401); // the cron needs CRON_SECRET

  await page.goto(`/ajo/${c.publicId}/me#${tokenOf(c, "Sola")}`);
  await page.locator("#me-email").fill("sola@example.com");
  await page.getByText("Remind me by email", { exact: true }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved. We'll remind you 3 days before.")).toBeVisible();

  const first = await (await request.get("/api/cron/ajo-reminders", { headers: CRON })).json();
  expect(first.sent).toBe(1);
  const rerun = await (await request.get("/api/cron/ajo-reminders", { headers: CRON })).json();
  expect(rerun.sent).toBe(0);
});

test("swaps: both confirm to swap; a decline changes nothing", async ({ page, request }) => {
  const c = await createGroup(request, { name: "Swap ajo", members: ["Amaka", "Bayo", "Chika", "Dami"] });
  await request.post(`/api/ajo/groups/${c.publicId}/draw`, { data: { token: c.adminToken, mode: "instant" } });
  const order = async () => (await (await request.get(`/api/ajo/groups/${c.publicId}`)).json()).group.turns.map((t: { name: string }) => t.name) as string[];
  const start = await order();

  // Amaka asks Bayo; Bayo confirms from his own link.
  await page.goto(`/ajo/${c.publicId}/me#${tokenOf(c, "Amaka")}`);
  const ask = async (name: string) => {
    await page.getByRole("button", { name: /Swap with/ }).click();
    await page.getByRole("option", { name }).click();
    await page.getByRole("button", { name: "Ask to swap" }).click();
    await expect(page.getByText(`Swap your turn with ${name}?`)).toBeVisible(); // asked first, in the page
    await expect(page.getByRole("button", { name: "Send request" })).toBeFocused();
    await page.getByRole("button", { name: "Send request" }).click();
  };
  await ask("Bayo");
  await expect(page.getByText("Swap request sent to Bayo. Nothing changes until they agree.").first()).toBeVisible();
  await shot(page, "06-member");
  await page.goto(`/ajo/${c.publicId}/me#${tokenOf(c, "Bayo")}`);
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByText(/^Done\. You now collect on /)).toBeVisible();

  const swapped = await order();
  const ia = start.indexOf("Amaka"), ib = start.indexOf("Bayo");
  expect(swapped[ia]).toBe("Bayo");
  expect(swapped[ib]).toBe("Amaka");
  await page.goto(`/ajo/${c.publicId}`);
  await expect(page.getByText(/Amaka ↔ Bayo swapped turns/)).toBeVisible();

  // Chika asks Dami; Dami declines: nothing moves.
  await page.goto(`/ajo/${c.publicId}/me#${tokenOf(c, "Chika")}`);
  await page.getByRole("button", { name: /Swap with/ }).click();
  await page.getByRole("option", { name: "Dami" }).click();
  await page.getByRole("button", { name: "Ask to swap" }).click();
  await page.getByRole("button", { name: "Cancel" }).click(); // changing your mind sends nothing
  expect(await order()).toEqual(swapped);
  await ask("Dami");
  await expect(page.getByText("Swap request sent to Dami. Nothing changes until they agree.").first()).toBeVisible();
  await page.goto(`/ajo/${c.publicId}/me#${tokenOf(c, "Dami")}`);
  await page.getByRole("button", { name: "Decline" }).click();
  await expect(page.getByText("Swap declined")).toBeVisible();
  expect(await order()).toEqual(swapped);
});

test("calendar.ics has one event per turn", async ({ request }) => {
  const c = await createGroup(request, { name: "Calendar ajo" });
  expect((await request.get(`/api/ajo/groups/${c.publicId}/calendar.ics`)).status()).toBe(409); // not drawn yet
  await request.post(`/api/ajo/groups/${c.publicId}/draw`, { data: { token: c.adminToken, mode: "instant" } });
  const res = await request.get(`/api/ajo/groups/${c.publicId}/calendar.ics`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/calendar");
  const ics = await res.text();
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(MEMBERS.length);
  expect(ics).toMatch(/SUMMARY:Turn 1: \S+ collects ₦160\\,000/);
});

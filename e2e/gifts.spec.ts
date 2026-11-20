import { expect, test, type Locator, type Page } from "@playwright/test";

// Landing offers section, Gift Finder and the reveal page's gift link, end to end.
// The main server shows the six [Sample] products (GIFTS_STORE=memory); the one on
// EMPTY has no products at all. See playwright.config.ts.
const EMPTY = "http://localhost:3213";

async function shot(page: Page, name: string, target?: Locator) {
  await page.waitForTimeout(400);
  const path = `e2e/screens/${test.info().project.name}/${name}.png`;
  if (target) await target.screenshot({ path });
  else await page.screenshot({ path, fullPage: true });
}

/** On phones the filter panel folds behind a "Filters" button; open it if it's closed. */
async function openFilters(page: Page) {
  const toggle = page.getByRole("main").getByRole("button", { name: /^Filters/ });
  if (await toggle.isVisible() && (await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
}

/** Scrolls `el` to the middle of the screen. The landing page scrolls through GSAP
 *  ScrollSmoother, which Playwright's own scroll-into-view doesn't move. */
async function bringIntoView(page: Page, el: Locator) {
  await el.evaluate((n) => window.scrollTo(0, n.getBoundingClientRect().top + window.scrollY - innerHeight / 2));
  await page.waitForTimeout(1500);
}

test("landing: four offers, the giveaway picker isn't clickable, the other three links work", async ({ page }) => {
  await page.goto("/");
  const offers = page.locator("#features");
  const cards = offers.locator(".of-card");
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(0)).toHaveClass(/of-santa/);
  await expect(cards.nth(1)).toHaveClass(/of-ajo/);

  const giveaway = cards.filter({ hasText: "Giveaway picker" });
  await expect(giveaway).toContainText("Coming soon");
  await expect(giveaway).toHaveAttribute("aria-disabled", "true");
  await expect(giveaway.locator("a, button, [role=link], [role=button], [tabindex]")).toHaveCount(0);

  await bringIntoView(page, offers);
  await shot(page, "offers", offers);

  for (const [name, path] of [["Start a Secret Santa", "/draw"], ["Draw an ajo order", "/ajo"], ["Find a gift", "/gifts"]] as const) {
    await page.goto("/");
    const link = page.locator("#features").getByRole("link", { name });
    await bringIntoView(page, link);
    await link.click();
    await page.waitForURL(`**${path}`);
  }
});

test("gifts: budget and for-whom filters go in the URL and survive a reload", async ({ page }) => {
  await page.goto("/gifts");
  await expect(page.locator("main .gf-card")).toHaveCount(6);

  const filters = page.getByRole("main").getByRole("complementary", { name: "Filters" });
  await openFilters(page);
  await expect(filters.getByRole("radio", { name: /^₦10–25k\W+3 gifts$/ })).toBeVisible();
  await filters.getByRole("radio", { name: /^₦10–25k/ }).click();
  await page.waitForURL(/\/gifts\?min=10000&max=25000$/);
  await openFilters(page);
  await filters.getByRole("radio", { name: /^Her/ }).click();
  await page.waitForURL(/\/gifts\?min=10000&max=25000&for=her$/);

  const names = ["[Sample] Shea butter gift set", "[Sample] Adire scarf", "[Sample] Small chops party box"];
  await expect(page.locator("main .gf-card .gf-name")).toHaveText(names);

  await page.reload();
  await expect(page.locator("main .gf-card .gf-name")).toHaveText(names);
  await openFilters(page);
  await expect(filters.getByRole("radio", { name: /^₦10–25k/ })).toBeChecked();
  await expect(filters.getByRole("radio", { name: /^Her/ })).toBeChecked();
  await shot(page, "gifts-filtered");
});

test("gifts: pick several categories and sort by price", async ({ page }) => {
  await page.goto("/gifts");
  const filters = page.getByRole("main").getByRole("complementary", { name: "Filters" });
  await openFilters(page);
  await filters.getByRole("checkbox", { name: /^Home/ }).click();
  await page.waitForURL(/\/gifts\?cat=home$/);
  await openFilters(page);
  await filters.getByRole("checkbox", { name: /^Fashion/ }).click();
  await page.waitForURL(/\/gifts\?cat=home%2Cfashion$/);
  await expect(page.locator("main .gf-card .gf-name")).toHaveText(["[Sample] Scented candle", "[Sample] Adire scarf"]);

  await page.getByRole("main").getByLabel("Sort by").selectOption("price-desc");
  await page.waitForURL(/\/gifts\?cat=home%2Cfashion&sort=price-desc$/);
  await expect(page.locator("main .gf-card .gf-name")).toHaveText(["[Sample] Adire scarf", "[Sample] Scented candle"]);

  await openFilters(page);
  await filters.getByRole("link", { name: "Clear all" }).click();
  await page.waitForURL(/\/gifts\?sort=price-desc$/);
  await expect(page.locator("main .gf-card")).toHaveCount(6);
  await shot(page, "gifts-catalogue");
});

test("gifts: compare up to four side by side", async ({ page }) => {
  await page.goto("/gifts");
  await page.getByRole("main").getByRole("link", { name: "Compare [Sample] Scented candle" }).click();
  await page.waitForURL(/compare=sample-scented-candle$/);
  await page.getByRole("main").getByRole("link", { name: "Compare [Sample] Adire scarf" }).click();
  await page.waitForURL(/compare=sample-scented-candle%2Csample-adire-scarf$/);
  const table = page.getByRole("main").getByRole("table");
  await expect(table.getByRole("columnheader")).toHaveText(["[Sample] Scented candle", "[Sample] Adire scarf"]);
  await expect(table.getByRole("row", { name: /Price/ })).toContainText("Lowest price");
  await shot(page, "gifts-compare", page.locator("main .gf-compare"));
});

test("gifts: the empty state widens the budget, and an empty catalogue says so", async ({ page }) => {
  await page.goto("/gifts?max=5000");
  await expect(page.locator("main .gf-empty")).toContainText("Nothing under ₦5,000 yet. Try a higher budget.");
  await shot(page, "gifts-empty-budget");
  await page.getByRole("main").getByRole("link", { name: "Show gifts under ₦10,000" }).click();
  await page.waitForURL(/\/gifts\?max=10000$/);
  await expect(page.locator("main .gf-card .gf-name")).toHaveText(["[Sample] Scented candle"]);

  await page.goto(`${EMPTY}/gifts`);
  await expect(page.locator("main .gf-card")).toHaveCount(0);
  await expect(page.locator("main .gf-empty")).toContainText("No gifts here yet.");
  await shot(page, "gifts-empty");
});

test("product page: order opens the vendor's WhatsApp with a CDR- ref; out of stock can't be ordered", async ({ page, context }) => {
  // Don't load WhatsApp itself: record where the tab goes.
  await context.route(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//, (r) => r.fulfill({ body: "whatsapp" }));
  await page.goto("/gifts/sample-adire-scarf");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("[Sample] Adire scarf");
  await expect(page.getByRole("main").getByText("Checked by", { exact: false })).toBeVisible(); // this vendor is verified
  await expect(page.getByRole("main").getByText("Sample vendor. Not a real refund policy.")).toBeVisible();
  const order = page.getByRole("main").getByRole("link", { name: "Order from [Sample] Ada's Candles on WhatsApp" });
  // Without JavaScript the link itself goes to the vendor, with the message but no ref.
  const fallback = new URL((await order.getAttribute("href"))!);
  expect(fallback.origin + fallback.pathname).toBe("https://wa.me/10000000001");
  expect(fallback.searchParams.get("text")).not.toContain("Ref:");
  await expect(page.getByRole("main").getByText(/You'll confirm the price, delivery fee and date with \[Sample\] Ada's Candles before you pay\./)).toBeVisible();
  await shot(page, "gift-page");

  const popupP = page.waitForEvent("popup");
  await order.click();
  const popup = await popupP;
  await popup.waitForURL(/^https:\/\/wa\.me\//);
  const url = new URL(popup.url());
  expect(url.pathname).toBe("/10000000001");
  expect(url.searchParams.get("text")).toMatch(/^Hi \[Sample\] Ada's Candles, I found your \[Sample\] Adire scarf \(₦18,500\) on .+ and I'd like to order\. Ref: CDR-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  await popup.close();

  await page.getByRole("link", { name: "How buying works" }).click();
  await page.waitForURL("**/gifts/policy");
  for (const h of ["Who sells", "Payment", "Delivery", "Refunds", "Report a vendor"]) await expect(page.getByRole("heading", { name: h })).toBeVisible();

  await page.goto("/gifts/sample-dinner-for-two"); // an unchecked vendor: no badge
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("[Sample] Dinner for two");
  await expect(page.getByRole("main").getByText("Checked by", { exact: false })).toHaveCount(0);

  await page.goto("/gifts/sample-wireless-earbuds");
  await expect(page.getByRole("main").getByRole("button", { name: "Out of stock" })).toBeDisabled();
  await expect(page.getByRole("link", { name: /Order from .* on WhatsApp/ })).toHaveCount(0);
});

test("vendors, buying policy, privacy and terms render and are in the footer", async ({ page }) => {
  for (const [path, h1] of [["/vendors", "Sell your gifts where Nigerians plan their gifting"], ["/gifts/policy", "Buying policy"], ["/privacy", "Privacy"], ["/terms", "Terms"]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
  }
  for (const path of ["/privacy", "/terms"]) {
    await page.goto(path);
    await expect(page.getByText("Draft, pending legal review")).toBeVisible(); // LEGAL_REVIEWED=false
  }
  await page.goto("/vendors");
  const apply = page.getByRole("link", { name: "Apply to list" });
  const u = new URL((await apply.getAttribute("href"))!);
  expect(u.origin + u.pathname).toBe("https://wa.me/10000000009");
  expect(u.searchParams.get("text")).toMatch(/^Hi, I'd like to sell on .+\. Business name:/);
  await expect(page.getByRole("link", { name: "Prefer email?" })).toHaveAttribute("href", /^mailto:sales@kadaradraw\.com\?subject=/);

  await page.goto("/");
  for (const path of ["/vendors", "/gifts/policy", "/privacy", "/terms"]) {
    await expect(page.locator(`footer a[href="${path}"], .sf-top a[href="${path}"]`).first()).toBeAttached();
  }
});

test("reveal: gift link carries only the budget, never a name", async ({ page, request }) => {
  const people = ["Adaeze", "Bolu", "Chinedu"];
  const res = await request.post("/api/draw", {
    data: { event: { name: "Office party", kind: "company", budget: "15000", date: "", where: "", note: "" }, people, ex: [], circle: true, blind: false },
  });
  const { givers } = await res.json();
  await page.goto(`/r#${givers[0].token}`);
  const cloth = page.locator("button.cloth");
  for (let i = 0; i < 3; i++) { await cloth.click(); await page.waitForTimeout(250); }

  const link = page.getByRole("link", { name: "See gifts under ₦15,000" });
  await expect(link).toHaveAttribute("href", "/gifts?max=15000");
  const href = (await link.getAttribute("href"))!.toLowerCase();
  for (const n of people) expect(href).not.toContain(n.toLowerCase());

  await link.click();
  await page.waitForURL(/\/gifts\?max=15000$/);
  expect(page.url().toLowerCase()).not.toMatch(/adaeze|bolu|chinedu/);
  await openFilters(page);
  await expect(page.getByRole("main").getByRole("radio", { name: "Under ₦15,000" })).toBeChecked();
});

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

/** Scrolls `el` to the middle of the screen. The landing page scrolls through GSAP
 *  ScrollSmoother, which Playwright's own scroll-into-view doesn't move. */
async function bringIntoView(page: Page, el: Locator) {
  await el.evaluate((n) => window.scrollTo(0, n.getBoundingClientRect().top + window.scrollY - innerHeight / 2));
  await page.waitForTimeout(1500);
}

test("landing: four offers, the giveaway picker isn't clickable, the other three links work", async ({ page }) => {
  await page.goto("/");
  const offers = page.locator("#offers");
  const cards = offers.locator(".of-card");
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(0)).toHaveAttribute("data-mode", "santa");
  await expect(cards.nth(1)).toHaveAttribute("data-mode", "ajo");

  const giveaway = cards.filter({ hasText: "Giveaway picker" });
  await expect(giveaway).toContainText("Coming soon");
  await expect(giveaway.locator("a, button, [role=link], [role=button], [tabindex]")).toHaveCount(0);

  await bringIntoView(page, offers);
  await shot(page, "offers", offers);

  for (const [name, path] of [["Start a gift exchange", "/draw"], ["Draw a payout order", "/ajo"], ["Find a gift", "/gifts"]] as const) {
    await page.goto("/");
    const link = page.locator("#offers").getByRole("link", { name });
    await bringIntoView(page, link);
    await link.click();
    await page.waitForURL(`**${path}`);
  }
});

test("gifts: budget and for-whom filters go in the URL and survive a reload", async ({ page }) => {
  await page.goto("/gifts");
  await expect(page.locator("main .gf-card")).toHaveCount(6);

  await page.getByRole("main").getByRole("navigation", { name: "Budget" }).getByRole("link", { name: "₦10–25k" }).click();
  await page.waitForURL(/\/gifts\?min=10000&max=25000$/);
  await page.getByRole("main").getByLabel("For").selectOption("her");
  await page.waitForURL(/\/gifts\?min=10000&max=25000&for=her$/);

  const names = ["[Sample] Shea butter gift set", "[Sample] Adire scarf", "[Sample] Small chops party box"];
  await expect(page.locator("main .gf-card .gf-name")).toHaveText(names);

  await page.reload();
  await expect(page.locator("main .gf-card .gf-name")).toHaveText(names);
  await expect(page.getByRole("main").getByRole("link", { name: "₦10–25k" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("main").getByLabel("For")).toHaveValue("her");
  await shot(page, "gifts-filtered");
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

test("product page: order opens WhatsApp with the name and price; out of stock can't be ordered", async ({ page }) => {
  await page.goto("/gifts/sample-adire-scarf");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("[Sample] Adire scarf");
  const order = page.getByRole("main").getByRole("link", { name: "Order on WhatsApp" });
  const href = (await order.getAttribute("href"))!;
  const url = new URL(href);
  expect(url.origin + url.pathname).toBe("https://wa.me/2348000000000");
  expect(url.searchParams.get("text")).toContain("[Sample] Adire scarf (₦18,500)");
  expect(url.searchParams.get("text")).toContain("/gifts/sample-adire-scarf");
  await expect(page.getByRole("main").getByText("We'll confirm price, delivery fee and delivery date on WhatsApp before you pay.")).toBeVisible();
  await shot(page, "gift-page");

  await page.getByRole("link", { name: /policy/ }).click();
  await page.waitForURL("**/gifts/policy");
  await expect(page.getByRole("main").getByText("[OWNER TO WRITE]")).toHaveCount(4);

  await page.goto("/gifts/sample-wireless-earbuds");
  await expect(page.getByRole("main").getByRole("button", { name: "Out of stock" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Order on WhatsApp" })).toHaveCount(0);
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
  await expect(page.getByRole("main").getByRole("navigation", { name: "Budget" }).locator("[aria-current]")).toHaveText("Under ₦15,000");
});

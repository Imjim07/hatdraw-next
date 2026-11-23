// Downloads the "Who it's for" placeholder photos from Unsplash and saves them, resized,
// in public/use-cases/. Run: node scripts/fetch-use-case-images.mjs
//
// Every photo was checked as "Free to use under the Unsplash License" (never Unsplash+);
// ids, photographers and pages are in public/use-cases/CREDITS.md. Change both together.
//
// Unsplash answers scripts (and its /download link) with a browser check, so this opens
// each photo's page in a real Chrome window (Playwright, already a dev dependency), reads
// the photo's address on images.unsplash.com from the page, and fetches it at 2000 px.
// sharp (bundled with Next) then crops each to a 4:3 cover, 1600 px wide, JPEG quality 72.
// A file over 150 KB gets a lower quality, down to 56; if a busy photo (a market, a
// carnival) is still over, its fine grain is softened (0.6 px, unseen under the panel's
// dark gradient) and the quality tried again from 68.
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const PHOTOS = [
  { file: "offices.jpg", id: "bD3DiLuuOPM" },
  { file: "churches.jpg", id: "8__esxuic9Q" },
  { file: "ajo.jpg", id: "ME416b6sp2I" },
  { file: "planners.jpg", id: "1h9Zq6SS4O0" },
  { file: "vendors.jpg", id: "_ooDzeJjIEg" },
  { file: "gamers.jpg", id: "zpI3Es5q_hQ" },
];
const OUT = new URL("../public/use-cases/", import.meta.url);
const W = 1600, H = 1200, MAX_BYTES = 150 * 1024;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: false });
const ctx = await browser.newContext();
const page = await ctx.newPage();

try {
  for (const { file, id } of PHOTOS) {
    await page.goto(`https://unsplash.com/photos/${id}`, { waitUntil: "domcontentloaded" });
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content", { timeout: 20000 });
    if (!og?.startsWith("https://images.unsplash.com/photo-")) throw new Error(`${id}: no photo address on the page`);
    const src = new URL(og);
    src.search = "";
    for (const [k, v] of [["w", "2000"], ["q", "90"], ["fm", "jpg"], ["fit", "max"]]) src.searchParams.set(k, v);
    // Slow connections: a long timeout, and one more try.
    const get = () => ctx.request.get(src.href, { timeout: 120_000 });
    const res = await get().catch(get);
    const type = res.headers()["content-type"] ?? "";
    if (!res.ok() || !type.startsWith("image/")) throw new Error(`${id}: got ${res.status()} ${type}`);
    const source = await res.body();
    const tries = [72, 68, 64, 60, 56].map((q) => ({ q, soft: false }))
      .concat([68, 64, 60, 56, 52, 48].map((q) => ({ q, soft: true })));
    let out, used;
    for (used of tries) {
      let img = sharp(source).rotate().resize(W, H, { fit: "cover", position: "attention" });
      if (used.soft) img = img.blur(0.6);
      out = await img.jpeg({ quality: used.q, mozjpeg: true }).toBuffer();
      if (out.length <= MAX_BYTES) break;
    }
    if (out.length > MAX_BYTES) throw new Error(`${file}: still ${(out.length / 1024).toFixed(0)} KB`);
    await writeFile(new URL(file, OUT), out);
    console.log(`${file}  ${id}  ${(out.length / 1024).toFixed(0)} KB  q${used.q}${used.soft ? " softened" : ""}`);
  }
} finally {
  await browser.close();
}

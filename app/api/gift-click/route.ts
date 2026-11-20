import { findForOrder, recordClick } from "@/lib/gifts/store";
import { newRef } from "@/lib/gifts/ref";
import { orderUrl, validWhatsApp } from "@/lib/gifts/order";
import { common } from "@/lib/copy/common";
import { gifts } from "@/lib/copy/gifts";

// The order button: { productId } → a ref (CDR-XXXXXX) recorded in gift_clicks with the
// product and vendor only (no buyer data of any kind), and the vendor's wa.me link with
// the message and ref typed in. If this fails, the page still opens WhatsApp without a ref.
const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  let productId = "";
  try { productId = String((await req.json())?.productId ?? "").slice(0, 80); } catch { return json({ ok: false, error: common.invalidRequest }, 400); }
  try {
    const p = await findForOrder(productId);
    if (!p || !p.inStock || !validWhatsApp(p.vendor.whatsapp)) return json({ ok: false, error: gifts.errors.unavailable }, 404);
    for (let tries = 0; tries < 5; tries++) {
      const ref = newRef();
      if (await recordClick({ ref, product_id: p.id, vendor_id: p.vendor.id })) {
        return json({ ok: true, ref, url: orderUrl(p, ref) });
      }
    }
    throw new Error("ref_collisions");
  } catch (e) {
    console.error("[gifts] click_failed", e instanceof Error ? e.message : ""); // a short code only
    return json({ ok: false, error: common.somethingWrong }, 500);
  }
}

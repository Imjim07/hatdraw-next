import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdireLoader from "@/components/AdireLoader";
import SpecularButton from "@/components/SpecularButton";
import GiftImage from "@/components/gifts/GiftImage";
import { naira } from "@/lib/config";
import { getGift } from "@/lib/gifts/store";
import { orderUrl, storeNumber } from "@/lib/gifts/order";
import { CATEGORY_LABEL, FOR_WHOM_LABEL, areaName } from "@/lib/gifts/types";

// One gift. Ordering opens WhatsApp with the product and price typed in; nothing is
// paid on the site. Params are runtime data (Cache Components), so they're read under Suspense.
export default function GiftPage({ params }: PageProps<"/gifts/[slug]">) {
  return (
    <Suspense fallback={<div className="store-loading"><AdireLoader label="Opening gift" /></div>}>
      <Gift params={params} />
    </Suspense>
  );
}

async function Gift({ params }: { params: PageProps<"/gifts/[slug]">["params"] }) {
  const { slug } = await params;
  const p = await getGift(slug);
  if (!p) notFound();
  const number = storeNumber();
  const [main, ...more] = p.images;

  return (
    <article className="gp">
      <Link href="/gifts" className="gf-text-link gp-back">← All gifts</Link>
      <div className="gp-grid">
        <div className="gp-gallery">
          <span className="gf-frame gp-main"><GiftImage src={main} alt={p.name} sizes="(max-width: 860px) 100vw, 50vw" priority /></span>
          {more.length > 0 && (
            <ul className="gp-thumbs">
              {more.map((src, i) => <li key={src} className="gf-frame"><GiftImage src={src} alt={`${p.name}, photo ${i + 2}`} sizes="160px" /></li>)}
            </ul>
          )}
        </div>
        <div className="gp-info">
          <div className="eyebrow">{CATEGORY_LABEL[p.category]} · for {p.forWhom.map((w) => FOR_WHOM_LABEL[w].toLowerCase()).join(", ")}</div>
          <h1>{p.name}</h1>
          <p className="gp-price">{naira(p.price)}</p>
          {p.description && <p className="gp-desc">{p.description}</p>}
          <dl className="gp-facts">
            <div><dt>Delivery</dt><dd>{p.deliveryAreas.map(areaName).join(", ")}, in {p.leadTimeDays === 1 ? "1 day" : `${p.leadTimeDays} days`}</dd></div>
            <div><dt>Stock</dt><dd>{p.inStock ? "In stock" : "Out of stock"}</dd></div>
          </dl>
          {!p.inStock ? (
            <button type="button" className="btn btn-primary gp-order" disabled>Out of stock</button>
          ) : number ? (
            <SpecularButton href={orderUrl(p, number)} target="_blank" rel="noopener noreferrer" className="btn btn-primary gp-order">Order on WhatsApp</SpecularButton>
          ) : (
            <button type="button" className="btn btn-primary gp-order" disabled>Ordering opens soon</button>
          )}
          <p className="gp-note">We&apos;ll confirm price, delivery fee and delivery date on WhatsApp before you pay.</p>
          <Link href="/gifts/policy" className="gf-text-link">Delivery, payment and returns policy</Link>
        </div>
      </div>
    </article>
  );
}

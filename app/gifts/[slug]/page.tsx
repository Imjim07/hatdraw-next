import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import LoaderOne from "@/components/ui/loader-one";
import GiftImage from "@/components/gifts/GiftImage";
import OrderButton from "@/components/gifts/OrderButton";
import { naira } from "@/lib/config";
import { gifts } from "@/lib/copy/gifts";
import { getGift } from "@/lib/gifts/store";
import { orderUrl } from "@/lib/gifts/order";
import { CATEGORY_LABEL, FOR_WHOM_LABEL, areasLine } from "@/lib/gifts/types";

const G = gifts.page;

// One gift and who sells it. Ordering opens the VENDOR's WhatsApp with the gift, its price
// and a ref typed in; nothing is paid on the site. Params are runtime data (Cache
// Components), so they're read under Suspense.
export default function GiftPage({ params }: PageProps<"/gifts/[slug]">) {
  return (
    <Suspense fallback={<div className="store-loading"><LoaderOne label={gifts.opening} /></div>}>
      <Gift params={params} />
    </Suspense>
  );
}

async function Gift({ params }: { params: PageProps<"/gifts/[slug]">["params"] }) {
  const { slug } = await params;
  const p = await getGift(slug);
  if (!p) notFound();
  const v = p.vendor;
  const [main, ...more] = p.images;
  const when = v.deliveryTime ?? gifts.compare.days(p.leadTimeDays);

  return (
    <article className="gp">
      <Link href="/gifts" className="gf-text-link gp-back">{G.allGifts}</Link>
      <div className="gp-grid">
        <div className="gp-gallery">
          <span className="gf-frame gp-main"><GiftImage src={main} alt={p.name} sizes="(max-width: 860px) 100vw, 50vw" priority /></span>
          {more.length > 0 && (
            <ul className="gp-thumbs">
              {more.map((src, i) => <li key={src} className="gf-frame"><GiftImage src={src} alt={G.photo(p.name, i + 2)} sizes="160px" /></li>)}
            </ul>
          )}
        </div>
        <div className="gp-info">
          <div className="eyebrow">{CATEGORY_LABEL[p.category]} · {G.forWhom(p.forWhom.map((w) => FOR_WHOM_LABEL[w].toLowerCase()).join(", "))}</div>
          <h1>{p.name}</h1>
          <p className="gp-price">{naira(p.price)}</p>
          {p.description && <p className="gp-desc">{p.description}</p>}
          <dl className="gp-facts">
            <div><dt>{G.soldBy}</dt><dd>{v.name}{v.verified && <> <span className="pill gp-checked">{G.checked}</span></>}</dd></div>
            <div><dt>{G.delivery}</dt><dd>{G.deliveryLine(areasLine(v), when)}</dd></div>
            <div><dt>{G.stock}</dt><dd>{p.inStock ? G.inStock : G.soldOut(v.name)}</dd></div>
            <div><dt>{G.refunds}</dt><dd>{v.refundLine}</dd></div>
          </dl>
          {p.inStock
            ? <OrderButton productId={p.id} fallback={orderUrl(p)} label={G.order(v.name)} busyLabel={G.opening} />
            : <button type="button" className="btn btn-primary gp-order" disabled>{G.outOfStock}</button>}
          <p className="gp-note">{G.underButton(v.name)}</p>
          <Link href="/gifts/policy" className="gf-text-link">{G.policy}</Link>
        </div>
      </div>
    </article>
  );
}

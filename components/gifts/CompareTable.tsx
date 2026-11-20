import Link from "next/link";
import { naira } from "@/lib/config";
import { COMPARE_MAX, toQuery, toggleCompare, type Filters } from "@/lib/gifts/filters";
import { CATEGORY_LABEL, FOR_WHOM_LABEL, areasLine, type GiftProduct } from "@/lib/gifts/types";
import { gifts } from "@/lib/copy/gifts";

const T = gifts.compare;
import GiftImage from "./GiftImage";

// Up to four gifts side by side (after the React Bits Pro "Ecommerce 5" four-product
// comparison, rebuilt in the site's CSS). A real table: gifts are columns, facts are
// rows. The only highlights are facts from the data: the lowest price and the
// quickest delivery, and only when they actually differ.
export default function CompareTable({ items, f }: { items: GiftProduct[]; f: Filters }) {
  const clear = `/gifts${toQuery(f, { compare: [] })}`;
  if (items.length < 2)
    return (
      <section className="gf-compare gf-compare--hint" aria-label={T.label}>
        <p><b>{T.ready(items[0].name, COMPARE_MAX - 1)[0]}</b>{T.ready(items[0].name, COMPARE_MAX - 1)[1]}</p>
        <Link href={clear} scroll={false} className="gf-text-link">{T.clear}</Link>
      </section>
    );

  const prices = items.map((p) => p.price), days = items.map((p) => p.leadTimeDays);
  const cheapest = new Set(prices).size > 1 ? Math.min(...prices) : null;
  const quickest = new Set(days).size > 1 ? Math.min(...days) : null;

  return (
    <section className="gf-compare" aria-labelledby="gf-compare-h">
      <div className="gf-compare-head">
        <h2 id="gf-compare-h">{T.heading(items.length)}</h2>
        <Link href={clear} scroll={false} className="gf-text-link">{T.clearAll}</Link>
      </div>
      <div className="gf-compare-scroll">
        <table className="gf-table" style={{ "--cols": items.length } as React.CSSProperties}>
          <thead>
            <tr>
              <td />
              {items.map((p) => (
                <th key={p.slug} scope="col">
                  <span className="gf-frame"><GiftImage src={p.images[0]} alt="" sizes="200px" /></span>
                  <Link href={`/gifts/${p.slug}`} className="gf-name">{p.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{T.price}</th>
              {items.map((p) => <td key={p.slug}><b className="gf-price">{naira(p.price)}</b>{p.price === cheapest && <span className="gf-fact">{T.lowest}</span>}</td>)}
            </tr>
            <tr>
              <th scope="row">{T.for}</th>
              {items.map((p) => <td key={p.slug}>{p.forWhom.map((w) => FOR_WHOM_LABEL[w]).join(", ")}</td>)}
            </tr>
            <tr>
              <th scope="row">{T.category}</th>
              {items.map((p) => <td key={p.slug}>{CATEGORY_LABEL[p.category]}</td>)}
            </tr>
            <tr>
              <th scope="row">{T.soldBy}</th>
              {items.map((p) => <td key={p.slug}>{p.vendor.name}</td>)}
            </tr>
            <tr>
              <th scope="row">{T.delivery}</th>
              {items.map((p) => (
                <td key={p.slug}>
                  {areasLine(p.vendor)}, {p.vendor.deliveryTime ?? T.days(p.leadTimeDays)}
                  {p.leadTimeDays === quickest && <span className="gf-fact">{T.quickest}</span>}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">{T.stock}</th>
              {items.map((p) => <td key={p.slug}>{p.inStock ? gifts.page.inStock : gifts.page.outOfStock}</td>)}
            </tr>
            <tr>
              <td />
              {items.map((p) => (
                <td key={p.slug}>
                  <div className="gf-compare-acts">
                    <Link href={`/gifts/${p.slug}`} className="btn btn-primary btn-sm">{T.view}<span className="sr-only">: {p.name}</span></Link>
                    <Link href={`/gifts${toQuery(f, { compare: toggleCompare(f.compare, p.slug) })}`} scroll={false} className="gf-text-link">{T.remove}<span className="sr-only"> {p.name}</span></Link>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

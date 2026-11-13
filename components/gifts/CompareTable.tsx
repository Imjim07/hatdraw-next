import Link from "next/link";
import { naira } from "@/lib/config";
import { COMPARE_MAX, toQuery, toggleCompare, type Filters } from "@/lib/gifts/filters";
import { CATEGORY_LABEL, FOR_WHOM_LABEL, areaName, type GiftProduct } from "@/lib/gifts/types";
import GiftImage from "./GiftImage";

// Up to four gifts side by side (after the React Bits Pro "Ecommerce 5" four-product
// comparison, rebuilt in the site's CSS). A real table: gifts are columns, facts are
// rows. The only highlights are facts from the data: the lowest price and the
// quickest delivery, and only when they actually differ.
export default function CompareTable({ items, f }: { items: GiftProduct[]; f: Filters }) {
  const clear = `/gifts${toQuery(f, { compare: [] })}`;
  if (items.length < 2)
    return (
      <section className="gf-compare gf-compare--hint" aria-label="Compare gifts">
        <p><b>{items[0].name}</b> is ready to compare. Pick up to {COMPARE_MAX - 1} more gifts.</p>
        <Link href={clear} scroll={false} className="gf-text-link">Clear</Link>
      </section>
    );

  const prices = items.map((p) => p.price), days = items.map((p) => p.leadTimeDays);
  const cheapest = new Set(prices).size > 1 ? Math.min(...prices) : null;
  const quickest = new Set(days).size > 1 ? Math.min(...days) : null;

  return (
    <section className="gf-compare" aria-labelledby="gf-compare-h">
      <div className="gf-compare-head">
        <h2 id="gf-compare-h">Compare {items.length} gifts</h2>
        <Link href={clear} scroll={false} className="gf-text-link">Clear comparison</Link>
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
              <th scope="row">Price</th>
              {items.map((p) => <td key={p.slug}><b className="gf-price">{naira(p.price)}</b>{p.price === cheapest && <span className="gf-fact">Lowest price</span>}</td>)}
            </tr>
            <tr>
              <th scope="row">For</th>
              {items.map((p) => <td key={p.slug}>{p.forWhom.map((w) => FOR_WHOM_LABEL[w]).join(", ")}</td>)}
            </tr>
            <tr>
              <th scope="row">Category</th>
              {items.map((p) => <td key={p.slug}>{CATEGORY_LABEL[p.category]}</td>)}
            </tr>
            <tr>
              <th scope="row">Delivery</th>
              {items.map((p) => (
                <td key={p.slug}>
                  {p.deliveryAreas.map(areaName).join(", ")}, {p.leadTimeDays === 1 ? "1 day" : `${p.leadTimeDays} days`}
                  {p.leadTimeDays === quickest && <span className="gf-fact">Quickest</span>}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Stock</th>
              {items.map((p) => <td key={p.slug}>{p.inStock ? "In stock" : "Out of stock"}</td>)}
            </tr>
            <tr>
              <td />
              {items.map((p) => (
                <td key={p.slug}>
                  <div className="gf-compare-acts">
                    <Link href={`/gifts/${p.slug}`} className="btn btn-primary btn-sm">View gift<span className="sr-only">: {p.name}</span></Link>
                    <Link href={`/gifts${toQuery(f, { compare: toggleCompare(f.compare, p.slug) })}`} scroll={false} className="gf-text-link">Remove<span className="sr-only"> {p.name}</span></Link>
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

import Link from "next/link";
import { naira } from "@/lib/config";
import { toggleCompare, toQuery, type Filters } from "@/lib/gifts/filters";
import { deliveryLine, type GiftProduct } from "@/lib/gifts/types";
import GiftImage from "./GiftImage";

/** One product in the grid: photo, name, exact price, delivery, and a compare toggle. */
export default function GiftCard({ p, f }: { p: GiftProduct; f: Filters }) {
  const comparing = f.compare.includes(p.slug);
  return (
    <li className="card gf-card">
      <Link href={`/gifts/${p.slug}`} className="gf-card-link">
        <span className="gf-frame"><GiftImage src={p.images[0]} alt="" sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw" /></span>
        <span className="gf-name">{p.name}</span>
      </Link>
      <span className="gf-price">{naira(p.price)}</span>
      <span className="gf-meta">{p.inStock ? deliveryLine(p) : "Out of stock"}</span>
      <Link href={`/gifts${toQuery(f, { compare: toggleCompare(f.compare, p.slug) })}`} scroll={false}
        className={`gf-compare-toggle${comparing ? " on" : ""}`}>
        {comparing ? <>✓ Comparing<span className="sr-only">: remove {p.name}</span></> : <>Compare<span className="sr-only"> {p.name}</span></>}
      </Link>
    </li>
  );
}

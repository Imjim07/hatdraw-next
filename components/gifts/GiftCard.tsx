import Link from "next/link";
import { naira } from "@/lib/config";
import { gifts } from "@/lib/copy/gifts";
import { toggleCompare, toQuery, type Filters } from "@/lib/gifts/filters";
import { areasLine, type GiftProduct } from "@/lib/gifts/types";
import GiftImage from "./GiftImage";

const C = gifts.card;

/** One product in the grid: photo, name, exact price, who sells it, where they deliver, and a compare toggle. */
export default function GiftCard({ p, f }: { p: GiftProduct; f: Filters }) {
  const comparing = f.compare.includes(p.slug);
  return (
    <li className="card gf-card">
      <Link href={`/gifts/${p.slug}`} className="gf-card-link">
        <span className="gf-frame"><GiftImage src={p.images[0]} alt="" sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw" /></span>
        <span className="gf-name">{p.name}</span>
      </Link>
      <span className="gf-price">{naira(p.price)}</span>
      <span className="gf-meta">{C.soldBy(p.vendor.name)} · {p.inStock ? C.deliversIn(areasLine(p.vendor)) : gifts.page.soldOut(p.vendor.name)}</span>
      <Link href={`/gifts${toQuery(f, { compare: toggleCompare(f.compare, p.slug) })}`} scroll={false}
        className={`gf-compare-toggle${comparing ? " on" : ""}`}>
        {comparing ? <>{C.comparing}<span className="sr-only">{C.removeFrom(p.name)}</span></> : <>{C.compare}<span className="sr-only"> {p.name}</span></>}
      </Link>
    </li>
  );
}

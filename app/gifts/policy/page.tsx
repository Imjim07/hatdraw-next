import Link from "next/link";
import { BRAND } from "@/lib/config";

// Store policies. Placeholders until the owner writes them (see docs/adding-gifts.md).
const SECTIONS = ["Delivery", "Payment", "Returns & refunds", "Contact"];

export default function PolicyPage() {
  return (
    <article className="gf-policy">
      <Link href="/gifts" className="gf-text-link gp-back">← All gifts</Link>
      <div className="eyebrow">Gift Finder</div>
      <h1>Store policies</h1>
      <p className="sub">How ordering from the {BRAND.name} Gift Finder works.</p>
      {SECTIONS.map((s) => (
        <section key={s}>
          <h2>{s}</h2>
          <p className="gf-todo">[OWNER TO WRITE]</p>
        </section>
      ))}
    </article>
  );
}

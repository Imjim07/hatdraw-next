"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BANDS, bandOf, budgetLabel, toQuery, type Filters } from "@/lib/gifts/filters";
import { CATEGORIES, CATEGORY_LABEL, FOR_WHOM, FOR_WHOM_LABEL, type Category, type ForWhom } from "@/lib/gifts/types";

// Gift Finder filters. Everything is in the URL, so a filtered view can be shared:
// budget chips are plain links; the two selects navigate on change. Without
// JavaScript the selects submit as a normal GET form (the Apply button shows).
export default function FilterBar({ f }: { f: Filters }) {
  const router = useRouter();
  const go = (patch: Partial<Filters>) => router.push(`/gifts${toQuery(f, patch)}`, { scroll: false });
  const band = bandOf(f);

  return (
    <div className="gf-filters">
      <nav aria-label="Budget" className="gf-budget">
        {BANDS.map((b) => (
          <Link key={b.id} href={`/gifts${toQuery(f, { min: b.min, max: b.max })}`} scroll={false}
            className="gf-chip" aria-current={band === b.id ? "true" : undefined}>{b.label}</Link>
        ))}
        {band === null && <span className="gf-chip" aria-current="true">{budgetLabel(f)}</span>}
      </nav>
      <form action="/gifts" method="get" className="gf-selects" onSubmit={(e) => { e.preventDefault(); }}>
        {f.min !== null && <input type="hidden" name="min" value={f.min} />}
        {f.max !== null && <input type="hidden" name="max" value={f.max} />}
        {f.compare.length > 0 && <input type="hidden" name="compare" value={f.compare.join(",")} />}
        <label className="gf-field">
          <span>For</span>
          <select className="in" name="for" value={f.forWhom ?? ""} onChange={(e) => go({ forWhom: (e.target.value || null) as ForWhom | null })}>
            <option value="">Anyone</option>
            {FOR_WHOM.filter((w) => w !== "anyone").map((w) => <option key={w} value={w}>{FOR_WHOM_LABEL[w]}</option>)}
          </select>
        </label>
        <label className="gf-field">
          <span>Category</span>
          <select className="in" name="cat" value={f.category ?? ""} onChange={(e) => go({ category: (e.target.value || null) as Category | null })}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </label>
        <noscript><button type="submit" className="btn btn-ghost btn-sm">Apply</button></noscript>
      </form>
    </div>
  );
}

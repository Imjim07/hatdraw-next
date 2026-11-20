"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ANY, BANDS, SORTS, bandOf, budgetLabel, toggleCategory, toQuery, type FacetCounts, type Filters, type SortId } from "@/lib/gifts/filters";
import { CATEGORY_LABEL, FOR_WHOM, FOR_WHOM_LABEL, type Category, type ForWhom } from "@/lib/gifts/types";
import { gifts } from "@/lib/copy/gifts";

const T = gifts.filters;

// The catalogue's filter sidebar, after the React Bits Pro "Ecommerce 2" catalogue with
// brand filters, rebuilt in the site's CSS. Our multi-select group is Category (the store
// has no brands). Real radios and checkboxes, each with the number of gifts it would
// show. Every change goes into the URL, so a filtered view can be shared; without
// JavaScript it submits as a plain GET form (the Apply button shows).
// On phones the panel folds behind a "Filters" button.
export default function FilterPanel({ f, counts, categories }: { f: Filters; counts: FacetCounts; categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const go = (patch: Partial<Filters>) => router.push(`/gifts${toQuery(f, patch)}`, { scroll: false });
  const band = bandOf(f);
  const active = (f.min !== null || f.max !== null ? 1 : 0) + (f.forWhom ? 1 : 0) + f.categories.length;

  return (
    <aside className="gf-side" aria-label={T.title}>
      <button type="button" className="btn btn-ghost btn-sm gf-side-toggle" aria-expanded={open} aria-controls="gf-filter-form" onClick={() => setOpen((o) => !o)}>
        {T.title}{active > 0 && ` · ${active}`}
      </button>
      <form id="gf-filter-form" action="/gifts" method="get" className={`gf-side-form${open ? " open" : ""}`} onSubmit={(e) => e.preventDefault()}>
        {f.sort !== "featured" && <input type="hidden" name="sort" value={f.sort} />}
        {f.compare.length > 0 && <input type="hidden" name="compare" value={f.compare.join(",")} />}
        <div className="gf-side-head">
          <h2>{T.title}</h2>
          {active > 0 && <Link href={`/gifts${toQuery(ANY, { sort: f.sort, compare: f.compare })}`} scroll={false} className="gf-text-link">{T.clearAll}</Link>}
        </div>

        <fieldset className="gf-group">
          <legend>{T.budget}</legend>
          {band === null && (
            <label className="gf-opt">
              <input type="radio" name="budget" value="" checked readOnly />
              {f.min !== null && <input type="hidden" name="min" value={f.min} />}
              {f.max !== null && <input type="hidden" name="max" value={f.max} />}
              <span>{budgetLabel(f)}</span>
            </label>
          )}
          {BANDS.map((b) => (
            <label key={b.id} className="gf-opt">
              <input type="radio" name="budget" value={b.id} checked={band === b.id} onChange={() => go({ min: b.min, max: b.max })} />
              <span>{b.label}</span><Count n={counts.budget[b.id]} />
            </label>
          ))}
        </fieldset>

        <fieldset className="gf-group">
          <legend>{T.for}</legend>
          <label className="gf-opt">
            <input type="radio" name="for" value="" checked={f.forWhom === null} onChange={() => go({ forWhom: null })} />
            <span>{T.anyone}</span><Count n={counts.forWhom.any} />
          </label>
          {FOR_WHOM.filter((w): w is Exclude<ForWhom, "anyone"> => w !== "anyone").map((w) => (
            <label key={w} className="gf-opt">
              <input type="radio" name="for" value={w} checked={f.forWhom === w} onChange={() => go({ forWhom: w })} />
              <span>{FOR_WHOM_LABEL[w]}</span><Count n={counts.forWhom[w]} />
            </label>
          ))}
        </fieldset>

        {categories.length > 0 && (
          <fieldset className="gf-group">
            <legend>{T.category}</legend>
            {categories.map((c) => (
              <label key={c} className="gf-opt">
                <input type="checkbox" name="cat" value={c} checked={f.categories.includes(c)} onChange={() => go({ categories: toggleCategory(f.categories, c) })} />
                <span>{CATEGORY_LABEL[c]}</span><Count n={counts.category[c]} />
              </label>
            ))}
          </fieldset>
        )}
        <noscript><button type="submit" className="btn btn-primary btn-sm">{T.apply}</button></noscript>
      </form>
    </aside>
  );
}

/** "Sort by" over the results. */
export function SortSelect({ f }: { f: Filters }) {
  const router = useRouter();
  return (
    <label className="gf-sort">
      <span>{T.sortBy}</span>
      <select className="in" value={f.sort} onChange={(e) => router.push(`/gifts${toQuery(f, { sort: e.target.value as SortId })}`, { scroll: false })}>
        {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
    </label>
  );
}

const Count = ({ n }: { n: number }) => (
  <span className="gf-n"><span className="sr-only">, </span>{n}<span className="sr-only">{T.giftsCount(n)}</span></span>
);

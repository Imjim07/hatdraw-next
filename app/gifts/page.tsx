import { Suspense } from "react";
import Link from "next/link";
import AdireLoader from "@/components/AdireLoader";
import SpecularButton from "@/components/SpecularButton";
import FilterPanel, { SortSelect } from "@/components/gifts/FilterPanel";
import GiftCard from "@/components/gifts/GiftCard";
import CompareTable from "@/components/gifts/CompareTable";
import { Ododo } from "@/components/motifs";
import { ANY, budgetLabel, facetCounts, matches, parseFilters, sortGifts, toQuery, widen, type Filters } from "@/lib/gifts/filters";
import { CATEGORIES } from "@/lib/gifts/types";
import { listGifts } from "@/lib/gifts/store";
import { gifts } from "@/lib/copy/gifts";
import { Headline } from "@/components/GradientText";

const E = gifts.empty;

// The Gift Finder. The heading is static; the catalogue reads the URL's filters, so it
// renders on the server per request (under Suspense) from data cached for 10 minutes.
export default function GiftsPage({ searchParams }: PageProps<"/gifts">) {
  return (
    <>
      <header className="store-head">
        <div className="eyebrow">{gifts.eyebrow}</div>
        <h1><Headline>{gifts.heading}</Headline></h1>
        <p className="sub">{gifts.subline}</p>
      </header>
      <Suspense fallback={<div className="store-loading"><AdireLoader label={gifts.loading} /></div>}>
        <Catalogue searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Catalogue({ searchParams }: { searchParams: PageProps<"/gifts">["searchParams"] }) {
  const f = parseFilters(await searchParams);
  const all = await listGifts();
  const shown = sortGifts(all.filter((p) => matches(p, f)), f.sort);
  const compared = f.compare.map((s) => all.find((p) => p.slug === s)).filter((p) => p !== undefined);
  // categories the catalogue actually has, plus any already picked
  const categories = CATEGORIES.filter((c) => f.categories.includes(c) || all.some((p) => p.category === c));

  return (
    <div className="gf-layout">
      <FilterPanel f={f} counts={facetCounts(all, f)} categories={categories} />
      <div className="gf-results">
        {compared.length > 0 && <CompareTable items={compared} f={f} />}
        <div className="gf-results-head">
          <p className="gf-count" aria-live="polite">
            {gifts.count(shown.length)} · {budgetLabel(f)}
          </p>
          {shown.length > 1 && <SortSelect f={f} />}
        </div>
        {shown.length ? (
          <ul className="gf-grid">{shown.map((p) => <GiftCard key={p.slug} p={p} f={f} />)}</ul>
        ) : (
          <Empty f={f} catalogueEmpty={all.length === 0} />
        )}
      </div>
    </div>
  );
}

function Empty({ f, catalogueEmpty }: { f: Filters; catalogueEmpty: boolean }) {
  const wider = widen(f);
  const filtered = toQuery({ ...f, compare: [], sort: "featured" }) !== "";
  let text: string, action: { href: string; label: string } | null = null;
  if (f.max !== null) {
    text = E.under(f.max);
    action = { href: `/gifts${toQuery(wider ?? ANY)}`, label: wider?.max ? E.showUnder(wider.max) : E.anyBudget };
  } else if (filtered && !catalogueEmpty) {
    text = E.noMatch;
    action = { href: "/gifts", label: E.clear };
  } else {
    text = E.none;
  }
  return (
    <div className="card gf-empty">
      <Ododo size={40} color="var(--indigo)" strokeWidth={5} />
      <p>{text}</p>
      {action && <SpecularButton href={action.href} className="btn btn-primary btn-sm">{action.label}</SpecularButton>}
      {!action && <Link href="/" className="gf-text-link">{E.home}</Link>}
    </div>
  );
}

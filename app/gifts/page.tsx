import { Suspense } from "react";
import Link from "next/link";
import AdireLoader from "@/components/AdireLoader";
import SpecularButton from "@/components/SpecularButton";
import FilterBar from "@/components/gifts/FilterBar";
import GiftCard from "@/components/gifts/GiftCard";
import CompareTable from "@/components/gifts/CompareTable";
import { Ododo } from "@/components/motifs";
import { naira } from "@/lib/config";
import { ANY, budgetLabel, matches, parseFilters, toQuery, widen, type Filters } from "@/lib/gifts/filters";
import { listGifts } from "@/lib/gifts/store";

// The Gift Finder. The heading is static; the catalogue reads the URL's filters, so it
// renders on the server per request (under Suspense) from data cached for 10 minutes.
export default function GiftsPage({ searchParams }: PageProps<"/gifts">) {
  return (
    <>
      <header className="store-head">
        <div className="eyebrow">Gift Finder</div>
        <h1>Gifts that fit your budget</h1>
        <p className="sub">Delivered in Lagos. Order on WhatsApp, and we confirm the price, delivery fee and date before you pay.</p>
      </header>
      <Suspense fallback={<div className="store-loading"><AdireLoader label="Finding gifts" /></div>}>
        <Catalogue searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Catalogue({ searchParams }: { searchParams: PageProps<"/gifts">["searchParams"] }) {
  const f = parseFilters(await searchParams);
  const all = await listGifts();
  const shown = all.filter((p) => matches(p, f));
  const compared = f.compare.map((s) => all.find((p) => p.slug === s)).filter((p) => p !== undefined);

  return (
    <>
      <FilterBar f={f} />
      {compared.length > 0 && <CompareTable items={compared} f={f} />}
      <p className="gf-count" aria-live="polite">
        {shown.length === 1 ? "1 gift" : `${shown.length} gifts`} · {budgetLabel(f)}
      </p>
      {shown.length ? (
        <ul className="gf-grid">{shown.map((p) => <GiftCard key={p.slug} p={p} f={f} />)}</ul>
      ) : (
        <Empty f={f} catalogueEmpty={all.length === 0} />
      )}
    </>
  );
}

function Empty({ f, catalogueEmpty }: { f: Filters; catalogueEmpty: boolean }) {
  const wider = widen(f);
  const filtered = toQuery({ ...f, compare: [] }) !== "";
  let text: string, action: { href: string; label: string } | null = null;
  if (f.max !== null) {
    text = `Nothing under ${naira(f.max)} yet. Try a higher budget.`;
    action = { href: `/gifts${toQuery(wider ?? ANY)}`, label: wider?.max ? `Show gifts under ${naira(wider.max)}` : "Show any budget" };
  } else if (filtered && !catalogueEmpty) {
    text = "No gifts match these filters yet.";
    action = { href: "/gifts", label: "Clear filters" };
  } else {
    text = "No gifts here yet. Check back soon.";
  }
  return (
    <div className="card gf-empty">
      <Ododo size={40} color="var(--indigo)" strokeWidth={5} />
      <p>{text}</p>
      {action && <SpecularButton href={action.href} className="btn btn-primary btn-sm">{action.label}</SpecularButton>}
      {!action && <Link href="/" className="gf-text-link">Back to the home page</Link>}
    </div>
  );
}

import type { ReactNode } from "react";
import InteractiveSelector, { type SelectorOption } from "@/components/ui/interactive-selector";
import { Headline } from "@/components/GradientText";
import { landing } from "@/lib/copy/landing";

// "Who it's for": the groups Kádàrá is made for, as photo panels (InteractiveSelector),
// between "What Kádàrá offers" and Pricing. Live uses link to the draw they need; the
// giveaway uses aren't built yet, so they show "Coming soon" and no link.
// Photos: Unsplash placeholders, self-hosted in public/use-cases/ (CREDITS.md there).
const U = landing.useCases;

// Small line icons, 20px, in the text colour (no icon package).
const svg = (children: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);
const ICONS = {
  offices: svg(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>),
  churches: svg(<><path d="M12 2v5M10 4h4M5 21V11l7-4 7 4v10" /><path d="M10 21v-4a2 2 0 0 1 4 0v4M3 21h18" /></>),
  ajo: svg(<><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M9 14v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.7-2.7-3-6-3" /></>),
  planners: svg(<><path d="M8 3h5l-1 6a3 3 0 0 1-3 0z" /><path d="M10.5 10v8M8 21h5" /><path d="M16 4l2-2M19 7l2-1M17 9h3" /></>),
  vendors: svg(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></>),
  gamers: svg(<><path d="M6 8h12a4 4 0 0 1 3.9 4.9l-.9 4a2.5 2.5 0 0 1-4.3 1.1L15 16H9l-1.7 2a2.5 2.5 0 0 1-4.3-1.1l-.9-4A4 4 0 0 1 6 8z" /><path d="M8 11v3M6.5 12.5h3" /><circle cx="15.5" cy="12" r=".6" fill="currentColor" /><circle cx="17.5" cy="14" r=".6" fill="currentColor" /></>),
};

type Id = keyof typeof ICONS;
const LIVE: Partial<Record<Id, string>> = { offices: "/draw", churches: "/draw", ajo: "/ajo", planners: "/draw" };

const options: SelectorOption[] = (Object.keys(ICONS) as Id[]).map((id) => {
  const c: { title: string; description: string; cta?: string; image: { alt: string; credit: string } } = U[id];
  const href = LIVE[id];
  return {
    id, title: c.title, description: c.description, icon: ICONS[id],
    status: href ? "live" : "soon", href, cta: c.cta,
    image: { src: `/use-cases/${id}.jpg`, ...c.image },
  };
});

export default function UseCases() {
  return (
    <section className="band uc-section" id="who-its-for" aria-labelledby="who-its-for-title"><div className="wrap">
      <div className="of-head">
        <div className="eyebrow">{U.eyebrow}</div>
        <h2 id="who-its-for-title"><Headline>{U.heading}</Headline></h2>
        <p className="sub">{U.subline}</p>
      </div>
      <div className="uc-wrap">
        <InteractiveSelector options={options} soonLabel={U.soon} />
      </div>
    </div></section>
  );
}

import Link from "next/link";
import Logo from "@/components/Logo";
import HeroShekere from "@/components/HeroShekere";
import SectionNav from "@/components/SectionNav";
import ThemeToggle from "@/components/ThemeToggle";
import SmoothScroll from "@/components/SmoothScroll";
import FooterStack from "@/components/FooterStack";
import SocialIcons from "@/components/SocialIcons";
import CurvedMenu, { StartDrawFooter } from "@/components/ui/curved-menu";
import PricingTable, { type Plan } from "@/components/PricingTable";
import Offers from "@/components/Offers";
import HowItWorks from "@/components/HowItWorks";
// Old features section, replaced by "What <brand> offers" (Offers) in its place.
// import Features from "@/components/Features";
import SpecularButton from "@/components/SpecularButton";
import Countdown, { Year } from "@/components/Countdown";
import { BRAND, CONTACT, PRICING, mailto } from "@/lib/config";
import { common } from "@/lib/copy/common";
import { landing } from "@/lib/copy/landing";


// Per-draw prices from PRICING (lib/config.ts); the copy is from the deck's Pricing table.
const P = landing.pricing;
const [MID, BIG] = PRICING.TIERS;
const PLANS: Plan[] = [
  { id: "small", name: P.small.name, who: P.small.who, price: 0, unit: "", note: P.small.note, features: P.small.features, cta: { label: P.small.cta, href: "/draw", variant: "ghost" } },
  { id: "mid", name: P.mid.name, who: P.mid.who, price: MID.price, unit: P.perDraw, note: P.mid.note, features: P.mid.features, cta: { label: P.mid.cta, href: "/draw", variant: "ghost" } },
  {
    id: "big", name: P.big.name, who: P.big.who, popular: true, price: BIG.price, unit: P.perDraw, note: P.big.note, features: P.big.features,
    cta: { label: P.big.cta, href: "/draw", variant: "gold" }, extra: { label: P.big.talkToUs, href: mailto(CONTACT.sales, P.big.talkSubject) },
  },
  { id: "pass", name: P.pass.name, who: P.pass.who, price: PRICING.YEAR_PASS.price, unit: P.once, note: P.pass.note, features: P.pass.features, cta: { label: P.pass.cta, href: "/draw", variant: "ghost" } },
  { id: "ajo", name: P.ajo.name, who: P.ajo.who, price: 0, unit: "", note: P.ajo.note, features: P.ajo.features, cta: { label: P.ajo.cta, href: "/ajo", variant: "ghost" } },
];

const M = common.menuItems;
const MENU = [
  { heading: M.how, href: "#how" },
  { heading: M.offers, href: "#features" },
  { heading: M.pricing, href: "#pricing" },
  { heading: M.ajo, href: "/ajo" },
  { heading: M.gifts, href: "/gifts" },
];
const F = common.footer;

export default function Home() {
  return (
    <>
    {/* Outside the smooth-scroll wrapper so it stays fixed on screen while the page scrolls */}
    <header className="site-head">
      <div className="wrap">
        <nav className="top">
          <Logo />
          <SectionNav />
          <span className="nav-end">
            <ThemeToggle />
            <SpecularButton href="/draw" className="btn btn-primary btn-sm nav-cta">{common.startDraw}</SpecularButton>
            <CurvedMenu items={MENU} footer={<StartDrawFooter />} />
          </span>
        </nav>
      </div>
    </header>
    <SmoothScroll>
    <main className="home">
      <div className="wrap">
        <div className="hero">
          <div>
            <Countdown />
            <h1>{landing.hero.headline[0]} <em>{landing.hero.headline[1]}</em></h1>
            <p className="lede">{landing.hero.subline}</p>
            <div className="hero-cta">
              <SpecularButton href="/draw" className="btn btn-primary">{landing.hero.santa.button} →</SpecularButton>
              <SpecularButton className="btn btn-ghost" href="/ajo">{landing.hero.ajo.button}</SpecularButton>
            </div>
          </div>
          <HeroShekere />
        </div>
      </div>

      <HowItWorks />

      {/* "What <brand> offers" now sits where the features section was (it carries id="features"). */}
      <Offers />

      {/* Old features section, kept for reference:
      <Features />
      */}

      <section className="band stack-under" id="pricing"><div className="wrap">
        <div className="eyebrow">{P.eyebrow}</div>
        <h2>{P.heading}</h2>
        <p className="sub">{P.subline}</p>
        <PricingTable plans={PLANS} />
      </div></section>

      {/* One sheet that slides up over the pricing section on the last scroll (FooterStack) */}
      <FooterStack under="#pricing">
        <div className="wrap">
          <div className="sf-top">
            <div className="sf-intro">
              <p className="sf-tag">{F.tag}</p>
              <SocialIcons name={BRAND.name} />
            </div>
            <nav className="sf-col" aria-label={F.products}>
              <h3>{F.products}</h3>
              <Link href="/draw">{F.links.santa}</Link>
              <Link href="/ajo">{F.links.ajo}</Link>
              <Link href="/gifts">{F.links.gifts}</Link>
              <Link href="/vendors">{F.links.vendors}</Link>
            </nav>
            <nav className="sf-col" aria-label={BRAND.name}>
              <h3>{BRAND.name}</h3>
              <a href="#how">{M.how}</a>
              <a href="#features">{M.offers}</a>
              <a href="#pricing">{M.pricing}</a>
              <Link href="/gifts/policy">{F.links.policy}</Link>
            </nav>
            <nav className="sf-col" aria-label={F.company}>
              <h3>{F.company}</h3>
              <span className="sf-link-row"><a href={BRAND.byUrl}>{BRAND.by}</a><span className="sf-badge">{F.madeIn}</span></span>
              <a href={mailto(CONTACT.info, common.mail.enquiry)}>{F.contact}</a>
              <a href={mailto(CONTACT.support, common.mail.support)}>{F.help}</a>
              <Link href="/privacy">{F.links.privacy}</Link>
              <Link href="/terms">{F.links.terms}</Link>
            </nav>
          </div>
          {/* the wordmark with Yoruba tone marks (kádàrá, destiny), cut by the rule below it;
              each letter is filled with adire cloth */}
          <div className="sf-mark" aria-hidden="true"><span>cáDàrá</span></div>
          <div className="sf-bottom">
            <span>© <Year /> {F.line}</span>
            <span>{F.credit}</span>
            <span>{F.weather} <a href="https://www.met.no/en">MET Norway</a> (CC BY 4.0)</span>
            <span>{F.icons} <a href="https://icons8.com">Icons8</a></span>
          </div>
        </div>
      </FooterStack>
    </main>
    </SmoothScroll>
    </>
  );
}

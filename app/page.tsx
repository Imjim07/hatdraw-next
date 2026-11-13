import Link from "next/link";
import Logo from "@/components/Logo";
import HeroShekere from "@/components/HeroShekere";
import SectionNav from "@/components/SectionNav";
import ThemeToggle from "@/components/ThemeToggle";
import SmoothScroll from "@/components/SmoothScroll";
import FooterStack from "@/components/FooterStack";
import CurvedMenu, { StartDrawFooter } from "@/components/ui/curved-menu";
import PricingTable, { type Plan } from "@/components/PricingTable";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import SpecularButton from "@/components/SpecularButton";
import Countdown, { Year } from "@/components/Countdown";
import { BRAND, PRICING, naira } from "@/lib/config";


// Small Hat stays free in both periods. Yearly prices need accounts, so they
// aren't sold yet; only the per-draw Big Hat goes to checkout.
const PLANS: Plan[] = [
  {
    id: "small", name: "Small Hat", who: "Friends & close family",
    price: { monthly: 0, yearly: 0 }, unit: { monthly: "", yearly: "" },
    note: { monthly: "Always free", yearly: "Always free" },
    features: [`Up to ${PRICING.FREE_LIMIT} people`, "Encrypted reveal links", "Keep-apart rules", "Pass-the-phone mode"],
    cta: { monthly: { label: "Start free", href: "/draw", variant: "ghost" }, yearly: { label: "Start free", href: "/draw", variant: "ghost" } },
  },
  {
    id: "big", name: "Big Hat", who: "Extended family, church groups, offices", popular: true,
    price: { monthly: PRICING.ONE_TIME, yearly: PRICING.BIG_HAT_YEARLY }, unit: { monthly: "per draw", yearly: "per year" },
    note: { monthly: "Pay once for each draw", yearly: `Billed ${naira(PRICING.BIG_HAT_YEARLY)} once a year` },
    features: [`Up to ${PRICING.MAX_PEOPLE} people`, "Everything in Small Hat", "One big circle mode", "Custom note on every reveal"],
    cta: { monthly: { label: "Start a big draw", href: "/draw", variant: "gold" }, yearly: { label: "Yearly coming soon", variant: "ghost" } },
  },
  {
    id: "chair", name: "Chair Hat", who: "Groups that stay together", tag: "COMING SOON",
    price: { monthly: PRICING.CHAIR_MONTHLY, yearly: PRICING.CHAIR_YEARLY }, unit: { monthly: "per month", yearly: "per year" },
    note: { monthly: "Billed monthly", yearly: `Billed ${naira(PRICING.CHAIR_YEARLY)} once a year` },
    features: ["Unlimited draws all year", "New Year resolutions, with your Santa as your accountability partner", "Secret Valentine, Sallah & birthday draws"],
    cta: { monthly: { label: "Coming in January", variant: "ghost" }, yearly: { label: "Coming in January", variant: "ghost" } },
  },
];
// Best yearly saving against twelve monthly payments, for the toggle badge.
const save = Math.max(...PLANS.filter((p) => p.price.monthly > 0).map((p) => 1 - p.price.yearly / (12 * p.price.monthly)));
const yearlyBadge = `Save up to ${Math.round(save * 100)}%`;

const MENU = [
  { heading: "How it works", href: "#how" },
  { heading: "Features", href: "#features" },
  { heading: "Pricing", href: "#pricing" },
  { heading: "Ajo", href: "/ajo" },
];

export default function Home() {
  return (
    <SmoothScroll>
    <main>
      <div className="wrap">
        <nav className="top">
          <Logo />
          <SectionNav />
          <span className="nav-end">
            <ThemeToggle />
            <SpecularButton href="/draw" className="btn btn-primary btn-sm nav-cta">Start a draw</SpecularButton>
            <CurvedMenu items={MENU} footer={<StartDrawFooter />} />
          </span>
        </nav>

        <div className="hero">
          <div>
            <Countdown />
            <h1>Drop the names in the hat. <em>Let Christmas pick.</em></h1>
            <p className="lede">Secret Santa for friends, family and teams. Add everyone&apos;s name and {BRAND.name} shuffles them. Each person gets a private link and unwraps who they&apos;re gifting. Nobody else sees it, not even you.</p>
            <div className="hero-cta">
              <SpecularButton href="/draw" className="btn btn-primary">Start your draw, free →</SpecularButton>
              <SpecularButton className="btn btn-ghost" href="#how">See how it works</SpecularButton>
            </div>
            <div className="trust"><span>No sign-up</span><span>Free up to {PRICING.FREE_LIMIT} people</span><span>Share on WhatsApp</span></div>
          </div>
          <HeroShekere />
        </div>
      </div>

      <HowItWorks />

      <Features />

      <section className="band stack-under" id="pricing"><div className="wrap">
        <div className="eyebrow">Pricing</div>
        <h2>Free for small groups. One small fee for big ones.</h2>
        <p className="sub">Any draw with up to {PRICING.FREE_LIMIT} people is free. Bigger groups pay per draw, or once a year.</p>
        <PricingTable plans={PLANS} yearlyBadge={yearlyBadge} />
      </div></section>

      {/* One sheet that slides up over the pricing section on the last scroll (FooterStack) */}
      <FooterStack under="#pricing">
        <div className="wrap">
          <div className="sf-top">
            <p className="sf-tag">{BRAND.name} is the easy way to draw names for gift exchanges and ajo payout orders.</p>
            <nav className="sf-col" aria-label="Draws">
              <h3>Draws</h3>
              <Link href="/draw">Gift exchange</Link>
              <Link href="/ajo">Ajo payout order</Link>
            </nav>
            <nav className="sf-col" aria-label={BRAND.name}>
              <h3>{BRAND.name}</h3>
              <a href="#how">How it works</a>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
            </nav>
            <nav className="sf-col" aria-label="Company">
              <h3>Company</h3>
              <span className="sf-link-row"><a href={BRAND.byUrl}>{BRAND.by}</a><span className="sf-badge">Made in Lagos</span></span>
            </nav>
          </div>
          {/* the wordmark, cut by the rule below it; each letter is filled with adire cloth */}
          <div className="sf-mark" aria-hidden="true"><span>caDara</span></div>
          <div className="sf-bottom">
            <span>© <Year /> {BRAND.name} · by {BRAND.by}</span>
            <span>Weather data from <a href="https://www.met.no/en">MET Norway</a> (CC BY 4.0)</span>
          </div>
        </div>
      </FooterStack>
    </main>
    </SmoothScroll>
  );
}

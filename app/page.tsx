import Link from "next/link";
import Logo from "@/components/Logo";
import Countdown, { Year } from "@/components/Countdown";
import { BRAND, PRICING, naira } from "@/lib/config";

const slips: { t: string; s: React.CSSProperties }[] = [
  { t: "Tolu", s: { top: "6%", left: "18%", rotate: "-8deg" } },
  { t: "Chidinma", s: { top: "2%", right: "14%", rotate: "6deg", animationDelay: "-2s" } },
  { t: "Mum", s: { top: "20%", left: "2%", rotate: "4deg", animationDelay: "-4s" } },
  { t: "Uncle Femi", s: { top: "16%", right: 0, rotate: "-5deg", animationDelay: "-1s" } },
  { t: "You?", s: { top: "-4%", left: "45%", rotate: "3deg", animationDelay: "-3s", background: "var(--gold)" } },
];

const features = [
  ["🙈", "Organizer-blind", "Links are encrypted. Even the person running the draw can't peek, so they can play too."],
  ["💑", "Keep-apart rules", "Stop spouses, siblings or flatmates from drawing each other."],
  ["🔁", "One big circle", "Gifts go round in a single chain, so the reveal at the party goes person to person."],
  ["📱", "Pass-the-phone", "All in one room? Pass one phone around and each person unwraps privately."],
  ["💬", "WhatsApp-ready", "One tap sends each person their private link on WhatsApp."],
  ["₦", "Budget in Naira", "Everyone sees the same spending limit, so nobody turns up with a gift that's too cheap or too much."],
  ["📍", "Where & when", "The venue and date show on every reveal, with a countdown."],
  ["🌦️", "Feels like home", "The site's weather follows yours: harmattan haze in Lagos, snow in London. Or hit \"Let it snow\"."],
];

export default function Home() {
  return (
    <main>
      <div className="wrap">
        <nav className="top">
          <Logo />
          <div className="navlinks"><a href="#how">How it works</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div>
          <Link href="/draw" className="btn btn-gold btn-sm">Start a draw</Link>
        </nav>

        <div className="hero">
          <div>
            <Countdown />
            <h1>Drop the names in the hat. <em>Let Christmas pick.</em></h1>
            <p className="lede">Secret Santa for friends, family and teams. Add everyone&apos;s name and {BRAND.name} shuffles them. Each person gets a private link and unwraps who they&apos;re gifting. Nobody else sees it, not even you.</p>
            <div className="hero-cta">
              <Link href="/draw" className="btn btn-gold">Start your draw, free →</Link>
              <a className="btn btn-ghost" href="#how">See how it works</a>
            </div>
            <div className="trust"><span>No sign-up</span><span>Free up to {PRICING.FREE_LIMIT} people</span><span>Share on WhatsApp</span></div>
          </div>
          <div className="hat-stage" aria-hidden="true">
            <div className="glow" />
            <svg viewBox="0 0 400 400">
              <ellipse cx="200" cy="318" rx="160" ry="34" fill="#1C3229" />
              <ellipse cx="200" cy="300" rx="150" ry="30" fill="#E3B45A" />
              <path d="M95 300 L118 120 Q200 86 282 120 L305 300 Z" fill="#C2413B" />
              <path d="M118 120 Q200 86 282 120 L278 150 Q200 120 122 150 Z" fill="#8f2a26" />
              <rect x="105" y="236" width="190" height="26" rx="4" fill="#E3B45A" />
              <ellipse cx="200" cy="118" rx="82" ry="18" fill="#0E1A16" />
            </svg>
            {slips.map((s) => <div key={s.t} className="slip" style={s.s}>{s.t}</div>)}
          </div>
        </div>
      </div>

      <section className="band" id="how"><div className="wrap">
        <div className="eyebrow">How it works</div>
        <h2>Three steps. Two minutes.</h2>
        <p className="sub">No apps to install and no accounts. Everyone keeps their surprise until gift day.</p>
        <div className="grid3">
          <div className="card"><div className="num">01</div><h3>Add the names</h3><p>Type them in or paste a list from your WhatsApp group. Set the budget, the date and where the exchange is happening.</p></div>
          <div className="card"><div className="num">02</div><h3>Shake the hat</h3><p>Nobody draws themselves, and couples or housemates can be kept apart if you set that rule.</p></div>
          <div className="card"><div className="num">03</div><h3>Everyone unwraps</h3><p>Send each person their own link, or pass one phone around the room. They tap the gift box to see who they&apos;re buying for.</p></div>
        </div>
      </div></section>

      <section className="band" id="features"><div className="wrap">
        <div className="eyebrow">Built for real groups</div>
        <h2>For the family chat, the friend group and the office.</h2>
        <div className="feat">
          {features.map(([i, h, p]) => <div key={h}><b>{i}</b><h4>{h}</h4><p>{p}</p></div>)}
        </div>
      </div></section>

      <section className="band" id="pricing"><div className="wrap">
        <div className="eyebrow">Pricing</div>
        <h2>Free for small groups. One small fee for big ones.</h2>
        <p className="sub">Any draw with up to {PRICING.FREE_LIMIT} people is free. Bigger groups pay once for that draw.</p>
        <div className="prices">
          <div className="price"><h3>Small Hat</h3><div className="who">Friends & close family</div>
            <div className="amt"><strong>Free</strong></div>
            <ul><li>Up to {PRICING.FREE_LIMIT} people</li><li>Encrypted reveal links</li><li>Keep-apart rules</li><li>Pass-the-phone mode</li></ul>
            <Link href="/draw" className="btn btn-ghost">Start free</Link></div>
          <div className="price hot"><h3>Big Hat</h3><div className="who">Extended family, church groups, offices</div>
            <div className="amt"><strong>{naira(PRICING.ONE_TIME)}</strong><small>per draw</small></div>
            <ul><li>Up to {PRICING.MAX_PEOPLE} people</li><li>Everything in Small Hat</li><li>One big circle mode</li><li>Custom note on every reveal</li></ul>
            <Link href="/draw" className="btn btn-gold">Start a big draw</Link></div>
          <div className="price"><span className="tag soon">COMING SOON</span><h3>Year-Round Hat</h3><div className="who">Groups that stay together</div>
            <div className="amt"><strong>{naira(PRICING.YEARLY)}</strong><small>per year</small></div>
            <ul><li>Unlimited draws all year</li><li>New Year resolutions, with your Santa as your accountability partner</li><li>Secret Valentine, Sallah & birthday draws</li></ul>
            <span className="btn btn-ghost" aria-disabled="true" style={{ opacity: 0.5 }}>Coming in January</span></div>
        </div>
      </div></section>

      <div className="wrap">
        <footer className="foot">
          <span>© <Year /> {BRAND.name} · by <a href={BRAND.byUrl}>{BRAND.by}</a> · Made in Lagos 🎄</span>
          <span>Weather data from <a href="https://www.met.no/en">MET Norway</a> (CC BY 4.0)</span>
        </footer>
      </div>
    </main>
  );
}

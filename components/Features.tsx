import type { ReactNode } from "react";

// "Built for real groups": centred heading over a ruled grid of features, each
// with a small line icon beside its title. Icons are decorative (the title
// says it all), so they're hidden from screen readers.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="fg-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

// Each icon is matched to the feature its meaning fits.
const CLAY_POT = <Icon><ellipse cx="12" cy="4.75" rx="3.25" ry="1.1" /><path d="M8.75 5.5c.5 1.1.2 2-.8 2.85a6.85 6.85 0 1 0 8.1 0c-1-.85-1.3-1.75-.8-2.85" /><path d="M6.6 13c1.8 1.25 3.6-1.25 5.4 0s3.6 1.25 5.4 0" /></Icon>;
const COCOA_POD = <Icon><path d="M12 3.25c3.6 2.3 5.6 6.1 5.6 9.6 0 4.1-2.5 7.2-5.6 7.7-3.1-.5-5.6-3.6-5.6-7.7 0-3.5 2-7.3 5.6-9.6" /><path d="M12 4.5v15" /></Icon>;
const SHEKERE = <Icon><path d="M9.75 3.5h4.5m-4.5 0v3.6m4.5-3.6v3.6m-4.5-1.7h4.5" /><ellipse cx="12" cy="13.6" rx="6.6" ry="6.9" /><path d="M12 6.75v13.7M5.4 13.6h13.2" /><path d="m7.35 8.95 9.3 9.3m0-9.3-9.3 9.3" /></Icon>;
const CALABASH = <Icon><ellipse cx="12" cy="14.25" rx="6.25" ry="5.75" /><path d="M10.6 3.5h2.8" /><path d="M10.6 3.5c0 1.5.5 2.4.5 3.6 0 1.1-.75 1.85-1.35 2.6m3.65-6.2c0 1.5-.5 2.4-.5 3.6 0 1.1.75 1.85 1.35 2.6" /><path d="M7 17.5c1.65 1.15 3.35 1.15 5 0s3.35-1.15 5 0" /></Icon>;
const TALKING_DRUM = <Icon><ellipse cx="12" cy="5.5" rx="5.5" ry="1.75" /><path d="M6.5 5.5c1.4 4 1.4 9 0 13m11-13c-1.4 4-1.4 9 0 13" /><path d="M6.5 18.5a5.5 1.75 0 0 0 11 0" /><path d="m9.3 7 1.3 10m4.1-10-1.3 10M12 7.25V17" /></Icon>;
const POS = <Icon><path d="M8.75 3.5V2.25h6.5V3.5" /><rect width="11.5" height="17" x="6.25" y="3.5" rx="2" /><rect width="7" height="4" x="8.5" y="6" rx=".75" /><circle cx="9.5" cy="13.25" r=".6" /><circle cx="12" cy="13.25" r=".6" /><circle cx="14.5" cy="13.25" r=".6" /><circle cx="9.5" cy="16.5" r=".6" /><circle cx="12" cy="16.5" r=".6" /><circle cx="14.5" cy="16.5" r=".6" /></Icon>;
const DANFO = <Icon><rect width="19" height="9.75" x="2.5" y="6.5" rx="1.75" /><path d="M2.5 11.5h19M8 6.5v5m7.5-5v5" /><circle cx="7" cy="17.75" r="1.85" /><circle cx="17" cy="17.75" r="1.85" /></Icon>;
const NIGERIA_FLAG = <Icon><rect width="18.5" height="13.5" x="2.75" y="5.25" rx="1.5" /><path d="M8.92 5.25v13.5m6.16-13.5v13.5" /></Icon>;

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  { icon: CLAY_POT, title: "Organizer-blind", text: "Links are encrypted. Even the person running the draw can't peek, so they can play too." }, // a sealed pot keeps what's inside
  { icon: COCOA_POD, title: "Keep-apart rules", text: "Stop spouses, siblings or flatmates from drawing each other." }, // two halves, split down the middle
  { icon: SHEKERE, title: "One big circle", text: "Gifts go round in a single chain, so the reveal at the party goes person to person." }, // beads strung all the way round
  { icon: CALABASH, title: "Pass-the-phone", text: "All in one room? Pass one phone around and each person unwraps privately." }, // passed hand to hand at a gathering
  { icon: TALKING_DRUM, title: "WhatsApp-ready", text: "One tap sends each person their private link on WhatsApp." }, // the drum carries the message
  { icon: POS, title: "Budget in Naira", text: "Everyone sees the same spending limit, so nobody turns up with a gift that's too cheap or too much." },
  { icon: DANFO, title: "Where & when", text: "The venue and date show on every reveal, with a countdown." },
  { icon: NIGERIA_FLAG, title: "Feels like home", text: "The site's weather follows yours: harmattan haze in Lagos, snow in London. Or hit \"Let it snow\"." },
];

export default function Features() {
  return (
    <section className="band" id="features"><div className="wrap">
      <div className="fg-head">
        <div className="eyebrow">Built for real groups</div>
        <h2>For the family chat, the friend group and the office.</h2>
      </div>
      <ul className="fg-grid">
        {FEATURES.map((f) => (
          <li key={f.title} className="fg-cell">
            <h3>{f.icon}{f.title}</h3>
            <p>{f.text}</p>
          </li>
        ))}
      </ul>
    </div></section>
  );
}

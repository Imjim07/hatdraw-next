import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import SpecularButton from "@/components/SpecularButton";
import { CONTACT, brandWhatsApp, mailto, waLink } from "@/lib/config";
import { gifts } from "@/lib/copy/gifts";

const V = gifts.vendors;
export const metadata: Metadata = { title: V.meta };

// Sell on the site. No form and no database: applications go to the brand's WhatsApp
// (or sales@ by email) and are vetted there.
export default function VendorsPage() {
  const wa = brandWhatsApp();
  return (
    <InfoPage>
      <div className="eyebrow">{V.eyebrow}</div>
      <h1>{V.heading}</h1>
      <p className="sub">{V.line}</p>
      <section>
        <h2>{V.requirementsLabel}</h2>
        <ul>{V.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
      <p className="gf-policy-acts">
        {wa
          ? <SpecularButton href={waLink(V.applyText, wa)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">{V.apply}</SpecularButton>
          : <span className="btn btn-ghost btn-off" aria-disabled="true">{V.applySoon}</span>}
      </p>
      <p><a className="gf-text-link" href={mailto(CONTACT.sales, V.emailSubject)}>{V.preferEmail}</a></p>
    </InfoPage>
  );
}

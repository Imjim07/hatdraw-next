import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, brandWhatsApp, mailto, waLink } from "@/lib/config";
import { gifts } from "@/lib/copy/gifts";

const P = gifts.policy;
export const metadata: Metadata = { title: P.meta };

// The buying policy: vendors sell, take payment, deliver and refund. Never the site.
export default function PolicyPage() {
  const wa = brandWhatsApp();
  return (
    <article className="gf-policy">
      <Link href="/gifts" className="gf-text-link gp-back">{gifts.page.allGifts}</Link>
      <div className="eyebrow">{gifts.eyebrow}</div>
      <h1>{P.title}</h1>
      <p className="sub">{P.lead}</p>
      {P.sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((t) => <p key={t}>{t}</p>)}
        </section>
      ))}
      <section>
        <h2>{P.report.h}</h2>
        <p>{P.report.p}</p>
        <p className="gf-policy-acts">
          {wa && <a className="btn btn-ghost btn-sm" href={waLink(P.report.whatsappText, wa)} target="_blank" rel="noopener noreferrer">{P.report.whatsapp}</a>}
          <a className="btn btn-ghost btn-sm" href={mailto(CONTACT.support, P.report.emailSubject())}>{P.report.email}</a>
        </p>
      </section>
    </article>
  );
}

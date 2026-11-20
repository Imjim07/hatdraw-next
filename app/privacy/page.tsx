import type { Metadata } from "next";
import InfoPage, { legalDraft } from "@/components/InfoPage";
import { mailto } from "@/lib/config";
import { legal } from "@/lib/copy/legal";

const P = legal.privacy;
export const metadata: Metadata = { title: P.meta };

export default function PrivacyPage() {
  return (
    <InfoPage draft={legalDraft()}>
      <h1>{P.title}</h1>
      <p className="sub">{P.lead}</p>
      {P.sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((t) => <p key={t}>{t}</p>)}
          {s.contact && <p>{P.general} <a href={mailto(P.contact.info)}>{P.contact.info}</a></p>}
          {(s.contact || s.requests) && <p>{P.requests} <a href={mailto(P.contact.privacy, P.requestSubject)}>{P.contact.privacy}</a></p>}
        </section>
      ))}
    </InfoPage>
  );
}

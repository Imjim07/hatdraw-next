import type { Metadata } from "next";
import InfoPage, { legalDraft } from "@/components/InfoPage";
import { mailto } from "@/lib/config";
import { legal } from "@/lib/copy/legal";

const T = legal.terms;
export const metadata: Metadata = { title: T.meta };

export default function TermsPage() {
  return (
    <InfoPage draft={legalDraft()}>
      <h1>{T.title}</h1>
      <p className="sub">{T.lead}</p>
      {T.sections.map((s) => (
        <section key={s.h} id={"id" in s ? s.id : undefined}>
          <h2>{s.h}</h2>
          {s.p.map((t) => <p key={t}>{t}</p>)}
          {"refunds" in s && <p><a href={mailto(T.contact.support, T.refundSubject)}>{T.contact.support}</a></p>}
        </section>
      ))}
      <p>{T.contactLabel} <a href={mailto(T.contact.info)}>{T.contact.info}</a></p>
    </InfoPage>
  );
}

import type { ReactNode } from "react";
import StoreNav from "@/components/gifts/StoreNav";
import { common } from "@/lib/copy/common";

/** The frame for plain information pages (/vendors, /privacy, /terms): the store's top bar and policy layout. */
export default function InfoPage({ children, draft }: { children: ReactNode; draft?: boolean }) {
  return (
    <div className="wrap">
      <StoreNav />
      <main className="store">
        <article className="gf-policy">
          {draft && <div className="notice" role="note">{common.legalDraft}</div>}
          {children}
        </article>
      </main>
    </div>
  );
}

/** The draft banner shows on /privacy and /terms until LEGAL_REVIEWED=true. */
export const legalDraft = () => process.env.LEGAL_REVIEWED !== "true";

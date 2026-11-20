import type { Metadata } from "next";
import { gifts } from "@/lib/copy/gifts";
import StoreNav from "@/components/gifts/StoreNav";

export const metadata: Metadata = {
  title: gifts.meta.title,
  description: gifts.meta.description,
};

// The store uses the neutral styling (no data-mode): it isn't a Santa or ajo screen.
export default function GiftsLayout({ children }: LayoutProps<"/gifts">) {
  return (
    <div className="wrap">
      <StoreNav />
      <main className="store">{children}</main>
    </div>
  );
}

import type { Metadata } from "next";
import { BRAND } from "@/lib/config";
import StoreNav from "@/components/gifts/StoreNav";

export const metadata: Metadata = {
  title: `Gift Finder · ${BRAND.name}`,
  description: "Gifts that fit your budget, delivered in Lagos. Order on WhatsApp; the delivery fee is confirmed before you pay.",
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

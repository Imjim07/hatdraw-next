import Link from "next/link";
import { BRAND } from "@/lib/config";
import { common } from "@/lib/copy/common";

/** The wordmark only (Ojuju, heaviest weight). The top hat left over from HatDraw is gone;
 *  the final mark is being designed separately. */
export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label={common.logoHome}>
      {BRAND.display}
    </Link>
  );
}

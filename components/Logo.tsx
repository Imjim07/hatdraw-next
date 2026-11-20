import Link from "next/link";
import { BRAND } from "@/lib/config";
import { common } from "@/lib/copy/common";
import { PALETTE } from "@/lib/palette";

export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label={common.logoHome}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <ellipse cx="20" cy="31" rx="17" ry="5" fill={PALETTE.palmGold} />
        <path d="M9 31 L12 9 Q20 5 28 9 L31 31 Z" fill={PALETTE.indigo} stroke={PALETTE.cloud} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11.2 23 H28.8" stroke={PALETTE.cloud} strokeWidth="2.5" />
      </svg>
      {BRAND.display}
    </Link>
  );
}

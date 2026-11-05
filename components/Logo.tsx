import Link from "next/link";
import { BRAND } from "@/lib/config";

export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label={`${BRAND.name} home`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <ellipse cx="20" cy="31" rx="17" ry="5" fill="#E3B45A" />
        <path d="M9 31 L12 9 Q20 5 28 9 L31 31 Z" fill="#C2413B" />
        <rect x="11" y="22" width="18" height="4" fill="#E3B45A" />
      </svg>
      {BRAND.name}
    </Link>
  );
}

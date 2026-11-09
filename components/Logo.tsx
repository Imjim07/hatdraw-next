import Link from "next/link";
import { BRAND } from "@/lib/config";

export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label={`${BRAND.name} home`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <ellipse cx="20" cy="31" rx="17" ry="5" fill="#E3B45A" />
        <path d="M9 31 L12 9 Q20 5 28 9 L31 31 Z" fill="#2E4A8F" stroke="#EFE8D8" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11.2 23 H28.8" stroke="#EFE8D8" strokeWidth="2.5" />
      </svg>
      {BRAND.name}
    </Link>
  );
}

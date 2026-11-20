"use client";
import { THEME_KEY } from "@/lib/palette";
import { useTheme } from "@/lib/theme";
import { common } from "@/lib/copy/common";

// Light/dark switch for the top nav. The icon is picked by CSS (moon on the light
// page, sun on the dark one) so it's right from the first paint; the choice is
// saved and restored before paint by the script in app/layout.tsx.
export default function ThemeToggle() {
  const dark = useTheme() === "dark";
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  };
  return (
    <button type="button" className="theme-toggle" onClick={flip} aria-label={dark ? common.theme.toLight : common.theme.toDark}>
      <svg className="tt-moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <svg className="tt-sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

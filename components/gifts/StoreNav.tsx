import { common } from "@/lib/copy/common";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import SpecularButton from "@/components/SpecularButton";
import FloatingMenu, { SITE_MENU } from "@/components/ui/liquid-morph-floating-menu";

/** The top bar on the store pages: the same as /draw and /ajo. */
export default function StoreNav() {
  return (
    <nav className="top">
      <Logo />
      <span className="nav-end">
        <ThemeToggle />
        <SpecularButton href="/" className="btn btn-ghost btn-sm nav-cta">{common.home}</SpecularButton>
        <FloatingMenu items={SITE_MENU} />
      </span>
    </nav>
  );
}

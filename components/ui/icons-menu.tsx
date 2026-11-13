// Animated menu icon (after animate-ui's "menu" icon): three lines that fold into
// an X when `open`. Same geometry and motion as the original (top line rotates -45°
// about its right end, middle fades, bottom rotates 45°), done in CSS instead of the
// `motion` library so no animation runtime ships. Styles: .menu-icon in globals.css.
type MenuIconProps = { size?: number; open?: boolean; className?: string };

export function MenuIcon({ size = 24, open = false, className = "" }: MenuIconProps) {
  return (
    <svg
      className={`menu-icon${open ? " open" : ""}${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line className="mi-1" x1={4} y1={6} x2={20} y2={6} />
      <line className="mi-2" x1={4} y1={12} x2={20} y2={12} />
      <line className="mi-3" x1={4} y1={18} x2={20} y2={18} />
    </svg>
  );
}

export { MenuIcon as Menu };
export default MenuIcon;

// HatDraw palette, "Same core, two modes". The single source of truth for hex
// values used outside CSS (SVG attributes, canvas, the theme-color meta, the
// contrast test). CSS uses the matching custom properties in app/globals.css.
export const PALETTE = {
  indigo: "#1B2A5C", // headings, brand surfaces (cloth, gourd, bands), the ajo pill
  cloud: "#F4F1EA", // page background, cards; text on indigo or ink
  persimmon: "#E8553A", // Secret Santa accent (fills only, never text on cloud)
  palmGold: "#F2B33D", // ajo stripe, the gold star/bead, highlights on indigo
  ink: "#141A33", // body text, darkest surfaces
  indigoMist: "#DDE3F5", // tinted panels, selected states, ayo pits on light surfaces
  pine: "#30594B", // Secret Santa stripe (mode accent only)
  // Derived helpers, added only so text passes contrast
  textMuted: "#5A6080", // secondary text on cloud
  textMutedOnIndigo: "#A8B3D9", // secondary text on indigo
  danger: "#B8351E", // error text on cloud
} as const;

/** "r,g,b" for building rgba() strings on canvas. */
export function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

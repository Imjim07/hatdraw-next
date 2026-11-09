// Fraunces has no mark positioning for a combining accent stacked on a dotted
// letter (ẹ̀, ọ́, ṣ̀…), so the accent drifts off its letter. Precomposed letters
// (à, é, ẹ, ọ, Ṣ) are fine. Names that still contain a combining mark after
// NFC normalisation are shown in Noto Serif instead, which positions them.
const COMBINING = /[̀-ͯ]/;

/** Normalise a display name and pick the serif that can render it. */
export function serifName(s: string): { text: string; className: string } {
  const text = s.normalize("NFC");
  return { text, className: COMBINING.test(text) ? "serif yo" : "serif" };
}

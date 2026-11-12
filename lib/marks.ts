// Names are NFC-normalised so precomposed letters are used where they exist.
// Hanken Grotesk positions combining accents stacked on dotted letters
// (ẹ̀, ọ́, ṣ̀…), so every name uses the display font. (Fraunces couldn't, which
// is why this once switched some names to a fallback font.)

/** Normalise a display name and pick the display-font class. */
export function serifName(s: string): { text: string; className: string } {
  return { text: s.normalize("NFC"), className: "serif" };
}

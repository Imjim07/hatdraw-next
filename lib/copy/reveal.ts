import { BRAND, SUPPORT_EMAIL, mailto } from "@/lib/brand";

// The reveal page (/r) around the reveal screen: opening, errors and the loop back.
// Source: docs/copy-deck.md, "Reveal page" and "Errors". /r has a tight first-load
// JavaScript budget, so the screen's own words are in revealScreen.ts (loaded with it).
export const reveal = {
  opening: "Opening your cloth",
  broken: "This link looks broken. Ask your organiser to resend it.",
  stillStuck: "Still stuck? Email support",
  stillStuckHref: mailto(SUPPORT_EMAIL, "Broken reveal link"),
  network: `Couldn't reach ${BRAND.name}. Check your connection and try again.`,
  loopBack: `Run your own draw on ${BRAND.name}`,
  hmm: "Hmm",
  goHome: `Go to ${BRAND.name}`,
};

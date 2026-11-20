import { naira } from "@/lib/config";

// The reveal screen: the starch, the taps, the match and its details. Source:
// docs/copy-deck.md, "Reveal page". Loaded with the screen itself, after the page.
export const revealScreen = {
  hi: "Hi",
  before: "Your cloth is still covered in starch. Tap it three times to beat the starch off.",
  explainer: "Adire makers beat dried starch off the cloth to reveal the pattern.",
  midTaps: (left: number) => (left === 1 ? "One more." : `Keep going, ${left} more taps.`),
  gifting: "This Christmas, you're gifting",
  keepIt: "Keep it to yourself.",
  clothLabel: (left: number) => `Tap to beat the starch, ${left} left`,
  clothOpen: (name: string) => `You're gifting ${name}`,
  preview: "preview",
  budget: "Budget",
  giftDay: "Gift day",
  where: "Where",
  daysToGo: (d: number) => (d > 1 ? `${d} days to go` : d === 1 ? "Tomorrow" : d === 0 ? "Today" : "Already passed"),
  idea: { head: "Stuck for ideas?", idle: "Spin for a gift idea", spin: "Spin", again: "Spin again" },
  seeGifts: (budget: string) => `See gifts under ${naira(budget)}`,
  fromOrganiser: "(from the organiser)",
};

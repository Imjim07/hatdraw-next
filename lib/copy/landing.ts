import { BRAND, PRICING, naira } from "@/lib/config";

// The landing page. Source: docs/copy-deck.md, "Landing page".
const SHEKERE = "ṣẹ̀kẹ̀rẹ̀";

export const landing = {
  meta: {
    title: `${BRAND.name}: fair draws for Secret Santa and ajo`,
    description: "Run your Secret Santa, settle your ajo payout order, or pick a giveaway winner. Everyone can see it was fair.",
  },
  hero: {
    eyebrow: `${BRAND.display} · destiny`,
    // The headline is split so the second half keeps its emphasis.
    headline: ["Fair draws,", "for whatever needs one."] as const,
    subline: "Run your Secret Santa, settle your ajo payout order, or pick a giveaway winner. Everyone can see it was fair.",
    toggle: { santa: "Secret Santa", ajo: "Ajo payout order" },
    santa: {
      line: `Drop everyone's name in the ${SHEKERE}. Each person gets a private link to see who they're gifting.`,
      button: "Start a Secret Santa",
      smallPrint: [`Free up to ${PRICING.FREE_LIMIT} people`, "No sign-up"],
    },
    ajo: {
      line: "Draw your group's payout order once, in front of everyone, and share one schedule to WhatsApp.",
      button: "Draw an ajo order",
      smallPrint: ["Free", `${BRAND.name} never holds your money`],
    },
  },
  countdown: {
    coming: "Christmas is coming",
    days: (d: number) => `${d} days to Christmas`,
    tomorrow: "Christmas is tomorrow!",
    today: "It's Christmas! 🎄",
    after: "Planning next Christmas already?",
  },
  offers: {
    eyebrow: `What ${BRAND.name} offers`,
    heading: "One fair draw, many uses.",
    subline: "Built for two Nigerian traditions, and ready for any event that needs a fair pick.",
    soon: "Coming soon",
    cards: {
      santa: {
        title: "Secret Santa",
        line: "Everyone gets a private link and beats the starch to see who they're gifting.",
        points: ["Private links", "Keep couples apart", "Pass-the-phone mode"],
        link: "Start a Secret Santa",
      },
      ajo: {
        title: "Ajo payout order",
        line: "Draw the order once, in front of everyone.",
        points: ["Locked or live draw", "Reminders before each turn", "Swaps both members agree to"],
        link: "Draw an ajo order",
      },
      gifts: {
        title: "Gift Finder",
        line: "Gifts from trusted Nigerian vendors, by budget.",
        points: ["Browse by budget", "Order on WhatsApp", "Vendors deliver"],
        link: "Find a gift",
      },
      giveaway: {
        title: "Giveaway picker",
        line: "For vendors: pick winners fairly, with a link your followers can check.",
        points: [] as string[],
      },
    },
    promisesLabel: "Our promises",
    promises: ["Fair and recorded", "No sign-up", "WhatsApp-first", "Free for small groups", "Draws never touch your money"],
  },
  how: {
    eyebrow: "How it works",
    heading: "Three steps. Two minutes.",
    subline: "No apps to install and no accounts. Everyone keeps their surprise until gift day.",
    step: (n: number) => `Step ${n}`,
    santa: [
      { title: "String the names.", text: "Add everyone, or paste your WhatsApp list." },
      { title: `Shake the ${SHEKERE}.`, text: "Nobody draws themselves. Couples can be kept apart." },
      { title: "Beat the starch.", text: "Each person taps their cloth three times to see their match." },
    ],
    ajo: [
      { title: "Add your members.", text: "Set the amount, how often, and the start date." },
      { title: "Draw in front of everyone.", text: "Draw now, or live so the whole group watches." },
      { title: "Share the schedule.", text: "One link for the group chat, with reminders before every turn." },
    ],
  },
  giftTeaser: {
    heading: "Know who you're gifting? Find them something good.",
    line: "Gifts from Nigerian vendors, sorted by budget. You order straight from the vendor on WhatsApp.",
    button: "Browse gifts",
  },
  pricing: {
    eyebrow: "Pricing",
    heading: "Free for small groups. One small fee for big ones.",
    subline: `Any Secret Santa with up to ${PRICING.FREE_LIMIT} people is free. Bigger groups pay once per draw.`,
    monthly: "Monthly",
    yearly: "Yearly",
    billingPeriod: "Billing period",
    saveUpTo: (pct: number) => `Save up to ${pct}%`,
    free: "Free",
    perDraw: "per draw",
    perYear: "per year",
    small: {
      name: "Small circle",
      who: `Secret Santa for up to ${PRICING.FREE_LIMIT} people`,
      note: "Always free",
      features: [`Up to ${PRICING.FREE_LIMIT} people`, "Encrypted reveal links", "Keep-apart rules", "Pass-the-phone mode"],
      cta: "Start a Secret Santa",
    },
    big: {
      name: "Big circle",
      who: `Offices, churches and big families, up to ${PRICING.MAX_PEOPLE} people`,
      noteMonthly: "Pay once for each draw",
      noteYearly: `Billed ${naira(PRICING.BIG_CIRCLE_YEARLY)} once a year`,
      features: [`Up to ${PRICING.MAX_PEOPLE} people`, "Everything in Small circle", "One big circle mode", "Custom note on every reveal"],
      cta: "Start a big draw",
      ctaYearly: "Yearly coming soon",
      talkToUs: "Planning for a big office or church? Talk to us",
      talkSubject: "Big circle for [organisation]",
    },
    ajo: {
      name: "Ajo",
      who: `Any group size. ${BRAND.name} never holds money`,
      note: "Always free",
      features: ["Locked or live draw", "Reminders before each turn", "Swaps both members agree to"],
      cta: "Draw an ajo order",
    },
  },
  faq: [
    { q: "Is it really random?", a: "Yes. The draw runs on our server with secure randomness, so nobody can rig it, the organiser included." },
    { q: "Can the organiser see who got who?", a: "Not unless they choose to. Links are encrypted, so the organiser can play too." },
    { q: `Does ${BRAND.name} hold our ajo money?`, a: `No. ${BRAND.name} draws the order and sends reminders. Your group pays the way it always has.` },
    { q: "Do people need to sign up?", a: "No. Everyone just opens their link." },
    { q: "Who sells the gifts?", a: "Independent vendors. You order and pay on their WhatsApp, and they deliver." },
    { q: `What does ${BRAND.name} mean?`, a: `From kádàrá (Yoruba) and kaddara (Hausa): destiny. Built by ${BRAND.by} in Lagos.` },
  ],
  nav: { sections: "Sections", how: "How it works", offers: "What we offer", pricing: "Pricing", gifts: "Gifts" },
};

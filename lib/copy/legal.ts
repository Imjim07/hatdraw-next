import { BRAND, CONTACT } from "@/lib/config";

// /privacy and /terms, in plain words. Written only from the facts the owner gave
// (see the Claude Code prompt of 2026-11-20); nothing here may be added without one.
// A "Draft, pending legal review" banner shows until LEGAL_REVIEWED=true.
export const legal = {
  privacy: {
    title: "Privacy",
    meta: `Privacy · ${BRAND.name}`,
    lead: "We keep as little about you as we can, and we delete it on a schedule.",
    sections: [
      { h: "Who we are", p: [`${BRAND.name} is built by ${BRAND.by} in Lagos, Nigeria.`], contact: true },
      { h: "Secret Santa", p: ["We don't store your list. Names exist only inside the private links."] },
      { h: "Ajo", p: ["We store the group name, member names, amounts, dates and swaps so the schedule works.", "We delete a group 90 days after its last turn."] },
      { h: "Emails", p: ["Only members who ask for reminders give us an email address.", "\"Stop reminders\" deletes it."] },
      { h: "Payments", p: ["Paystack handles payments. We keep the payment reference, not your card details or your email."] },
      { h: "Gifts", p: ["Vendors, not us, receive your order details on WhatsApp."] },
      { h: "Weather", p: ["We use your rough city from your connection to pick the page's weather. We don't store it."] },
      { h: "Who helps us", p: ["Resend delivers our emails. Supabase hosts our database."] },
      { h: "Your rights", p: ["Ask us to see or delete your data.", "The Nigeria Data Protection Act 2023 applies."], requests: true },
    ],
    general: "General questions:",
    requests: "Data requests:",
    requestSubject: "Data request",
    contact: CONTACT,
  },
  terms: {
    title: "Terms",
    meta: `Terms · ${BRAND.name}`,
    lead: `The rules for using ${BRAND.name}, in plain words.`,
    sections: [
      { h: "Draws", p: ["Draws are random and run on our server.", "We don't guarantee any outcome beyond a fair draw."] },
      { h: "Ajo", p: [`${BRAND.name} never holds, moves or guarantees ajo money.`, "Members are responsible for paying each other."] },
      { h: "Gifts", p: ["Gifts are sold by independent vendors.", "The sale is between the buyer and the vendor."] },
      { h: "Big circle", p: ["Big circle payments are one-time and cover one draw."] },
      { h: "Fair use", p: [`Don't use ${BRAND.name} for gambling, lotteries or anything illegal.`] },
    ],
    contactLabel: "Contact:",
    contact: CONTACT,
  },
};

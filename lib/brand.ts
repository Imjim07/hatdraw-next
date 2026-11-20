// The brand name and contact addresses. Re-exported by lib/config.ts; kept in its own
// small module so pages with a tight JavaScript budget (/r) can import just this.
export const BRAND = {
  /** Running text, emails, WhatsApp messages, metadata, page titles. */
  name: "Kádàrá",
  /** The logo, the hero eyebrow and the FAQ answer about the name. */
  display: "Kádàrá",
  domain: "kadaradraw.com",
  url: "https://kadaradraw.com",
  by: "Capricorn Hub",
  byUrl: "https://capricornhub.com",
};

/** Support's address (broken links, payments, reminders, vendor reports). Also CONTACT.support. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_EMAIL_SUPPORT || "support@" + BRAND.domain;

/** A mailto: link, with an optional prefilled subject. */
export const mailto = (address: string, subject?: string) =>
  `mailto:${address}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;


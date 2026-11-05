export type Kind = "friends" | "family" | "company";

export type EventInfo = {
  name: string;
  kind: Kind;
  budget: string; // digits only
  date: string; // YYYY-MM-DD
  where: string;
  note: string;
};

/** What a reveal link decrypts to. */
export type RevealPayload = {
  v: 1;
  e: EventInfo;
  g: string; // giver
  r: string; // receiver
};

export type DrawRequest = {
  event: EventInfo;
  people: string[];
  ex: [string, string][];
  circle: boolean;
  blind: boolean;
  reference?: string; // Paystack reference for paid draws
};

export type DrawResponse =
  | { ok: true; circle: boolean; demoUnlock: boolean; givers: { name: string; token: string }[]; pairs?: [string, string][] }
  | { ok: false; error: string; needsPayment?: boolean };

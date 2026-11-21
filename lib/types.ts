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
  reference?: string; // KDR- payment reference for paid draws (from /api/pay/start)
  passCode?: string; // or a Year pass code
};

export type DrawResponse =
  | { ok: true; circle: boolean; demoUnlock: boolean; givers: { name: string; token: string }[]; pairs?: [string, string][]; pass?: { expiresAt: string; drawsLeft: number } }
  | { ok: false; error: string; needsPayment?: boolean; code?: string; upgradeFrom?: string; extraKobo?: number };

import { ajo as A } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";
import { MAX_AMOUNT, MAX_MEMBERS, MIN_MEMBERS, isIsoDate, validatePins } from "@/lib/ajo/logic";
import { hashToken, newPublicId, newToken } from "@/lib/ajo/tokens";
import { clip, fail, ok, readJson, withStore } from "@/lib/ajo/server";
import type { Frequency } from "@/lib/ajo/types";

const FREQUENCIES: Frequency[] = ["weekly", "biweekly", "monthly"];

// Create a group. Returns the admin token and one token per member: shown once,
// to the organiser only. Only their SHA-256 hashes are stored.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail(common.invalidRequest);

  const name = clip(body.name, 60);
  if (!name) return fail(A.errors.noName);

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) return fail(A.errors.badAmount);

  const frequency = body.frequency as Frequency;
  if (!FREQUENCIES.includes(frequency)) return fail(A.errors.noFrequency);

  const startDate = String(body.startDate ?? "");
  if (!isIsoDate(startDate)) return fail(A.errors.noStart);

  const seen = new Set<string>();
  const members: string[] = [];
  for (const raw of Array.isArray(body.members) ? body.members.slice(0, MAX_MEMBERS + 50) : []) {
    const m = clip(raw, 40);
    if (!m || seen.has(m.toLowerCase())) continue;
    seen.add(m.toLowerCase());
    members.push(m);
  }
  if (members.length < MIN_MEMBERS) return fail(A.errors.tooFew(MIN_MEMBERS));
  if (members.length > MAX_MEMBERS) return fail(A.errors.tooMany(MAX_MEMBERS));

  const pins = (Array.isArray(body.pins) ? body.pins.slice(0, MAX_MEMBERS) : [])
    .map((p) => ({ member: clip((p as { name?: unknown })?.name, 40), turn: Number((p as { turn?: unknown })?.turn) }));
  try { validatePins(members, pins); } catch (e) { return fail((e as Error).message); }
  const pinOf = new Map(pins.map((p) => [p.member, p.turn]));

  return withStore(async (s) => {
    const adminToken = newToken();
    const tokens = members.map(() => newToken());
    const group = await s.createGroup(
      {
        public_id: newPublicId(),
        name,
        amount_naira: amount,
        frequency,
        start_date: startDate,
        admin_token_hash: hashToken(adminToken),
      },
      members.map((m, i) => ({ name: m, token_hash: hashToken(tokens[i]), pinned_turn: pinOf.get(m) ?? null })),
    );
    // Research (opt-in): four anonymous numbers in a table with no link back to the group.
    if (body.researchConsent === true) {
      await s.recordResearch({ group_size: members.length, amount_naira: amount, frequency, created_month: group.created_at.slice(0, 7) + "-01" });
    }
    return ok({ publicId: group.public_id, adminToken, members: members.map((m, i) => ({ name: m, token: tokens[i] })) }, 201);
  });
}

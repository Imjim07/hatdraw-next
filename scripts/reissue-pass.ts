// Support tool: a new code for a lost Year pass, found by its Paystack reference.
// The old code stops working; the expiry and the draws already used stay the same.
// Only the new code's hash is stored. Nothing about the buyer is read or printed.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/reissue-pass.ts KDR-XXXXXXXXXX
//
// (Node 22.18+ runs TypeScript files directly.)
import { createHash, randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // as in lib/payments.ts
const MAX_DRAWS = 25; // PRICING.YEAR_PASS.maxDraws

const reference = (process.argv[2] ?? "").trim().toUpperCase();
if (!/^KDR-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{10}$/.test(reference)) {
  console.error("Usage: node scripts/reissue-pass.ts KDR-XXXXXXXXXX  (the Paystack reference of the pass payment)");
  process.exit(1);
}
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: pass, error } = await db.from("year_passes").select("expires_at,draws_used").eq("payment_reference", reference).maybeSingle();
if (error) { console.error("Couldn't read year_passes:", error.message); process.exit(1); }
if (!pass) { console.error(`No Year pass for ${reference}. Check the reference in the Paystack dashboard (it must be a paid Year pass).`); process.exit(1); }

const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const code = `KDR-${group()}-${group()}-${group()}-${group()}`;
const hash = createHash("sha256").update(code).digest("hex");
const upd = await db.from("year_passes").update({ code_hash: hash, code_issued: true }).eq("payment_reference", reference);
if (upd.error) { console.error("Couldn't save the new code:", upd.error.message); process.exit(1); }

const until = new Date(pass.expires_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
console.log(`New Year pass code: ${code}`);
console.log(`Valid until ${until}. Draws left: ${Math.max(0, MAX_DRAWS - pass.draws_used)} of ${MAX_DRAWS}. The old code no longer works.`);

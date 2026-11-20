import { unseal } from "@/lib/seal";
import type { RevealPayload } from "@/lib/types";
import { reveal } from "@/lib/copy/reveal";

// POST (not GET) so the token never lands in server/CDN access logs.
export async function POST(req: Request) {
  let token = "";
  try { token = String((await req.json())?.token ?? ""); } catch {}
  const data = token ? unseal<RevealPayload>(token) : null;
  if (!data || data.v !== 1) {
    return Response.json({ ok: false, error: reveal.broken }, { status: 400 });
  }
  return Response.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}

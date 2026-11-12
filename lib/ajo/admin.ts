// SERVER ONLY. Admin-token check shared by the admin routes.
import { looksLikeToken, tokenMatches } from "./tokens";
import { PUBLIC_ID } from "./server";
import type { AjoStore } from "./store";
import type { GroupRow } from "./types";

export async function adminGroup(s: AjoStore, publicId: string, token: unknown): Promise<GroupRow | null> {
  if (!PUBLIC_ID.test(publicId) || !looksLikeToken(token)) return null;
  const group = await s.getGroup(publicId);
  return group && tokenMatches(token, group.admin_token_hash) ? group : null;
}

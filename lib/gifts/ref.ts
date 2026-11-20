// SERVER ONLY. Order refs that tie a WhatsApp order to the click that sent it.
import { randomInt } from "node:crypto";

/** Letters and digits that can't be misread: no 0/O, no 1/I/L. */
export const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const REF_PATTERN = /^CDR-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

/** "CDR-" plus 6 characters, from a cryptographic random source. Server only. */
export function newRef(pick = (n: number) => randomInt(n)): string {
  let s = "CDR-";
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[pick(REF_ALPHABET.length)];
  return s;
}


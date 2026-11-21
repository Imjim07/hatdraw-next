import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });

describe("Secret Santa stays stateless", () => {
  // Every console call in the draw and reveal routes, with its arguments.
  const calls = ["app/api/draw", "app/api/reveal"].flatMap(files).flatMap((f) =>
    [...readFileSync(f, "utf8").matchAll(/console\.(log|info|warn|error|debug)\(([^;]*)\)/g)].map((m) => ({ f, args: m[2] })));

  it("never logs the body, names, tokens or the decrypted payload", () => {
    for (const c of calls) expect(c.args, c.f).not.toMatch(/\b(body|names?|people|tokens?|payload|data|givers?|pairs?|req)\b/i);
  });

  it("never writes Santa data to a database", () => {
    for (const f of ["app/api/draw", "app/api/reveal"].flatMap(files)) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/supabase|\.insert\(|\.from\(/i);
    }
  });
});

describe("Paystack records", () => {
  it("have no email, name or card column in the payment and pass tables", () => {
    const sql = readdirSync("supabase/migrations").filter((f) => f >= "20261121").map((f) => readFileSync(join("supabase/migrations", f), "utf8")).join("\n");
    for (const t of ["payments", "year_passes"]) {
      const body = sql.match(new RegExp(`create table ${t} \\(([\\s\\S]*?)\\n\\);`))![1];
      expect(body, t).not.toMatch(/email|name|card|phone/i);
    }
  });
  it("are written without any email", () => {
    for (const f of ["lib/payments.ts", "lib/paywall.ts", "app/api/pay/start/route.ts", "app/api/paystack/webhook/route.ts", "app/api/pass/issue/route.ts"]) {
      const src = readFileSync(f, "utf8").replace(/\/\/.*$/gm, "");
      expect(src, f).not.toMatch(/\bemail\b/i);
    }
  });
});

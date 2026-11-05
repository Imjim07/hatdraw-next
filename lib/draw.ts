// Pure draw logic: no DOM, no Node APIs. The RNG is injected so the
// server can use crypto-grade randomness and tests can use a seed.
export type Rng = (n: number) => number; // returns an int in [0, n)
export type Pair = [giver: string, receiver: string];
export type Exclusion = [string, string];

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeBlocked(ex: Exclusion[]) {
  const set = new Set(ex.flatMap(([a, b]) => [`${a}\u0000${b}`, `${b}\u0000${a}`]));
  return (a: string, b: string) => a === b || set.has(`${a}\u0000${b}`);
}

/** One big chain A→B→C→…→A. Returns null if the rules make it too hard. */
export function drawCircle(people: string[], ex: Exclusion[], rng: Rng, tries = 4000): Pair[] | null {
  const blocked = makeBlocked(ex);
  for (let t = 0; t < tries; t++) {
    const o = shuffle(people, rng);
    let ok = true;
    for (let i = 0; i < o.length; i++) {
      if (blocked(o[i], o[(i + 1) % o.length])) { ok = false; break; }
    }
    if (ok) return o.map((g, i) => [g, o[(i + 1) % o.length]]);
  }
  return null;
}

/** Any valid assignment (backtracking). Returns null if impossible. */
export function drawAny(people: string[], ex: Exclusion[], rng: Rng): Pair[] | null {
  const blocked = makeBlocked(ex);
  const givers = shuffle(people, rng);
  const used = new Set<string>();
  const res: Pair[] = [];
  let guard = 0;
  const bt = (i: number): boolean => {
    if (++guard > 200_000) return false;
    if (i === givers.length) return true;
    for (const r of shuffle(people, rng)) {
      if (used.has(r) || blocked(givers[i], r)) continue;
      used.add(r); res.push([givers[i], r]);
      if (bt(i + 1)) return true;
      used.delete(r); res.pop();
    }
    return false;
  };
  bt(0);
  return res.length === people.length ? res : null;
}

export function draw(people: string[], ex: Exclusion[], circle: boolean, rng: Rng) {
  if (circle) {
    const c = drawCircle(people, ex, rng);
    if (c) return { pairs: c, circle: true };
  }
  const a = drawAny(people, ex, rng);
  return a ? { pairs: a, circle: false } : null;
}

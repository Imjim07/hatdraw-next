import { describe, expect, it } from "vitest";
import { tierFor } from "./pricing";

describe("tierFor", () => {
  it("is free up to 15 people", () => {
    expect(tierFor(3)).toBeNull();
    expect(tierFor(15)).toBeNull();
  });
  it("is Mid circle for 16–50", () => {
    expect(tierFor(16)?.id).toBe("mid");
    expect(tierFor(50)?.id).toBe("mid");
    expect(tierFor(16)?.price).toBe(1500);
  });
  it("is Big circle for 51–500", () => {
    expect(tierFor(51)?.id).toBe("big");
    expect(tierFor(500)?.id).toBe("big");
    expect(tierFor(500)?.price).toBe(7500);
  });
  it("throws above 500", () => {
    expect(() => tierFor(501)).toThrow();
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("@/config", () => ({ default: { namespace: "mainnet" } }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/graphql-api/lib/find-domains/find-domains-by-labelhash-path", () => ({}));

import { isEffectiveDesc } from "./find-domains-resolver-helpers";

describe("isEffectiveDesc", () => {
  it("ASC + not inverted = not desc", () => {
    expect(isEffectiveDesc("ASC", false)).toBe(false);
  });

  it("ASC + inverted = desc", () => {
    expect(isEffectiveDesc("ASC", true)).toBe(true);
  });

  it("DESC + not inverted = desc", () => {
    expect(isEffectiveDesc("DESC", false)).toBe(true);
  });

  it("DESC + inverted = not desc", () => {
    expect(isEffectiveDesc("DESC", true)).toBe(false);
  });
});

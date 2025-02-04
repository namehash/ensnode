import { describe, expect, it } from "vitest";

import { heal } from "../src/lib/label-helpers";

describe("heal", () => {
  it("heals a labelhash", async () => {
    const labelhash = "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc";
    const label = await heal(labelhash);

    expect(label).toEqual("vitalik");
  });

  it("returns undefined for an invalid labelhash", async () => {
    const labelhash = "0xinvalid";
    const label = await heal(labelhash);

    expect(label).toBeUndefined();
  });
});

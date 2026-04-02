import { describe, it, expect } from "vitest";
import { client } from "@/test/integration/resolution-api-client";

describe("GET /api/resolve/primary-names/:address", () => {
  it.each([
    {
      description: "resolves primary names for owner address on chain 1 (no primary name set in devnet)",
      input: { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", options: { chainIds: [1] } },
      expected: { names: { "1": null }, accelerationRequested: false, accelerationAttempted: false },
    },
    {
      description: "returns null for address with no primary name on chain 1",
      input: { address: "0x000000000000000000000000000000000000dead", options: { chainIds: [1] } },
      expected: { names: { "1": null }, accelerationRequested: false, accelerationAttempted: false },
    },
  ])("$description", async ({ input, expected }) => {
    const result = await client.resolvePrimaryNames(input.address as `0x${string}`, input.options);
    expect(result).toMatchObject(expected);
  });
});

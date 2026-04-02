import { describe, it, expect } from "vitest";
import { client } from "@/test/integration/resolution-api-client";

describe("GET /api/resolve/primary-name/:address/:chainId", () => {
  it.each([
    {
      description: "resolves primary name for owner address on chain 1 (no primary name set in devnet)",
      input: { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", chainId: 1 },
      expected: { name: null, accelerationRequested: false, accelerationAttempted: false },
    },
    {
      description: "resolves primary name for user address on chain 1 (no primary name set in devnet)",
      input: { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", chainId: 1 },
      expected: { name: null, accelerationRequested: false, accelerationAttempted: false },
    },
    {
      description: "returns null for address with no primary name",
      input: { address: "0x000000000000000000000000000000000000dead", chainId: 1 },
      expected: { name: null, accelerationRequested: false, accelerationAttempted: false },
    },
    {
      description: "owner address with accelerate=true returns accelerationRequested: true",
      input: {
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        chainId: 1,
        options: { accelerate: true },
      },
      expected: { accelerationRequested: true },
    },
  ])("$description", async ({ input, expected }) => {
    const result = await client.resolvePrimaryName(input.address, input.chainId, input.options);
    expect(result).toMatchObject(expected);
  });
});

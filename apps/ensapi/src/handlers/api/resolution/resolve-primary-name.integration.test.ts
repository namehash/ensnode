import { describe, expect, it } from "vitest";

const BASE_URL = process.env.ENSNODE_URL || "http://localhost:4334";

describe("GET /api/resolve/primary-name/:address/:chainId", () => {
  it.each([
    {
      description:
        "resolves primary name for owner address on chain 1 (no primary name set in devnet)",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      chainId: "1",
      query: "",
      expectedStatus: 200,
      expectedBody: { name: null, accelerationRequested: false, accelerationAttempted: false },
    },
    {
      description:
        "resolves primary name for user address on chain 1 (no primary name set in devnet)",
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      chainId: "1",
      query: "",
      expectedStatus: 200,
      expectedBody: { name: null, accelerationRequested: false, accelerationAttempted: false },
    },
    {
      description: "returns null for address with no primary name",
      address: "0x000000000000000000000000000000000000dead",
      chainId: "1",
      query: "",
      expectedStatus: 200,
      expectedBody: { name: null, accelerationRequested: false, accelerationAttempted: false },
    },
    {
      description: "owner address with accelerate=true returns accelerationRequested: true",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      chainId: "1",
      query: "accelerate=true",
      expectedStatus: 200,
      expectedBody: { accelerationRequested: true, accelerationAttempted: false },
    },
    {
      description: "returns 400 for invalid (non-hex) address",
      address: "notanaddress",
      chainId: "1",
      query: "",
      expectedStatus: 400,
      expectedBody: {
        message: "Invalid Input",
        details: {
          errors: [],
          properties: {
            address: {
              errors: ["EVM address must be a valid EVM address"],
            },
          },
        },
      },
    },
    {
      description: "returns 400 for non-numeric chainId",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      chainId: "notachainid",
      query: "",
      expectedStatus: 400,
      expectedBody: {
        message: "Invalid Input",
        details: {
          errors: [],
          properties: {
            chainId: {
              errors: ["Defaultable Chain ID String must represent a non-negative integer (>=0)."],
            },
          },
        },
      },
    },
  ])("$description", async ({ address, chainId, query, expectedStatus, expectedBody }) => {
    const response = await fetch(
      `${BASE_URL}/api/resolve/primary-name/${address}/${chainId}${query ? `?${query}` : ""}`,
    );
    const body = await response.json();

    expect(response.status).toBe(expectedStatus);
    expect(body).toMatchObject(expectedBody);
  });
});

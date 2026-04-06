import { describe, expect, it } from "vitest";

const BASE_URL = process.env.ENSNODE_URL || "http://localhost:4334";

describe("GET /api/resolve/primary-names/:address", () => {
  it.each([
    {
      description:
        "resolves primary names for owner address on chain 1 (no primary name set in devnet)",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      query: "chainIds=1",
      expectedStatus: 200,
      expectedBody: {
        names: { "1": null },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "returns null for address with no primary name on chain 1",
      address: "0x000000000000000000000000000000000000dead",
      query: "chainIds=1",
      expectedStatus: 200,
      expectedBody: {
        names: { "1": null },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "resolves primary names across all supported chains when chainIds is omitted",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      query: "",
      expectedStatus: 200,
      expectedBody: {
        names: { "1": null, "15658733": null },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "returns 400 for invalid (non-hex) address",
      address: "notanaddress",
      query: "chainIds=1",
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
      description: "returns 400 when chainIds contains the default chain id (0)",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      query: "chainIds=0",
      expectedStatus: 400,
      expectedBody: {
        message: "Invalid Input",
        details: {
          errors: [],
          properties: {
            chainIds: {
              errors: [],
              items: [
                {
                  errors: ["Must not be the 'default' EVM chain id (0)."],
                },
              ],
            },
          },
        },
      },
    },
    {
      description: "returns 400 when chainIds contains duplicate chain ids",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      query: "chainIds=1,1",
      expectedStatus: 400,
      expectedBody: {
        message: "Invalid Input",
        details: {
          errors: [],
          properties: {
            chainIds: {
              errors: ["Must be a set of unique entries."],
            },
          },
        },
      },
    },
  ])("$description", async ({ address, query, expectedStatus, expectedBody }) => {
    const response = await fetch(
      `${BASE_URL}/api/resolve/primary-names/${address}${query ? `?${query}` : ""}`,
    );
    const body = await response.json();

    expect(response.status).toBe(expectedStatus);
    expect(body).toMatchObject(expectedBody);
  });
});

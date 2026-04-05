import { describe, expect, it } from "vitest";

const BASE_URL = process.env.ENSNODE_URL || "http://localhost:4334";

const OWNER = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

describe("GET /api/resolve/records/:name", () => {
  it.each([
    {
      description: "resolves ETH address (coin 60) for test.eth",
      name: "test.eth",
      query: "addresses=60",
      expectedStatus: 200,
      expectedBody: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description:
        "resolves ETH address for newowner.eth (coin 60 stays as original registrant after token transfer)",
      name: "newowner.eth",
      query: "addresses=60",
      expectedStatus: 200,
      expectedBody: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "resolves description text record for example.eth",
      name: "example.eth",
      query: "texts=description",
      expectedStatus: 200,
      expectedBody: {
        records: { texts: { description: "example.eth" } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description:
        "resolves description text record for alias.eth (resolves via alias to test.eth)",
      name: "alias.eth",
      query: "texts=description",
      expectedStatus: 200,
      expectedBody: {
        records: { texts: { description: "test.eth" } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "resolves both address and text records for example.eth",
      name: "example.eth",
      query: "addresses=60&texts=description",
      expectedStatus: 200,
      expectedBody: {
        records: {
          addresses: { 60: OWNER },
          texts: { description: "example.eth" },
        },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "returns null address for reserved.eth (no resolver)",
      name: "reserved.eth",
      query: "addresses=60",
      expectedStatus: 200,
      expectedBody: {
        records: { addresses: { 60: null } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description:
        "returns old coin 60 record for sub.unregistered.eth (token burned but resolver records persist)",
      name: "sub.unregistered.eth",
      query: "addresses=60",
      expectedStatus: 200,
      expectedBody: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "returns null address for nonexistent name",
      name: "thisnamedoesnotexist.eth",
      query: "addresses=60",
      expectedStatus: 200,
      expectedBody: {
        records: { addresses: { 60: null } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "resolves ETH address for linked.parent.eth (alias to sub1.sub2.parent.eth)",
      name: "linked.parent.eth",
      query: "addresses=60",
      expectedStatus: 200,
      expectedBody: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description:
        "resolves ETH address for wallet.linked.parent.eth (alias to wallet.sub1.sub2.parent.eth)",
      name: "wallet.linked.parent.eth",
      query: "addresses=60",
      expectedStatus: 200,
      expectedBody: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "test.eth with accelerate=true returns accelerationRequested: true",
      name: "test.eth",
      query: "addresses=60&accelerate=true",
      expectedStatus: 200,
      expectedBody: {
        records: { addresses: { 60: OWNER } },
        accelerationRequested: true,
        accelerationAttempted: false,
      },
    },
    {
      description: "returns 400 when selection is empty (no addresses, texts, or name)",
      name: "test.eth",
      query: "",
      expectedStatus: 400,
      expectedBody: {
        message: "Invalid Input",
        details: { errors: ["Selection cannot be empty."] },
      },
    },
    {
      description: "returns 400 when name is not normalized (uppercase)",
      name: "TEST.ETH",
      query: "addresses=60",
      expectedStatus: 400,
      expectedBody: {
        message: "Invalid Input",
        details: {
          errors: [],
          properties: {
            name: {
              errors: ["Must be normalized, see https://docs.ens.domains/resolution/names/"],
            },
          },
        },
      },
    },
    {
      description: "returns 400 when addresses contains a non-numeric coin type",
      name: "test.eth",
      query: "addresses=notacointype",
      expectedStatus: 400,
      expectedBody: {
        message: "Invalid Input",
        details: {
          errors: [],
          properties: {
            addresses: {
              errors: [],
              items: [
                {
                  errors: ["Coin Type String must represent a non-negative integer (>=0)."],
                },
              ],
            },
          },
        },
      },
    },
    {
      description: "returns 400 when addresses contains duplicate coin types",
      name: "test.eth",
      query: "addresses=60,60",
      expectedStatus: 400,
      expectedBody: {
        message: "Invalid Input",
        details: {
          errors: [],
          properties: {
            addresses: {
              errors: ["Must be a set of unique entries."],
            },
          },
        },
      },
    },
    {
      description: "returns 400 when texts contains duplicate keys",
      name: "test.eth",
      query: "texts=avatar,avatar",
      expectedStatus: 400,
      expectedBody: {
        message: "Invalid Input",
        details: {
          errors: [],
          properties: {
            texts: {
              errors: ["Must be a set of unique entries."],
            },
          },
        },
      },
    },
  ])("$description", async ({ name, query, expectedStatus, expectedBody }) => {
    const encodedName = encodeURIComponent(name);
    const response = await fetch(`${BASE_URL}/api/resolve/records/${encodedName}?${query}`);
    const body = await response.json();

    expect(response.status).toBe(expectedStatus);
    expect(body).toMatchObject(expectedBody);
  });
});

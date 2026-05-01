// NOTE: These integration tests target an ENSNode instance running against the ens-test-env ENS namespace.
// The ens-test-env is a deterministic deployment of the ENS protocol to a local Anvil chain — it is
// NOT Ethereum Mainnet or any public testnet. Therefore, chainId 1 referenced in these tests refers
// to the local Anvil chain used by ens-test-env, not Ethereum Mainnet.
// See: https://github.com/ensdomains/ens-test-env

import { describe, expect, it } from "vitest";

const BASE_URL = process.env.ENSNODE_URL!;

describe("GET /api/resolve/records/:name", () => {
  it.each([
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
    const response = await fetch(
      `${BASE_URL}/api/resolve/records/${encodedName}${query ? `?${query}` : ""}`,
    );
    const body = await response.json();

    expect(response.status).toBe(expectedStatus);
    expect(body).toMatchObject(expectedBody);
  });
});

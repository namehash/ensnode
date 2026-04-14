// NOTE: These integration tests target an ENSNode instance running against the ens-test-env ENS namespace.
// The ens-test-env is a deterministic deployment of the ENS protocol to a local Anvil chain — it is
// NOT Ethereum Mainnet or any public testnet. Therefore, chainId 1 referenced in these tests refers
// to the local Anvil chain used by ens-test-env, not Ethereum Mainnet.
// See: https://github.com/ensdomains/ens-test-env

import { describe, expect, it } from "vitest";

import { DEVNET_OWNER } from "@ensnode/ensnode-sdk/internal";

const BASE_URL = process.env.ENSNODE_URL!;

describe("GET /api/resolve/primary-names/:address", () => {
  it.each([
    {
      description:
        "resolves primary names for owner address on chain 1 (no primary name set in devnet)",
      address: DEVNET_OWNER,
      query: "chainIds=1",
      expectedStatus: 200,
      expectedBody: {
        names: { "1": null },
        accelerationRequested: false,
        accelerationAttempted: false,
      },
    },
    {
      description: "resolves all primary names",
      address: DEVNET_OWNER,
      query: "",
      expectedStatus: 200,
      expectedBody: {
        names: { "1": null },
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
      address: DEVNET_OWNER,
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
      address: DEVNET_OWNER,
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

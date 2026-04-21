// NOTE: These integration tests target an ENSNode instance running against the ens-test-env ENS namespace.
// The ens-test-env is a deterministic deployment of the ENS protocol to a local Anvil chain — it is
// NOT Ethereum Mainnet or any public testnet. Therefore, chainId 1 referenced in these tests refers
// to the local Anvil chain used by ens-test-env, not Ethereum Mainnet.
// See: https://github.com/ensdomains/ens-test-env

import { describe, expect, it } from "vitest";

import { DEVNET_OWNER, DEVNET_USER } from "@ensnode/ensnode-sdk/internal";

const BASE_URL = process.env.ENSNODE_URL!;

describe("GET /api/resolve/primary-name/:address/:chainId", () => {
  it.each([
    {
      description:
        "resolves primary name for owner address on chain 1 (no primary name set in devnet)",
      address: DEVNET_OWNER,
      chainId: "1",
      query: "",
      expectedStatus: 200,
      expectedBody: { name: null, accelerationRequested: false, accelerationAttempted: false },
    },
    {
      description:
        "resolves primary name for user address on chain 1 (no primary name set in devnet)",
      address: DEVNET_USER,
      chainId: "1",
      query: "",
      expectedStatus: 200,
      expectedBody: { name: null, accelerationRequested: false, accelerationAttempted: false },
    },
    {
      description: "owner address with accelerate=true returns accelerationRequested: true",
      address: DEVNET_OWNER,
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
      address: DEVNET_OWNER,
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

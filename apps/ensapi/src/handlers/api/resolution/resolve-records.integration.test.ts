// NOTE: These integration tests target an ENSNode instance running against the ens-test-env ENS namespace.
// The ens-test-env is a deterministic deployment of the ENS protocol to a local Anvil chain — it is
// NOT Ethereum Mainnet or any public testnet. Therefore, chainId 1 referenced in these tests refers
// to the local Anvil chain used by ens-test-env, not Ethereum Mainnet.
// See: https://github.com/ensdomains/ens-test-env

import { describe, expect, it } from "vitest";

import {
  accounts,
  addresses,
  contenthashFixtures,
  fixtures,
  testEthTextRecords,
} from "@ensnode/integration-test-env/devnet";

const BASE_URL = process.env.ENSNODE_URL!;

describe("GET /api/resolve/records/:name", () => {
  it.each([
    {
      description: "resolves ETH address (coin 60) for test.eth",
      name: "test.eth",
      query: "addresses=60",
      expected: {
        status: 200,
        body: {
          records: { addresses: { 60: accounts.owner.address } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description:
        "resolves ETH address for newowner.eth (coin 60 stays as original registrant after token transfer)",
      name: "newowner.eth",
      query: "addresses=60",
      expected: {
        status: 200,
        body: {
          records: { addresses: { 60: accounts.owner.address } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description: "resolves description text record for example.eth",
      name: "example.eth",
      query: "texts=description",
      expected: {
        status: 200,
        body: {
          records: { texts: { description: "example.eth" } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description:
        "resolves description text record for alias.eth (resolves via alias to test.eth)",
      name: "alias.eth",
      query: "texts=description",
      expected: {
        status: 200,
        body: {
          records: {
            texts: { [testEthTextRecords.description.key]: testEthTextRecords.description.value },
          },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description: "resolves both address and text records for example.eth",
      name: "example.eth",
      query: "addresses=60&texts=description",
      expected: {
        status: 200,
        body: {
          records: {
            addresses: { 60: accounts.owner.address },
            texts: { description: "example.eth" },
          },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description: "returns null address for reserved.eth (no resolver)",
      name: "reserved.eth",
      query: "addresses=60",
      expected: {
        status: 200,
        body: {
          records: { addresses: { 60: null } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description:
        "returns old coin 60 record for sub.unregistered.eth (token burned but resolver records persist)",
      name: "sub.unregistered.eth",
      query: "addresses=60",
      expected: {
        status: 200,
        body: {
          records: { addresses: { 60: accounts.owner.address } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description: "returns null address for nonexistent name",
      name: "thisnamedoesnotexist.eth",
      query: "addresses=60",
      expected: {
        status: 200,
        body: {
          records: { addresses: { 60: null } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description: "resolves ETH address for linked.parent.eth (alias to sub1.sub2.parent.eth)",
      name: "linked.parent.eth",
      query: "addresses=60",
      expected: {
        status: 200,
        body: {
          records: { addresses: { 60: accounts.owner.address } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description:
        "resolves ETH address for wallet.linked.parent.eth (alias to wallet.sub1.sub2.parent.eth)",
      name: "wallet.linked.parent.eth",
      query: "addresses=60",
      expected: {
        status: 200,
        body: {
          records: { addresses: { 60: accounts.owner.address } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    // -- Text records (seeded in devnet) --
    {
      description: "resolves avatar text record for test.eth",
      name: "test.eth",
      query: "texts=avatar",
      expected: {
        status: 200,
        body: {
          records: { texts: { [testEthTextRecords.avatar.key]: testEthTextRecords.avatar.value } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    {
      description: "returns null for unset text record",
      name: "test.eth",
      query: "texts=nonexistent.key",
      expected: {
        status: 200,
        body: {
          records: { texts: { "nonexistent.key": null } },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    // -- Multi-coin addresses (seeded in devnet) --
    {
      description: "resolves multiple coin types at once for test.eth",
      name: "test.eth",
      query: "addresses=60,0,2,777777",
      expected: {
        status: 200,
        body: {
          records: {
            addresses: {
              60: accounts.owner.address,
              0: fixtures.rawAddresses.bitcoin.raw,
              2: fixtures.rawAddresses.litecoin.raw,
              777777: null,
            },
          },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    // -- Combined records --
    {
      description: "resolves every supported record type for test.eth",
      name: "test.eth",
      query: [
        "name=true",
        "addresses=60,0,2",
        "texts=avatar,description,url,email,com.twitter,com.github,com.x,org.telegram",
        "contenthash=true",
        "pubkey=true",
        "version=true",
        "abi=1",
        `interfaces=${fixtures.fourBytesInterface}`,
      ].join("&"),
      expected: {
        status: 200,
        body: {
          records: {
            addresses: {
              60: accounts.owner.address,
              0: fixtures.rawAddresses.bitcoin.raw,
              2: fixtures.rawAddresses.litecoin.raw,
            },
            texts: {
              [testEthTextRecords.avatar.key]: testEthTextRecords.avatar.value,
              [testEthTextRecords.description.key]: testEthTextRecords.description.value,
              [testEthTextRecords.url.key]: testEthTextRecords.url.value,
              [testEthTextRecords.email.key]: testEthTextRecords.email.value,
              [testEthTextRecords.twitter.key]: testEthTextRecords.twitter.value,
              [testEthTextRecords.github.key]: testEthTextRecords.github.value,
              [testEthTextRecords.x.key]: testEthTextRecords.x.value,
              [testEthTextRecords.telegram.key]: testEthTextRecords.telegram.value,
            },
            contenthash: contenthashFixtures.ipfs.raw,
            pubkey: {
              x: fixtures.publicKeyX,
              y: fixtures.publicKeyY,
            },
            version: expect.any(String),
            abi: {
              contentType: "1",
              data: fixtures.abiBytes,
            },
            interfaces: {
              [fixtures.fourBytesInterface]: addresses.one,
            },
          },
          accelerationRequested: false,
          accelerationAttempted: false,
        },
      },
    },
    // -- Acceleration --
    {
      description: "test.eth with accelerate=true returns accelerationRequested: true",
      name: "test.eth",
      query: "addresses=60&accelerate=true",
      expected: {
        status: 200,
        body: {
          records: { addresses: { 60: accounts.owner.address } },
          accelerationRequested: true,
          accelerationAttempted: false,
        },
      },
    },
    {
      description: "returns 400 when selection is empty (no addresses, texts, or name)",
      name: "test.eth",
      query: "",
      expected: {
        status: 400,
        body: {
          message: "Invalid Input",
          details: { errors: ["Selection cannot be empty."] },
        },
      },
    },
    {
      description: "returns 400 when name is not normalized (uppercase)",
      name: "TEST.ETH",
      query: "addresses=60",
      expected: {
        status: 400,
        body: {
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
    },
    {
      description: "returns 400 when addresses contains a non-numeric coin type",
      name: "test.eth",
      query: "addresses=notacointype",
      expected: {
        status: 400,
        body: {
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
    },
    {
      description: "returns 400 when addresses contains duplicate coin types",
      name: "test.eth",
      query: "addresses=60,60",
      expected: {
        status: 400,
        body: {
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
    },
    {
      description: "returns 400 when texts contains duplicate keys",
      name: "test.eth",
      query: "texts=avatar,avatar",
      expected: {
        status: 400,
        body: {
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
    },
  ])("$description", async ({ name, query, expected }) => {
    const encodedName = encodeURIComponent(name);
    const response = await fetch(
      `${BASE_URL}/api/resolve/records/${encodedName}${query ? `?${query}` : ""}`,
    );
    const body = await response.json();

    expect(response.status).toBe(expected.status);
    expect(body).toMatchObject(expected.body);
  });
});

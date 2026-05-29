import {
  DEFAULT_EVM_COIN_TYPE,
  ETH_COIN_TYPE,
  evmChainIdToCoinType,
  type InterpretedName,
} from "enssdk";
import { base } from "viem/chains";
import { beforeAll, describe, expect, it } from "vitest";

import { accounts } from "@ensnode/datasources/devnet";

import {
  AccountDomainsPaginated,
  type PaginatedDomainResult,
} from "@/test/integration/find-domains/domain-pagination-queries";
import { testDomainPagination } from "@/test/integration/find-domains/test-domain-pagination";
import {
  AccountEventsPaginated,
  EventFragment,
  type EventResult,
} from "@/test/integration/find-events/event-pagination-queries";
import { testEventPagination } from "@/test/integration/find-events/test-event-pagination";
import {
  flattenConnection,
  type GraphQLConnection,
  type PaginatedGraphQLConnection,
  request,
} from "@/test/integration/graphql-utils";
import { gql } from "@/test/integration/omnigraph-api-client";

describe("Account.domains", () => {
  type AccountDomainsResult = {
    account: {
      domains: GraphQLConnection<{
        __typename: "ENSv1Domain" | "ENSv2Domain";
        canonical: { name: { interpreted: InterpretedName } } | null;
      }>;
    };
  };

  const AccountDomains = gql`
    query AccountDomains($address: Address!, $version: ENSProtocolVersion) {
      account(by: { address: $address }) {
        domains(
          where: { version: $version },
          order: { by: NAME, dir: ASC }
        ) {
          edges { node { __typename, canonical { name { interpreted } } } }
        }
      }
    }
  `;

  it("returns domains owned by the devnet owner", async () => {
    const result = await request<AccountDomainsResult>(AccountDomains, {
      address: accounts.owner.address,
    });
    const domains = flattenConnection(result.account.domains);
    const names = domains.map((d) => d.canonical?.name.interpreted);

    const expected = [
      "alias.eth",
      "changerole.eth",
      "demo.eth",
      "example.eth",
      "linked.parent.eth",
      "parent.eth",
      "renew.eth",
      "reregister.eth",
      "sub1.sub2.parent.eth",
      "sub2.parent.eth",
      "test.eth",
      "wallet.sub1.sub2.parent.eth",
    ];

    for (const name of expected) {
      expect(names, `expected '${name}' in default owner's domains`).toContain(name);
    }
  });

  it("returns domains owned by the new owner", async () => {
    const result = await request<AccountDomainsResult>(AccountDomains, {
      address: accounts.user.address,
    });
    const domains = flattenConnection(result.account.domains);
    const names = domains.map((d) => d.canonical?.name.interpreted);

    expect(names, "expected 'newowner.eth' in new owner's domains").toContain("newowner.eth");
  });

  describe("version?: ENSProtocolVersion", () => {
    it("returns any version when unspecified", async () => {
      const result = await request<AccountDomainsResult>(AccountDomains, {
        address: accounts.owner.address,
        version: undefined,
      });
      const domains = flattenConnection(result.account.domains);
      expect(domains.find((d) => d.__typename === "ENSv1Domain")).toBeDefined();
      expect(domains.find((d) => d.__typename === "ENSv2Domain")).toBeDefined();
    });

    it("returns only ENSv1Domains when version: ENSv1", async () => {
      const result = await request<AccountDomainsResult>(AccountDomains, {
        address: accounts.owner.address,
        version: "ENSv1",
      });
      const domains = flattenConnection(result.account.domains);
      expect(domains.find((d) => d.__typename === "ENSv1Domain")).toBeDefined();
      expect(domains.find((d) => d.__typename === "ENSv2Domain")).not.toBeDefined();
    });

    it("returns only ENSv2Domains when version: ENSv2", async () => {
      const result = await request<AccountDomainsResult>(AccountDomains, {
        address: accounts.owner.address,
        version: "ENSv2",
      });
      const domains = flattenConnection(result.account.domains);
      expect(domains.find((d) => d.__typename === "ENSv1Domain")).not.toBeDefined();
      expect(domains.find((d) => d.__typename === "ENSv2Domain")).toBeDefined();
    });
  });
});

describe("Account.domains pagination", () => {
  testDomainPagination(async (variables) => {
    const result = await request<{
      account: { domains: PaginatedGraphQLConnection<PaginatedDomainResult> };
    }>(AccountDomainsPaginated, { address: accounts.owner.address, ...variables });
    return result.account.domains;
  });
});

describe("Account.events", () => {
  type AccountEventsResult = { account: { events: GraphQLConnection<EventResult> } };

  const AccountEvents = gql`
    query AccountEvents($address: Address!) {
      account(by: { address: $address }) { events { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  it("returns events for the devnet deployer", async () => {
    const result = await request<AccountEventsResult>(AccountEvents, {
      address: accounts.deployer.address,
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);

    for (const event of events) {
      expect(event.sender).toBe(accounts.deployer.address);
    }
  });
});

describe("Account.events pagination", () => {
  testEventPagination(async (variables) => {
    const result = await request<{
      account: { events: PaginatedGraphQLConnection<EventResult> };
    }>(AccountEventsPaginated, { address: accounts.deployer.address, ...variables });
    return result.account.events;
  });
});

describe("Account.events filtering (AccountEventsWhereInput)", () => {
  type AccountEventsResult = { account: { events: GraphQLConnection<EventResult> } };

  const AccountEventsFiltered = gql`
    query AccountEventsFiltered($address: Address!, $where: AccountEventsWhereInput, $first: Int) {
      account(by: { address: $address }) { events(where: $where, first: $first) { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  let allEvents: EventResult[];

  beforeAll(async () => {
    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      first: 1000,
    });
    // events are returned in ascending order, so first/last access yields min/max values
    allEvents = flattenConnection(result.account.events);
    expect(allEvents.length).toBeGreaterThan(0);
  });

  it("filters by selector eq", async () => {
    const targetSelector = allEvents[0].topics[0];

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      where: { selector: { eq: targetSelector } },
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.topics[0]).toBe(targetSelector);
    }
  });

  it("filters by selector in", async () => {
    const targetSelector = allEvents[0].topics[0];

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      where: { selector: { in: [targetSelector] } },
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.topics[0]).toBe(targetSelector);
    }
  });

  it("filters by selector in with unknown topic returns no results", async () => {
    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      where: {
        selector: {
          in: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
        },
      },
    });
    const events = flattenConnection(result.account.events);
    expect(events.length).toBe(0);
  });

  it("filters by empty selector in returns no results", async () => {
    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      where: { selector: { in: [] } },
    });
    const events = flattenConnection(result.account.events);
    expect(events.length).toBe(0);
  });

  it("filters by timestamp gte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      where: { timestamp: { gte: midTimestamp } },
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp lte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      where: { timestamp: { lte: midTimestamp } },
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeLessThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp range", async () => {
    const minTs = allEvents[0].timestamp;
    const maxTs = allEvents[allEvents.length - 1].timestamp;

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      where: { timestamp: { gte: minTs, lte: maxTs } },
      first: 1000,
    });
    const events = flattenConnection(result.account.events);
    expect(events.length).toBe(allEvents.length);
  });

  it("combines selector and timestamp", async () => {
    // pick a seed event from the second half so its selector is guaranteed to
    // appear at or after midTimestamp, avoiding flaky empty-result failures
    const midIndex = Math.floor(allEvents.length / 2);
    const seedEvent = allEvents[midIndex];
    const targetSelector = seedEvent.topics[0];
    const midTimestamp = seedEvent.timestamp;

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      where: {
        selector: { eq: targetSelector },
        timestamp: { gte: midTimestamp },
      },
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(event.topics[0]).toBe(targetSelector);
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("excludes all events with a future timestamp", async () => {
    const maxTimestamp = BigInt(allEvents[allEvents.length - 1].timestamp);

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: accounts.deployer.address,
      where: { timestamp: { gte: (maxTimestamp + 1n).toString() } },
    });
    const events = flattenConnection(result.account.events);
    expect(events.length).toBe(0);
  });
});

describe("Account.primaryName and Account.primaryNames", () => {
  const BASE_COIN_TYPE = evmChainIdToCoinType(base.id);

  type CanonicalNameResult = {
    interpreted: string;
    beautified: string;
  } | null;

  type PrimaryNameRecordResult = {
    coinType: number;
    chain: string | null;
    name: CanonicalNameResult;
    resolve?: {
      records?: { addresses: Array<{ coinType: number; address: string | null }> } | null;
    } | null;
  };

  const TEST_ETH_NAME: CanonicalNameResult = {
    interpreted: "test.eth",
    beautified: "test.eth",
  };

  type AccountPrimaryNameResult = {
    account: {
      resolve: {
        primaryName: PrimaryNameRecordResult;
      };
    };
  };

  type AccountPrimaryNamesResult = {
    account: {
      resolve: {
        primaryNames: PrimaryNameRecordResult[];
      };
    };
  };

  const AccountPrimaryNameByCoinType = gql`
    query AccountPrimaryNameByCoinType($address: Address!, $coinType: CoinType!) {
      account(by: { address: $address }) {
        resolve {
          primaryName(by: { coinType: $coinType }) {
            coinType
            chain
            name { interpreted beautified }
          }
        }
      }
    }
  `;

  const AccountPrimaryNameByChain = gql`
    query AccountPrimaryNameByChain($address: Address!) {
      account(by: { address: $address }) {
        resolve {
          primaryName(by: { chain: ETHEREUM }) {
            coinType
            chain
            name { interpreted beautified }
          }
        }
      }
    }
  `;

  const AccountPrimaryNameByDefaultChain = gql`
    query AccountPrimaryNameByDefaultChain($address: Address!) {
      account(by: { address: $address }) {
        resolve {
          primaryName(by: { chain: DEFAULT }) {
            coinType
            chain
            name { interpreted beautified }
          }
        }
      }
    }
  `;

  const AccountPrimaryNamesByDefaultChain = gql`
    query AccountPrimaryNamesByDefaultChain($address: Address!) {
      account(by: { address: $address }) {
        resolve {
          primaryNames(where: { chains: [DEFAULT] }) {
            coinType
            chain
            name { interpreted beautified }
          }
        }
      }
    }
  `;

  const AccountPrimaryNamesByCoinTypes = gql`
    query AccountPrimaryNamesByCoinTypes($address: Address!, $coinTypes: [CoinType!]!) {
      account(by: { address: $address }) {
        resolve {
          primaryNames(where: { coinTypes: $coinTypes }) {
            coinType
            chain
            name { interpreted beautified }
          }
        }
      }
    }
  `;

  const AccountPrimaryNamesByChains = gql`
    query AccountPrimaryNamesByChains($address: Address!) {
      account(by: { address: $address }) {
        resolve {
          primaryNames(where: { chains: [ETHEREUM, BASE] }) {
            coinType
            chain
            name { interpreted beautified }
          }
        }
      }
    }
  `;

  const AccountPrimaryNameNonEnsip19 = gql`
    query AccountPrimaryNameNonEnsip19($address: Address!) {
      account(by: { address: $address }) {
        resolve {
          primaryName(by: { coinType: 0 }) {
            coinType
            chain
            name { interpreted beautified }
            resolve {
              records {
                addresses(coinTypes: [60]) { address }
              }
            }
          }
        }
      }
    }
  `;

  const AccountPrimaryNameChainedRecords = gql`
    query AccountPrimaryNameChainedRecords($address: Address!) {
      account(by: { address: $address }) {
        resolve {
          primaryName(by: { coinType: 60 }) {
            name { interpreted beautified }
            resolve {
              records {
                addresses(coinTypes: [60]) { coinType address }
              }
            }
          }
        }
      }
    }
  `;

  it("resolves primary name by coinType for owner on Ethereum", async () => {
    await expect(
      request<AccountPrimaryNameResult>(AccountPrimaryNameByCoinType, {
        address: accounts.owner.address,
        coinType: ETH_COIN_TYPE,
      }),
    ).resolves.toEqual({
      account: {
        resolve: {
          primaryName: { coinType: ETH_COIN_TYPE, chain: "ETHEREUM", name: TEST_ETH_NAME },
        },
      },
    });
  });

  it("resolves the same primary name by chain as by coinType", async () => {
    await expect(
      request<AccountPrimaryNameResult>(AccountPrimaryNameByChain, {
        address: accounts.owner.address,
      }),
    ).resolves.toEqual({
      account: {
        resolve: {
          primaryName: { coinType: ETH_COIN_TYPE, chain: "ETHEREUM", name: TEST_ETH_NAME },
        },
      },
    });
  });

  it("accepts DEFAULT and maps it to the ENSIP-19 default EVM coin type", async () => {
    await expect(
      request<AccountPrimaryNameResult>(AccountPrimaryNameByDefaultChain, {
        address: accounts.owner.address,
      }),
    ).resolves.toEqual({
      account: {
        resolve: {
          primaryName: {
            coinType: DEFAULT_EVM_COIN_TYPE,
            chain: "DEFAULT",
            name: null,
          },
        },
      },
    });
  });

  it("resolves primary names for DEFAULT", async () => {
    await expect(
      request<AccountPrimaryNamesResult>(AccountPrimaryNamesByDefaultChain, {
        address: accounts.owner.address,
      }),
    ).resolves.toEqual({
      account: {
        resolve: {
          primaryNames: [
            {
              coinType: DEFAULT_EVM_COIN_TYPE,
              chain: "DEFAULT",
              name: null,
            },
          ],
        },
      },
    });
  });

  it("returns null for user without a primary name", async () => {
    await expect(
      request<AccountPrimaryNameResult>(AccountPrimaryNameByCoinType, {
        address: accounts.user.address,
        coinType: ETH_COIN_TYPE,
      }),
    ).resolves.toEqual({
      account: {
        resolve: {
          primaryName: { coinType: ETH_COIN_TYPE, chain: "ETHEREUM", name: null },
        },
      },
    });
  });

  it("resolves primary names for requested coin types", async () => {
    await expect(
      request<AccountPrimaryNamesResult>(AccountPrimaryNamesByCoinTypes, {
        address: accounts.owner.address,
        coinTypes: [ETH_COIN_TYPE, BASE_COIN_TYPE],
      }),
    ).resolves.toMatchObject({
      account: {
        resolve: {
          primaryNames: [
            { coinType: ETH_COIN_TYPE, chain: "ETHEREUM", name: TEST_ETH_NAME },
            { coinType: BASE_COIN_TYPE, chain: "BASE", name: null },
          ],
        },
      },
    });
  });

  it("resolves primary names for requested chains", async () => {
    await expect(
      request<AccountPrimaryNamesResult>(AccountPrimaryNamesByChains, {
        address: accounts.owner.address,
      }),
    ).resolves.toMatchObject({
      account: {
        resolve: {
          primaryNames: [
            { coinType: ETH_COIN_TYPE, chain: "ETHEREUM", name: TEST_ETH_NAME },
            { coinType: BASE_COIN_TYPE, chain: "BASE", name: null },
          ],
        },
      },
    });
  });

  it("returns null name and chain for non-ENSIP-19 coin types", async () => {
    await expect(
      request<AccountPrimaryNameResult>(AccountPrimaryNameNonEnsip19, {
        address: accounts.owner.address,
      }),
    ).resolves.toEqual({
      account: {
        resolve: {
          primaryName: {
            coinType: 0,
            chain: null,
            name: null,
            resolve: {
              records: null,
            },
          },
        },
      },
    });
  });

  it("chains forward resolution through primaryName.records", async () => {
    await expect(
      request<AccountPrimaryNameResult>(AccountPrimaryNameChainedRecords, {
        address: accounts.owner.address,
      }),
    ).resolves.toMatchObject({
      account: {
        resolve: {
          primaryName: {
            name: TEST_ETH_NAME,
            resolve: {
              records: {
                addresses: [{ coinType: ETH_COIN_TYPE, address: accounts.owner.address }],
              },
            },
          },
        },
      },
    });
  });

  it("rejects empty coinTypes at GraphQL validation", async () => {
    await expect(
      request(AccountPrimaryNamesByCoinTypes, {
        address: accounts.owner.address,
        coinTypes: [],
      }),
    ).rejects.toThrow();
  });

  it("rejects empty chains at GraphQL validation", async () => {
    await expect(
      request(
        gql`
          query AccountPrimaryNamesEmptyChains($address: Address!) {
            account(by: { address: $address }) {
              resolve {
                primaryNames(where: { chains: [] }) { coinType }
              }
            }
          }
        `,
        { address: accounts.owner.address },
      ),
    ).rejects.toThrow();
  });
});

import {
  ADDR_REVERSE_NODE,
  asInterpretedLabel,
  type CoinType,
  type DomainId,
  ETH_COIN_TYPE,
  ETH_NODE,
  type InterpretedLabel,
  type InterpretedName,
  labelhashInterpretedLabel,
  makeENSv1DomainId,
  makeENSv1RegistryId,
  makeENSv2DomainId,
  makeENSv2RegistryId,
  makeStorageId,
} from "enssdk";
import { beforeAll, describe, expect, it } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import { accounts, addresses, fixtures } from "@ensnode/datasources/devnet";
import { getDatasourceContract } from "@ensnode/ensnode-sdk";

import { INCLUDE_DEV_METHODS } from "@/omnigraph-api/lib/include-dev-methods";
import { DEVNET_ETH_LABELS, DEVNET_NAMES } from "@/test/integration/devnet-names";
import {
  DomainSubdomainsPaginated,
  type PaginatedDomainResult,
} from "@/test/integration/find-domains/domain-pagination-queries";
import { testDomainPagination } from "@/test/integration/find-domains/test-domain-pagination";
import {
  DomainEventsPaginated,
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

const NAME_WITH_EVENTS = "newowner.eth";

describe("Domain.subdomains", () => {
  type SubdomainsResult = {
    domain: {
      subdomains: GraphQLConnection<{
        label: { interpreted: InterpretedLabel };
      }>;
    };
  };

  const DomainSubdomains = gql`
    query DomainSubdomains($name: InterpretedName!) {
      domain(by: { name: $name }) {
        subdomains { edges { node { label { interpreted } } } }
      }
    }
  `;

  it("returns at least all known subdomains of .eth", async () => {
    const result = await request<SubdomainsResult>(DomainSubdomains, { name: "eth" });
    const subdomains = flattenConnection(result.domain.subdomains);

    const actual = subdomains.map((d) => d.label.interpreted);
    for (const expected of DEVNET_ETH_LABELS) {
      expect(actual, `expected '${expected}' in .eth subdomains`).toContain(expected);
    }
  });
});

describe("Domain.canonical", () => {
  type DomainCanonicalQueryResult = {
    domain: {
      id: DomainId;
      canonical: {
        name: { interpreted: InterpretedName };
        depth: number;
        node: string;
        path: { id: DomainId }[];
      } | null;
    } | null;
  };

  const DomainCanonicalByName = gql`
    query DomainCanonicalByName($name: InterpretedName!) {
      domain(by: { name: $name }) { id canonical { name { interpreted } depth node path { id } } }
    }
  `;

  const DomainCanonicalById = gql`
    query DomainCanonicalById($id: DomainId!) {
      domain(by: { id: $id }) { id canonical { name { interpreted } depth node path { id } } }
    }
  `;

  it.each(DEVNET_NAMES)(
    "materializes canonical.{name, depth, path, node} for '$name'",
    async ({ name, canonical }) => {
      const result = await request<DomainCanonicalQueryResult>(DomainCanonicalByName, { name });
      const labelCount = canonical.split(".").length;
      expect(result).toMatchObject({
        domain: { canonical: { name: { interpreted: canonical }, depth: labelCount } },
      });
      expect(result.domain!.canonical!.path.length).toBe(labelCount);
    },
  );

  it("returns the canonical name for a linked Name", async () => {
    // The wallet Registry's `ParentUpdated` claims `sub1.sub2.parent.eth` as its canonical parent.
    // `linked.parent.eth.subregistry` was later re-pointed to the same Registry without a
    // corresponding `ParentUpdated`, so `wallet.linked.parent.eth` is an addressable alias whose
    // canonical lineage walks through `sub1.sub2.parent.eth`.
    await expect(
      request<DomainCanonicalQueryResult>(DomainCanonicalByName, {
        name: "wallet.linked.parent.eth",
      }),
    ).resolves.toMatchObject({
      domain: {
        canonical: {
          name: { interpreted: "wallet.sub1.sub2.parent.eth" },
          path: expect.arrayContaining([{ id: expect.any(String) }]),
        },
      },
    });
  });

  it("is canonical for ENSv1 addr.reverse", async () => {
    const v1RootRegistry = getDatasourceContract(
      "ens-test-env",
      DatasourceNames.ENSRoot,
      "ENSv1Registry",
    );
    const id = makeENSv1DomainId(v1RootRegistry, ADDR_REVERSE_NODE);

    await expect(
      request<DomainCanonicalQueryResult>(DomainCanonicalById, { id }),
    ).resolves.toMatchObject({
      domain: { id, canonical: { name: { interpreted: "addr.reverse" } } },
    });
  });
});

describe("Domain.registry and Domain.subregistry", () => {
  type DomainRegistriesResult = {
    domain: {
      registry: { __typename: string; id: string };
      subregistry: { __typename: string; id: string } | null;
    } | null;
  };

  const DomainRegistries = gql`
    query DomainRegistries($id: DomainId!) {
      domain(by: { id: $id }) {
        registry { __typename id }
        subregistry { __typename id }
      }
    }
  `;

  it("exposes parent and child Registries on the ENSv1 .eth Domain", async () => {
    const v1RootRegistry = getDatasourceContract(
      "ens-test-env",
      DatasourceNames.ENSRoot,
      "ENSv1Registry",
    );
    const id = makeENSv1DomainId(v1RootRegistry, ETH_NODE);

    await expect(request<DomainRegistriesResult>(DomainRegistries, { id })).resolves.toMatchObject({
      domain: {
        registry: {
          __typename: "ENSv1Registry",
          id: makeENSv1RegistryId(v1RootRegistry),
        },
        subregistry: null,
        // TODO: The DevNet should in the future have some ENSv1 domains that are then migrated, and then the .eth ENSv1 domain will have a subregistry.
        // subregistry: {
        //   __typename: "ENSv1VirtualRegistry",
        //   id: makeENSv1VirtualRegistryId(v1RootRegistry, ETH_NODE),
        // },
      },
    });
  });

  it("exposes parent and child Registries on the ENSv2 .eth Domain", async () => {
    const v2RootRegistry = getDatasourceContract(
      "ens-test-env",
      DatasourceNames.ENSv2Root,
      "RootRegistry",
    );
    const v2EthRegistry = getDatasourceContract(
      "ens-test-env",
      DatasourceNames.ENSv2Root,
      "ETHRegistry",
    );
    const id = makeENSv2DomainId(
      v2RootRegistry,
      makeStorageId(labelhashInterpretedLabel(asInterpretedLabel("eth"))),
    );

    await expect(request<DomainRegistriesResult>(DomainRegistries, { id })).resolves.toMatchObject({
      domain: {
        registry: {
          __typename: "ENSv2Registry",
          id: makeENSv2RegistryId(v2RootRegistry),
        },
        subregistry: {
          __typename: "ENSv2Registry",
          id: makeENSv2RegistryId(v2EthRegistry),
        },
      },
    });
  });
});

describe("Domain.subdomains pagination", () => {
  testDomainPagination(async (variables) => {
    const result = await request<{
      domain: { subdomains: PaginatedGraphQLConnection<PaginatedDomainResult> };
    }>(DomainSubdomainsPaginated, variables);
    return result.domain.subdomains;
  });
});

describe("Domain.events", () => {
  type DomainEventsResult = {
    domain: { events: GraphQLConnection<EventResult> };
  };

  const DomainEvents = gql`
    query DomainEvents($name: InterpretedName!) {
      domain(by: { name: $name }) { events { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  it("returns events for a domain with known activity", async () => {
    const result = await request<DomainEventsResult>(DomainEvents, { name: NAME_WITH_EVENTS });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
  });

  it("returns events for multiple domains", async () => {
    const names = [NAME_WITH_EVENTS, "example.eth", "demo.eth"];

    for (const name of names) {
      const result = await request<DomainEventsResult>(DomainEvents, { name });
      const events = flattenConnection(result.domain.events);
      expect(events.length, `expected events for domain '${name}'`).toBeGreaterThan(0);
    }
  });
});

describe("Domain.events pagination", () => {
  testEventPagination(async (variables) => {
    const result = await request<{
      domain: { events: PaginatedGraphQLConnection<EventResult> };
    }>(DomainEventsPaginated, { name: NAME_WITH_EVENTS, ...variables });
    return result.domain.events;
  });
});

describe("Domain.events filtering (EventsWhereInput)", () => {
  type DomainEventsResult = {
    domain: { events: GraphQLConnection<EventResult> };
  };

  const DomainEventsFiltered = gql`
    query DomainEventsFiltered($name: InterpretedName!, $where: EventsWhereInput, $first: Int) {
      domain(by: { name: $name }) { events(where: $where, first: $first) { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  let allEvents: EventResult[];

  beforeAll(async () => {
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      first: 1000,
    });
    // events are returned in ascending order, so first/last access yields min/max values
    allEvents = flattenConnection(result.domain.events);
    expect(allEvents.length).toBeGreaterThan(0);
  });

  it("filters by selector eq", async () => {
    const targetSelector = allEvents[0].topics[0];

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { selector: { eq: targetSelector } },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.topics[0]).toBe(targetSelector);
    }
  });

  it("filters by selector in", async () => {
    const targetSelector = allEvents[0].topics[0];

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { selector: { in: [targetSelector] } },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.topics[0]).toBe(targetSelector);
    }
  });

  it("filters by selector in with unknown topic returns no results", async () => {
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: {
        selector: {
          in: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
        },
      },
    });
    const events = flattenConnection(result.domain.events);
    expect(events.length).toBe(0);
  });

  it("filters by empty selector in returns no results", async () => {
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { selector: { in: [] } },
    });
    const events = flattenConnection(result.domain.events);
    expect(events.length).toBe(0);
  });

  it("filters by timestamp gte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { timestamp: { gte: midTimestamp } },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp lte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { timestamp: { lte: midTimestamp } },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeLessThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp range", async () => {
    const minTs = allEvents[0].timestamp;
    const maxTs = allEvents[allEvents.length - 1].timestamp;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { timestamp: { gte: minTs, lte: maxTs } },
      first: 1000,
    });
    const events = flattenConnection(result.domain.events);
    expect(events.length).toBe(allEvents.length);
  });

  it("filters by from eq", async () => {
    const targetFrom = allEvents[0].from;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { from: { eq: targetFrom } },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.from).toBe(targetFrom);
    }
  });

  it("combines selector and timestamp", async () => {
    // pick a seed event from the second half so its selector is guaranteed to
    // appear at or after midTimestamp, avoiding flaky empty-result failures
    const midIndex = Math.floor(allEvents.length / 2);
    const seedEvent = allEvents[midIndex];
    const targetSelector = seedEvent.topics[0];
    const midTimestamp = seedEvent.timestamp;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: {
        selector: { eq: targetSelector },
        timestamp: { gte: midTimestamp },
      },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(event.topics[0]).toBe(targetSelector);
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("excludes all events with a future timestamp", async () => {
    const maxTimestamp = BigInt(allEvents[allEvents.length - 1].timestamp);

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { timestamp: { gte: (maxTimestamp + 1n).toString() } },
    });
    const events = flattenConnection(result.domain.events);
    expect(events.length).toBe(0);
  });

  it("rejects an empty timestamp filter (no bounds)", async () => {
    await expect(
      request<DomainEventsResult>(DomainEventsFiltered, {
        name: NAME_WITH_EVENTS,
        where: { timestamp: {} },
      }),
    ).rejects.toThrow();
  });

  it("rejects timestamp with both gt and gte", async () => {
    const t = allEvents[0].timestamp;
    await expect(
      request<DomainEventsResult>(DomainEventsFiltered, {
        name: NAME_WITH_EVENTS,
        where: { timestamp: { gt: t, gte: t } },
      }),
    ).rejects.toThrow();
  });

  it("rejects timestamp with both lt and lte", async () => {
    const t = allEvents[0].timestamp;
    await expect(
      request<DomainEventsResult>(DomainEventsFiltered, {
        name: NAME_WITH_EVENTS,
        where: { timestamp: { lt: t, lte: t } },
      }),
    ).rejects.toThrow();
  });

  it("rejects inverted timestamp range", async () => {
    const lo = BigInt(allEvents[0].timestamp);
    const hi = BigInt(allEvents[allEvents.length - 1].timestamp);
    if (lo === hi) return; // dataset must have a range for this test
    await expect(
      request<DomainEventsResult>(DomainEventsFiltered, {
        name: NAME_WITH_EVENTS,
        where: { timestamp: { gte: hi.toString(), lte: lo.toString() } },
      }),
    ).rejects.toThrow();
  });

  it("accepts equal lower and upper bounds (pin-point timestamp)", async () => {
    const t = allEvents[0].timestamp;
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { timestamp: { gte: t, lte: t } },
    });
    const events = flattenConnection(result.domain.events);
    for (const event of events) {
      expect(event.timestamp).toBe(t);
    }
  });
});

describe("Domain.records", () => {
  type DomainRecordsResult = {
    domain: {
      resolve: {
        records: {
          addresses: Array<{ coinType: CoinType; address: string | null }>;
          texts: Array<{ key: string; value: string | null }>;
        } | null;
      };
    };
  };

  type DomainAllRecordsResult = {
    domain: {
      resolve: {
        records: {
          reverseName: string | null;
          contenthash: string | null;
          pubkey: { x: string; y: string } | null;
          dnszonehash: string | null;
          version: string | null;
          abi: { contentType: string; data: string } | null;
          interfaces: Array<{ interfaceId: string; implementer: string | null }>;
          addresses: Array<{ coinType: CoinType; address: string | null }>;
          texts: Array<{ key: string; value: string | null }>;
        } | null;
      };
    };
  };

  const DomainRecords = gql`
    query DomainRecords($name: InterpretedName!, $addresses: [CoinType!]!, $texts: [String!]!) {
      domain(by: { name: $name }) {
        resolve {
          records {
            addresses(coinTypes: $addresses) { coinType address }
            texts(keys: $texts) { key value }
          }
        }
      }
    }
  `;

  const DomainRecordsAll = gql`
    query DomainRecordsAll(
      $name: InterpretedName!
      $addresses: [CoinType!]!
      $texts: [String!]!
      $contentTypeMask: BigInt!
      $interfaceIds: [InterfaceId!]!
    ) {
      domain(by: { name: $name }) {
        resolve {
          records {
            reverseName
            contenthash
            pubkey { x y }
            dnszonehash
            version
            abi(contentTypeMask: $contentTypeMask) { contentType data }
            interfaces(ids: $interfaceIds) { interfaceId implementer }
            addresses(coinTypes: $addresses) { coinType address }
            texts(keys: $texts) { key value }
          }
        }
      }
    }
  `;

  const BITCOIN_COIN_TYPE = 0;
  const LITECOIN_COIN_TYPE = 2;

  it("resolves address and text records for example.eth", async () => {
    await expect(
      request<DomainRecordsResult>(DomainRecords, {
        name: "example.eth",
        addresses: [ETH_COIN_TYPE],
        texts: ["description"],
      }),
    ).resolves.toMatchObject({
      domain: {
        resolve: {
          records: {
            texts: [{ key: "description", value: "example.eth" }],
            addresses: [{ coinType: ETH_COIN_TYPE, address: accounts.owner.address }],
          },
        },
      },
    });
  });

  it("resolves every supported record type for test.eth", async () => {
    await expect(
      request<DomainAllRecordsResult>(DomainRecordsAll, {
        name: "test.eth",
        addresses: [ETH_COIN_TYPE, 0, 2],
        texts: ["avatar", "description", "url", "email", "com.twitter", "com.github"],
        contentTypeMask: "1",
        interfaceIds: [fixtures.fourBytesInterface],
      }),
    ).resolves.toMatchObject({
      domain: {
        resolve: {
          records: {
            contenthash: fixtures.contenthash,
            pubkey: { x: fixtures.publicKeyX, y: fixtures.publicKeyY },
            dnszonehash: null,
            version: expect.any(String),
            abi: { contentType: "1", data: fixtures.abiBytes },
            interfaces: [{ interfaceId: fixtures.fourBytesInterface, implementer: addresses.one }],
            addresses: [
              { coinType: ETH_COIN_TYPE, address: accounts.owner.address },
              { coinType: BITCOIN_COIN_TYPE, address: fixtures.bitcoinAddress },
              { coinType: LITECOIN_COIN_TYPE, address: fixtures.litecoinAddress },
            ],
            texts: [
              { key: "avatar", value: "https://example.com/avatar.png" },
              { key: "description", value: "test.eth" },
              { key: "url", value: "https://ens.domains" },
              { key: "email", value: "test@ens.domains" },
              { key: "com.twitter", value: "ensdomains" },
              { key: "com.github", value: "ensdomains" },
            ],
          },
        },
      },
    });
  });

  it("returns null for an unnormalized canonical name (e.g. with labelhash)", async () => {
    // A name with a label that is an encoded labelhash is an InterpretedName but not a normalized name.
    // Even if it exists in the DB, resolve should return null.
    const unnormalizedName =
      "[0000000000000000000000000000000000000000000000000000000000000000].eth";
    await expect(
      request<DomainRecordsResult>(DomainRecords, {
        name: unnormalizedName,
        addresses: [60],
        texts: ["description"],
      }),
    ).resolves.toMatchObject({
      domain: null,
    });
  });

  it("returns null for an ABI alias that does not match the returned content type", async () => {
    // test.eth has ABI with contentType 1 (JSON)
    // If we ask for contentType 2 (zlib-JSON), it should return null
    const DomainRecordsAbi = gql`
      query DomainRecordsAbi($name: InterpretedName!, $mask1: BigInt!, $mask2: BigInt!) {
        domain(by: { name: $name }) {
          resolve {
            records {
              abi1: abi(contentTypeMask: $mask1) { contentType data }
              abi2: abi(contentTypeMask: $mask2) { contentType data }
            }
          }
        }
      }
    `;

    await expect(
      request<{
        domain: {
          resolve: {
            records: {
              abi1: { contentType: string; data: string } | null;
              abi2: { contentType: string; data: string } | null;
            };
          };
        };
      }>(DomainRecordsAbi, {
        name: "test.eth",
        mask1: "1", // JSON
        mask2: "2", // zlib-JSON
      }),
    ).resolves.toMatchObject({
      domain: {
        resolve: {
          records: {
            abi1: { contentType: "1", data: fixtures.abiBytes },
            abi2: null,
          },
        },
      },
    });
  });
});

(INCLUDE_DEV_METHODS ? describe : describe.skip)("Domain.profile", () => {
  type DomainProfileResult = {
    domain: {
      resolve: {
        profile: {
          description: string | null;
          avatar: { url: string | null } | null;
          addresses: { ethereum: string | null } | null;
          socials: { github: { handle: string | null; url: string | null } | null } | null;
        } | null;
      };
    };
  };

  const DomainProfile = gql`
    query DomainProfile($name: InterpretedName!) {
      domain(by: { name: $name }) {
        resolve {
          profile {
            description
            avatar { url }
            addresses { ethereum }
            socials { github { handle url } }
          }
        }
      }
    }
  `;

  it("returns the preview null shape for a canonical domain", async () => {
    await expect(
      request<DomainProfileResult>(DomainProfile, { name: "test.eth" }),
    ).resolves.toEqual({
      domain: {
        resolve: {
          profile: {
            description: null,
            avatar: { url: null },
            addresses: { ethereum: null },
            socials: { github: { handle: null, url: null } },
          },
        },
      },
    });
  });
});

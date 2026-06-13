import {
  asInterpretedLabel,
  type DomainId,
  ETH_NODE,
  type InterpretedLabel,
  labelhashInterpretedLabel,
  makeENSv1DomainId,
  makeENSv1RegistryId,
  makeENSv2DomainId,
  makeStorageId,
  type Name,
  type Node,
  type NormalizedAddress,
} from "enssdk";
import { describe, expect, it } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import { getDatasourceContract, getENSv2RootRegistryId } from "@ensnode/ensnode-sdk";
import { effectiveResolverFallback } from "@ensnode/integration-test-env/devnet";

import { DEVNET_ENSV1_NAMES, DEVNET_NAMES } from "@/test/integration/devnet-names";
import {
  type PaginatedDomainResult,
  QueryDomainsPaginated,
} from "@/test/integration/find-domains/domain-pagination-queries";
import { testDomainPagination } from "@/test/integration/find-domains/test-domain-pagination";
import {
  flattenConnection,
  type GraphQLConnection,
  type PaginatedGraphQLConnection,
  request,
} from "@/test/integration/graphql-utils";
import { gql } from "@/test/integration/omnigraph-api-client";

const namespace = "ens-test-env";

const V2_ROOT_REGISTRY = getDatasourceContract(
  namespace,
  DatasourceNames.ENSv2Root,
  "RootRegistry",
);

const V1_ROOT_REGISTRY = getDatasourceContract(namespace, DatasourceNames.ENSRoot, "ENSv1Registry");

const V2_ETH_REGISTRY = getDatasourceContract(namespace, DatasourceNames.ENSv2Root, "ETHRegistry");
const V1_ETH_DOMAIN_ID = makeENSv1DomainId(V1_ROOT_REGISTRY, ETH_NODE);
const V2_ETH_STORAGE_ID = makeStorageId(labelhashInterpretedLabel(asInterpretedLabel("eth")));
const V2_ETH_DOMAIN_ID = makeENSv2DomainId(V2_ROOT_REGISTRY, V2_ETH_STORAGE_ID);

describe("Query.root", () => {
  it("returns the v2 root registry when v2 is defined (preferred over v1)", async () => {
    await expect(request(gql`{ root { __typename id } }`)).resolves.toMatchObject({
      root: {
        __typename: "ENSv2Registry",
        id: getENSv2RootRegistryId(namespace),
      },
    });
  });
});

describe("Query.registry polymorphism", () => {
  const RegistryByContract = gql`
    query RegistryByContract($contract: AccountIdInput!) {
      registry(by: { contract: $contract }) {
        __typename
        id
      }
    }
  `;

  it("returns an ENSv1Registry for the devnet ENSv1Registry contract", async () => {
    await expect(
      request(RegistryByContract, { contract: V1_ROOT_REGISTRY }),
    ).resolves.toMatchObject({
      registry: {
        __typename: "ENSv1Registry",
        id: makeENSv1RegistryId(V1_ROOT_REGISTRY),
      },
    });
  });
});

describe("Query.domains", () => {
  type QueryDomainsResult = {
    domains: GraphQLConnection<{
      __typename: "ENSv1Domain" | "ENSv2Domain";
      id: DomainId;
      canonical: { name: { interpreted: Name } } | null;
      label: { interpreted: InterpretedLabel };
      owner: { address: NormalizedAddress };
      node?: Node;
    }>;
  };

  const QueryDomains = gql`
    query QueryDomains(
      $name: DomainsNameFilter!
      $version: ENSProtocolVersion
      $order: DomainsOrderInput
    ) {
      domains(where: { name: $name, version: $version }, order: $order) {
        edges {
          node {
            __typename
            id
            canonical {
              name {
                interpreted
              }
            }
            label {
              interpreted
            }
            owner {
              address
            }
            ... on ENSv1Domain {
              node
            }
          }
        }
      }
    }
  `;

  it("requires the name filter", async () => {
    await expect(request(gql`{ domains { edges { node { id }} } }`)).rejects.toThrow(
      'argument "where" of type "DomainsWhereInput!" is required, but it was not provided',
    );
  });

  it.each(DEVNET_ENSV1_NAMES.filter((entry) => entry.wrapped))(
    "finds wrapped ENSv1-only name $name via domains(where: { name: { eq } })",
    async ({ name, canonical }) => {
      const result = await request<QueryDomainsResult>(QueryDomains, {
        name: { eq: name },
      });

      await expect(flattenConnection(result.domains)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            __typename: "ENSv1Domain",
            canonical: { name: { interpreted: canonical } },
          }),
        ]),
      );
    },
  );

  it("sees .eth domain", async () => {
    const result = await request<QueryDomainsResult>(QueryDomains, {
      name: { eq: "eth" },
    });

    const domains = flattenConnection(result.domains);

    // there's at least a v1 and a v2 'eth' domain
    expect(domains.length).toBeGreaterThanOrEqual(2);

    expect(
      domains.find((d) => d.__typename === "ENSv1Domain" && d.id === V1_ETH_DOMAIN_ID),
    ).toMatchObject({
      id: V1_ETH_DOMAIN_ID,
      canonical: { name: { interpreted: "eth" } },
      label: { interpreted: "eth" },
      node: ETH_NODE,
    });

    expect(
      domains.find((d) => d.__typename === "ENSv2Domain" && d.id === V2_ETH_DOMAIN_ID),
    ).toMatchObject({
      id: V2_ETH_DOMAIN_ID,
      canonical: { name: { interpreted: "eth" } },
      label: { interpreted: "eth" },
    });
  });

  it("returns only canonical domains", async () => {
    const result = await request<QueryDomainsResult>(QueryDomains, {
      name: { starts_with: "parent" },
    });
    const domains = flattenConnection(result.domains);

    // parent.eth is canonical (registered under the v2 ETH Registry which descends from the v2 Root)
    const parentEth = domains.find((d) => d.canonical?.name.interpreted === "parent.eth");
    expect(parentEth).toBeDefined();

    // every returned domain must be canonical
    for (const d of domains) {
      expect(d.canonical, `expected canonical for ${d.id}`).not.toBeNull();
    }
  });

  // TODO: devnet fixture needs a known non-canonical Domain to assert exclusion against.
  it.todo("excludes non-canonical domains from the result set");

  describe("version?: ENSProtocolVersion", () => {
    it("returns any version when unspecified", async () => {
      const result = await request<QueryDomainsResult>(QueryDomains, {
        name: { eq: "reverse" },
        version: undefined,
      });
      const domains = flattenConnection(result.domains);
      expect(domains.find((d) => d.__typename === "ENSv1Domain")).toBeDefined();
      expect(domains.find((d) => d.__typename === "ENSv2Domain")).toBeDefined();
    });

    it("returns only ENSv1Domains when version: ENSv1", async () => {
      const result = await request<QueryDomainsResult>(QueryDomains, {
        name: { eq: "reverse" },
        version: "ENSv1",
      });
      const domains = flattenConnection(result.domains);
      expect(domains.find((d) => d.__typename === "ENSv1Domain")).toBeDefined();
      expect(domains.find((d) => d.__typename === "ENSv2Domain")).not.toBeDefined();
    });

    it("returns only ENSv2Domains when version: ENSv2", async () => {
      const result = await request<QueryDomainsResult>(QueryDomains, {
        name: { eq: "reverse" },
        version: "ENSv2",
      });
      const domains = flattenConnection(result.domains);
      expect(domains.find((d) => d.__typename === "ENSv1Domain")).not.toBeDefined();
      expect(domains.find((d) => d.__typename === "ENSv2Domain")).toBeDefined();
    });
  });

  describe("name: { eq | in }", () => {
    it("eq returns exact matches across versions", async () => {
      const result = await request<QueryDomainsResult>(QueryDomains, {
        name: { eq: "eth" },
      });
      const domains = flattenConnection(result.domains);

      // v1 and v2 'eth' both exist; both should be returned (no version filter applied)
      expect(
        domains.find((d) => d.__typename === "ENSv1Domain" && d.id === V1_ETH_DOMAIN_ID),
      ).toBeDefined();
      expect(
        domains.find((d) => d.__typename === "ENSv2Domain" && d.id === V2_ETH_DOMAIN_ID),
      ).toBeDefined();

      // no prefix-matched names like "ethereum" should leak in
      for (const d of domains) expect(d.canonical?.name.interpreted).toBe("eth");
    });

    it("eq + version: ENSv1 returns a single domain", async () => {
      const result = await request<QueryDomainsResult>(QueryDomains, {
        name: { eq: "eth" },
        version: "ENSv1",
      });
      const domains = flattenConnection(result.domains);
      expect(domains).toHaveLength(1);
      expect(domains[0]).toMatchObject({
        __typename: "ENSv1Domain",
        id: V1_ETH_DOMAIN_ID,
        canonical: { name: { interpreted: "eth" } },
      });
    });

    it("in returns the union of exact matches", async () => {
      const result = await request<QueryDomainsResult>(QueryDomains, {
        name: { in: ["eth", "parent.eth"] },
      });
      const domains = flattenConnection(result.domains);
      const names = new Set(domains.map((d) => d.canonical?.name.interpreted));
      expect(names.has("eth")).toBe(true);
      expect(names.has("parent.eth")).toBe(true);
      for (const d of domains)
        expect(["eth", "parent.eth"]).toContain(d.canonical?.name.interpreted);
    });

    it("in returns empty for an empty set", async () => {
      const result = await request<QueryDomainsResult>(QueryDomains, {
        name: { in: [] },
      });
      const domains = flattenConnection(result.domains);
      expect(domains).toHaveLength(0);
    });

    it("rejects when more than one oneOf field is provided", async () => {
      await expect(
        request<QueryDomainsResult>(QueryDomains, {
          name: { starts_with: "eth", eq: "eth" },
        }),
      ).rejects.toThrow();
    });
  });
});

describe("Query.domain", () => {
  const DomainByName = gql`
    query DomainByName($name: InterpretedName!) {
      domain(by: { name: $name }) {
        id
        canonical { name { interpreted } }
      }
    }
  `;

  it.each(DEVNET_NAMES)("resolves $name", async ({ name, canonical }) => {
    await expect(request(DomainByName, { name })).resolves.toMatchObject({
      domain: { canonical: { name: { interpreted: canonical } } },
    });
  });

  // ENSv1-only names are reserved in the ENSv2 ETHRegistry (resolver = ENSV1Resolver), mirroring the
  // migration. The walk prefers the ENSv2 Domain, and the ENSv2 registration emits the literal label,
  // so each name resolves to an ENSv2 Domain whose canonical is the full literal name — including the
  // legacy-unwrapped name whose ENSv1 canonical is an Encoded LabelHash.
  it.each(DEVNET_ENSV1_NAMES)(
    "resolves ENSv1-only name $name to its reserved ENSv2 Domain via domain(by: name)",
    async ({ name, label, canonical }) => {
      const id = makeENSv2DomainId(
        V2_ETH_REGISTRY,
        makeStorageId(labelhashInterpretedLabel(asInterpretedLabel(label))),
      );
      await expect(request(DomainByName, { name })).resolves.toMatchObject({
        domain: { id, canonical: { name: { interpreted: canonical } } },
      });
    },
  );

  it("returns null for a nonexistent name", async () => {
    await expect(
      request(DomainByName, { name: "this-name-definitely-does-not-exist-xyz123.eth" }),
    ).resolves.toMatchObject({ domain: null });
  });
});

describe("Query.domain (UnindexedDomain)", () => {
  const DomainDetail = gql`
    query DomainDetail($name: InterpretedName!) {
      domain(by: { name: $name }) {
        __typename
        id
        label { interpreted }
        registry { __typename id }
        canonical {
          name { interpreted }
          depth
          path { __typename id }
        }
      }
    }
  `;

  type DomainDetailResult = {
    domain: {
      __typename: string;
      id: DomainId;
      label: { interpreted: InterpretedLabel };
      registry: { __typename: string; id: string } | null;
      canonical: {
        name: { interpreted: Name };
        depth: number;
        path: { __typename: string; id: DomainId }[];
      } | null;
    } | null;
  };

  it("returns a Canonical UnindexedDomain for an unregistered wildcard subname under an extended Resolver", async () => {
    // parent.eth carries an ENSIP-10 wildcard (extended) Resolver, so an unregistered subname under
    // it is resolvable-but-unindexed.
    const name = `unregistered-wildcard.${effectiveResolverFallback.parentName}`;
    const result = await request<DomainDetailResult>(DomainDetail, { name });

    expect(result.domain).not.toBeNull();
    expect(result.domain?.__typename).toBe("UnindexedDomain");
    // its leaf Label is derived from the queried Name
    expect(result.domain?.label.interpreted).toBe("unregistered-wildcard");
    // it is virtualized onto the Registry that manages the wildcard Resolver's Domain
    expect(result.domain?.registry).not.toBeNull();
    // it IS Canonical (it is named): its canonical metadata is populated
    expect(result.domain?.canonical?.name.interpreted).toBe(name);
    expect(result.domain?.canonical?.depth).toBe(3);
    // its canonical path is root→leaf: indexed `eth` + indexed `parent.eth` + the virtual leaf
    const path = result.domain?.canonical?.path ?? [];
    expect(path).toHaveLength(3);
    expect(path[2]).toMatchObject({ __typename: "UnindexedDomain", id: result.domain?.id });
  });

  it("builds a label-by-label canonical path with an UnindexedDomain per unindexed ancestor", async () => {
    // two labels below the wildcard-Resolver Domain: both `b.parent.eth` and `a.b.parent.eth` are
    // unindexed, so the path is [eth, parent.eth, b.parent.eth(UD), a.b.parent.eth(UD)]
    const name = `a.b.${effectiveResolverFallback.parentName}`;
    const result = await request<DomainDetailResult>(DomainDetail, { name });

    expect(result.domain?.__typename).toBe("UnindexedDomain");
    expect(result.domain?.canonical?.depth).toBe(4);
    const path = result.domain?.canonical?.path ?? [];
    expect(path).toHaveLength(4);
    // the two leaf-ward path nodes are virtual UnindexedDomains
    expect(path[2]?.__typename).toBe("UnindexedDomain");
    expect(path[3]).toMatchObject({ __typename: "UnindexedDomain", id: result.domain?.id });
  });

  it("exposes the wildcard ancestor's Resolver as the effective Resolver (assigned is null)", async () => {
    const UnindexedDomainResolver = gql`
      query UnindexedDomainResolver($name: InterpretedName!) {
        domain(by: { name: $name }) {
          __typename
          resolver {
            assigned { contract { chainId address } }
            effective { contract { chainId address } }
          }
        }
      }
    `;

    type ResolverContract = { contract: { chainId: number; address: string } } | null;
    type Result = {
      domain: {
        __typename: string;
        resolver: { assigned: ResolverContract; effective: ResolverContract };
      } | null;
    };

    const name = `unregistered-wildcard.${effectiveResolverFallback.parentName}`;
    const result = await request<Result>(UnindexedDomainResolver, { name });

    expect(result.domain?.__typename).toBe("UnindexedDomain");
    // a virtual Domain has no Resolver assigned directly to it
    expect(result.domain?.resolver.assigned).toBeNull();
    // but its effective Resolver is the wildcard ancestor's (parent.eth's) Resolver
    const { domain: parent } = await request<Result>(UnindexedDomainResolver, {
      name: effectiveResolverFallback.parentName,
    });
    expect(parent?.resolver.assigned?.contract.address).toBeTruthy();
    expect(result.domain?.resolver.effective?.contract).toEqual(
      parent?.resolver.assigned?.contract,
    );
  });

  it("returns null for an unregistered subname under a Resolver-less name (no wildcard Resolver)", async () => {
    await expect(
      request(DomainDetail, {
        name: "leaf.this-name-definitely-does-not-exist-xyz123.eth",
      }),
    ).resolves.toMatchObject({ domain: null });
  });

  it("returns null for an unresolvable name (Encoded LabelHash leaf) even under a wildcard Resolver", async () => {
    // an Encoded LabelHash has no known literal label, so the name is not a ResolvableName and is
    // not virtualized as an UnindexedDomain even though parent.eth has a wildcard Resolver
    const encodedLabelHash = `[${"0".repeat(64)}]`;
    await expect(
      request(DomainDetail, {
        name: `${encodedLabelHash}.${effectiveResolverFallback.parentName}`,
      }),
    ).resolves.toMatchObject({ domain: null });
  });
});

describe("Query.domains pagination", () => {
  testDomainPagination(async (variables) => {
    const result = await request<{ domains: PaginatedGraphQLConnection<PaginatedDomainResult> }>(
      QueryDomainsPaginated,
      variables,
    );
    return result.domains;
  });
});

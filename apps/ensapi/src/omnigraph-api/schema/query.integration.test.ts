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

import { DEVNET_NAMES } from "@/test/integration/devnet-names";
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
        canonical { name { interpreted } }
      }
    }
  `;

  it.each(DEVNET_NAMES)("resolves $name", async ({ name, canonical }) => {
    await expect(request(DomainByName, { name })).resolves.toMatchObject({
      domain: { canonical: { name: { interpreted: canonical } } },
    });
  });

  it("returns null for a nonexistent name", async () => {
    await expect(
      request(DomainByName, { name: "this-name-definitely-does-not-exist-xyz123.eth" }),
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

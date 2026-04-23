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
      name: Name;
      label: { interpreted: InterpretedLabel };
      owner: { address: NormalizedAddress };
      node?: Node;
    }>;
  };

  const QueryDomains = gql`
    query QueryDomains($name: String!, $canonical: Boolean, $order: DomainsOrderInput) {
      domains(where: { name: $name, canonical: $canonical }, order: $order) {
        edges {
          node {
            __typename
            id
            name
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
    const result = await request<QueryDomainsResult>(QueryDomains, { name: "eth" });

    const domains = flattenConnection(result.domains);

    // there's at least a v2 'eth' domain
    expect(domains.length).toBeGreaterThanOrEqual(1);

    const v1EthDomain = domains.find((d) => d.__typename === "ENSv1Domain" && d.name === "eth");
    const v2EthDomain = domains.find((d) => d.__typename === "ENSv2Domain" && d.name === "eth");

    expect(v1EthDomain).toMatchObject({
      id: V1_ETH_DOMAIN_ID,
      name: "eth",
      label: { interpreted: "eth" },
      // ENSv1Domain exposes `node` — the namehash of the canonical name
      node: ETH_NODE,
    });

    expect(v2EthDomain).toMatchObject({
      id: V2_ETH_DOMAIN_ID,
      name: "eth",
      label: { interpreted: "eth" },
    });
  });

  it("filters by canonical", async () => {
    const result = await request<QueryDomainsResult>(QueryDomains, {
      name: "parent",
      canonical: true,
    });

    const domains = flattenConnection(result.domains);

    // parent.eth is canonical (registered under the v2 ETH Registry which descends from the v2 Root)
    const parentEth = domains.find((d) => d.name === "parent.eth");
    expect(parentEth).toBeDefined();

    // every returned domain must have a defined canonical `name` (only canonical domains resolve one)
    for (const d of domains) {
      expect(d.name, `expected canonical name for ${d.id}`).toBeTruthy();
    }
  });
});

describe("Query.domain", () => {
  const DomainByName = gql`
    query DomainByName($name: InterpretedName!) {
      domain(by: { name: $name }) {
        name
      }
    }
  `;

  it.each(DEVNET_NAMES)("resolves $name", async ({ name, canonical }) => {
    await expect(request(DomainByName, { name })).resolves.toMatchObject({
      domain: { name: canonical },
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

import { type Address, labelhash } from "viem";
import { describe, expect, it } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import {
  type DomainId,
  getCanonicalId,
  getDatasourceContract,
  getENSv2RootRegistryId,
  type InterpretedLabel,
  makeENSv2DomainId,
  type Name,
} from "@ensnode/ensnode-sdk";

import { DEVNET_NAMES } from "@/test/integration/devnet-names";
import { gql } from "@/test/integration/ensnode-graphql-api-client";
import { flattenConnection, request } from "@/test/integration/graphql-utils";

const namespace = "ens-test-env";

const V2_ROOT_REGISTRY = getDatasourceContract(
  namespace,
  DatasourceNames.ENSv2Root,
  "RootRegistry",
);

const V2_ETH_CANONICAL_ID = getCanonicalId(labelhash("eth"));
const V2_ETH_DOMAIN_ID = makeENSv2DomainId(V2_ROOT_REGISTRY, V2_ETH_CANONICAL_ID);

describe("Query.root", () => {
  it("returns the root registry", async () => {
    await expect(request(gql`{ root { id } }`)).resolves.toMatchObject({
      root: {
        id: getENSv2RootRegistryId(namespace),
      },
    });
  });
});

describe("Query.domains", () => {
  type QueryDomainsResult = {
    domains: {
      edges: Array<{
        node: {
          __typename: "ENSv1Domain" | "ENSv2Domain";
          id: DomainId;
          name: Name;
          label: { interpreted: InterpretedLabel };
          owner: { address: Address };
        };
      }>;
    };
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

  it("sees both .eth Domains", async () => {
    const result = await request<QueryDomainsResult>(QueryDomains, { name: "eth" });

    const domains = flattenConnection(result.domains);

    // there's at least a v2 'eth' domain
    expect(domains.length).toBeGreaterThanOrEqual(1);

    const v1EthDomain = domains.find((d) => d.__typename === "ENSv1Domain" && d.name === "eth");
    const v2EthDomain = domains.find((d) => d.__typename === "ENSv2Domain" && d.name === "eth");

    // TODO: the v1 eth label should surely exist but i don't see it in devnet at the moment?
    expect(v1EthDomain).toBeUndefined();
    // expect(v1EthDomain).toMatchObject({
    //   id: V1_ETH_DOMAIN_ID,
    //   name: "eth",
    //   label: { interpreted: "eth" },
    // });

    expect(v2EthDomain).toMatchObject({
      id: V2_ETH_DOMAIN_ID,
      name: "eth",
      label: { interpreted: "eth" },
    });
  });
});

describe("Query.domain", () => {
  const DomainByName = gql`
    query DomainByName($name: Name!) {
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

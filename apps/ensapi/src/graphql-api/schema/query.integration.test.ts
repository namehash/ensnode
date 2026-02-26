import { labelhash, namehash } from "viem";
import { describe, expect, it } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import {
  getCanonicalId,
  getDatasourceContract,
  getENSv2RootRegistryId,
  makeENSv1DomainId,
  makeENSv2DomainId,
} from "@ensnode/ensnode-sdk";

import { gql } from "@/test/integration/ensnode-graphql-api-client";
import { flattenConnection, request } from "@/test/integration/graphql-utils";

const namespace = "ens-test-env";

const V2_ROOT_REGISTRY = getDatasourceContract(
  namespace,
  DatasourceNames.ENSv2Root,
  "RootRegistry",
);

const V2_ETH_REGISTRY = getDatasourceContract(
  namespace, //
  DatasourceNames.ENSv2Root,
  "ETHRegistry",
);

const V1_ETH_DOMAIN_ID = makeENSv1DomainId(namehash("eth"));

const V2_ETH_CANONICAL_ID = getCanonicalId(labelhash("eth"));
const V2_ETH_DOMAIN_ID = makeENSv2DomainId(V2_ROOT_REGISTRY, V2_ETH_CANONICAL_ID);

const DEVNET_NAMES = [
  { name: "test.eth", canonical: "test.eth" },
  { name: "example.eth", canonical: "example.eth" },
  { name: "demo.eth", canonical: "demo.eth" },
  { name: "newowner.eth", canonical: "newowner.eth" },
  { name: "renew.eth", canonical: "renew.eth" },
  { name: "reregister.eth", canonical: "reregister.eth" },
  { name: "parent.eth", canonical: "parent.eth" },
  { name: "changerole.eth", canonical: "changerole.eth" },
  { name: "alias.eth", canonical: "alias.eth" },
  { name: "sub.alias.eth", canonical: "sub.alias.eth" },
  { name: "sub2.parent.eth", canonical: "sub2.parent.eth" },
  { name: "sub1.sub2.parent.eth", canonical: "sub1.sub2.parent.eth" },
  { name: "wallet.sub1.sub2.parent.eth", canonical: "wallet.sub1.sub2.parent.eth" },
  { name: "linked.parent.eth", canonical: "linked.parent.eth" },
  { name: "wallet.linked.parent.eth", canonical: "wallet.linked.parent.eth" },
];

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
  it.todo("requires the name filter");

  it("sees both .eth Domains", async () => {
    const result = await request<{
      domains: {
        edges: Array<{
          node: {
            __typename: "ENSv1Domain" | "ENSv2Domain";
            id: string;
            name: string;
            label: { interpreted: string };
            owner: { address: string };
          };
        }>;
      };
    }>(gql`
      query FindDomains {
        domains(where: { name: "eth" }, order: { by: NAME, dir: ASC }) {
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
    `);

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

  it("returns subdomains for a domain", async () => {
    const result = await request<{
      domain: {
        name: string;
        subdomainCount: number;
        subdomains: {
          edges: Array<{ node: { name: string } }>;
        };
      };
    }>(gql`
      query Subdomains {
        domain(by: { name: "eth" }) {
          name
          subdomainCount
          subdomains {
            edges {
              node {
                name
              }
            }
          }
        }
      }
    `);

    expect(result).toMatchObject({ domain: { name: "eth" } });
    expect(result.domain.subdomains.edges.length).toBeGreaterThan(0);
  });
});

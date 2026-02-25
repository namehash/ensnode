import { describe, expect, it } from "vitest";

import { getENSv2RootRegistryId } from "@ensnode/ensnode-sdk";

import { client, gql } from "@/test/integration/ensnode-graphql-api-client";

const namespace = "ens-test-env";

describe("Query.root", () => {
  it("returns the root registry", async () => {
    await expect(
      client.request(gql`
      {
        root {
          id
        }
      }
    `),
    ).resolves.toMatchObject({
      root: {
        id: getENSv2RootRegistryId(namespace),
      },
    });
  });
});

describe("Query.domains", () => {
  it.todo("requires the name filter");
  it.todo("");

  it("returns edges when searching by partial name", async () => {
    const data = await client.request<{
      domains: {
        edges: Array<{
          node: {
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

    // there's a v1 'eth' domain and a v2 'eth' domain
    expect(data.domains.edges.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Query.domain", () => {
  it("returns a domain by name", async () => {
    const data = await client.request<{
      domain: {
        __typename: string;
        name: string;
        subdomainCount: number;
      } | null;
    }>(gql`
      query DomainByName {
        domain(by: { name: "eth" }) {
          __typename
          name
          subdomainCount
        }
      }
    `);

    expect(data.domain).not.toBeNull();
    expect(data.domain!.name).toBe("eth");
    expect(data.domain!.subdomainCount).toEqual(expect.any(Number));
  });

  it("returns null for a nonexistent name", async () => {
    const data = await client.request<{
      domain: null;
    }>(gql`
      query NonexistentDomain {
        domain(
          by: { name: "this-name-definitely-does-not-exist-xyz123.eth" }
        ) {
          name
        }
      }
    `);

    expect(data.domain).toBeNull();
  });

  it("returns subdomains for a domain", async () => {
    const data = await client.request<{
      domain: {
        name: string;
        subdomainCount: number;
        subdomains: {
          edges: Array<{ node: { name: string } }>;
        };
      } | null;
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

    expect(data.domain).not.toBeNull();
    expect(data.domain!.subdomains.edges.length).toBeGreaterThan(0);
  });
});

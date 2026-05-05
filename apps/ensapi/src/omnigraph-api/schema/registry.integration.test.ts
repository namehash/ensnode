import type { InterpretedLabel } from "enssdk";
import { describe, expect, it } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import { getDatasourceContract } from "@ensnode/ensnode-sdk";

import { DEVNET_ETH_LABELS } from "@/test/integration/devnet-names";
import {
  type PaginatedDomainResult,
  RegistryDomainsPaginated,
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

const V2_ETH_REGISTRY = getDatasourceContract(namespace, DatasourceNames.ENSv2Root, "ETHRegistry");
const V2_ROOT_REGISTRY = getDatasourceContract(
  namespace,
  DatasourceNames.ENSv2Root,
  "RootRegistry",
);
const V1_ROOT_REGISTRY = getDatasourceContract(namespace, DatasourceNames.ENSRoot, "ENSv1Registry");

describe("Registry.domains", () => {
  type RegistryDomainsResult = {
    registry: {
      domains: GraphQLConnection<{
        label: { interpreted: InterpretedLabel };
      }>;
    };
  };

  const RegistryDomains = gql`
    query RegistryDomains($contract: AccountIdInput!) {
      registry(by: { contract: $contract }) {
        domains {
          edges {
            node {
              label { interpreted }
            }
          }
        }
      }
    }
  `;

  it("returns at least all known .eth domains", async () => {
    const result = await request<RegistryDomainsResult>(RegistryDomains, {
      contract: V2_ETH_REGISTRY,
    });

    const domains = flattenConnection(result.registry.domains);
    const actual = domains.map((d) => d.label.interpreted);

    for (const expected of DEVNET_ETH_LABELS) {
      expect(actual, `expected '${expected}' in ETH registry domains`).toContain(expected);
    }
  });
});

describe("Registry.canonical", () => {
  const RegistryCanonical = gql`
    query RegistryCanonical($contract: AccountIdInput!) {
      registry(by: { contract: $contract }) { canonical }
    }
  `;

  it("is true for the ENSv2 root registry", async () => {
    await expect(request(RegistryCanonical, { contract: V2_ROOT_REGISTRY })).resolves.toMatchObject(
      { registry: { canonical: true } },
    );
  });

  it("is false for the ENSv1 root registry (in ens-test-env, v2 is the canonical root)", async () => {
    await expect(request(RegistryCanonical, { contract: V1_ROOT_REGISTRY })).resolves.toMatchObject(
      { registry: { canonical: false } },
    );
  });
});

describe("Registry.domains pagination", () => {
  testDomainPagination(async (variables) => {
    const result = await request<{
      registry: { domains: PaginatedGraphQLConnection<PaginatedDomainResult> };
    }>(RegistryDomainsPaginated, { contract: V2_ETH_REGISTRY, ...variables });
    return result.registry.domains;
  });
});

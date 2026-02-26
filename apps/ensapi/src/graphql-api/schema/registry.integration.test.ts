import { describe, expect, it } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import { getDatasourceContract, type InterpretedLabel } from "@ensnode/ensnode-sdk";

import { DEVNET_ETH_LABELS } from "@/test/integration/devnet-names";
import {
  type PaginatedDomainResult,
  RegistryDomainsPaginated,
} from "@/test/integration/domain-pagination-queries";
import { gql } from "@/test/integration/ensnode-graphql-api-client";
import {
  flattenConnection,
  type GraphQLConnection,
  request,
} from "@/test/integration/graphql-utils";
import { testDomainPagination } from "@/test/integration/test-domain-pagination";

const namespace = "ens-test-env";

const V2_ETH_REGISTRY = getDatasourceContract(namespace, DatasourceNames.ENSv2Root, "ETHRegistry");

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

describe("Registry.domains pagination", () => {
  testDomainPagination(async (variables) => {
    const result = await request<{
      registry: { domains: GraphQLConnection<PaginatedDomainResult> };
    }>(RegistryDomainsPaginated, { contract: V2_ETH_REGISTRY, ...variables });
    return result.registry.domains;
  });
});

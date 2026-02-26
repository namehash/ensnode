import { describe, expect, it } from "vitest";

import type { InterpretedLabel, Name } from "@ensnode/ensnode-sdk";

import { DEVNET_ETH_LABELS } from "@/test/integration/devnet-names";
import { gql } from "@/test/integration/ensnode-graphql-api-client";
import {
  flattenConnection,
  type GraphQLConnection,
  request,
} from "@/test/integration/graphql-utils";

describe("Domain.subdomains", () => {
  type SubdomainsResult = {
    domain: {
      subdomains: GraphQLConnection<{
        name: Name | null;
        label: { interpreted: InterpretedLabel };
      }>;
    };
  };

  const DomainSubdomains = gql`
    query DomainSubdomains($name: Name!) {
      domain(by: { name: $name }) {
        subdomains {
          edges {
            node {
              name
              label {
                interpreted
              }
            }
          }
        }
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

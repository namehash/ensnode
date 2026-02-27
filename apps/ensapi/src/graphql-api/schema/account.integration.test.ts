import type { Address } from "viem";
import { describe, expect, it } from "vitest";

import type { Name } from "@ensnode/ensnode-sdk";

import {
  AccountDomainsPaginated,
  type PaginatedDomainResult,
} from "@/test/integration/domain-pagination-queries";
import { gql } from "@/test/integration/ensnode-graphql-api-client";
import {
  flattenConnection,
  type GraphQLConnection,
  type PaginatedGraphQLConnection,
  request,
} from "@/test/integration/graphql-utils";
import { testDomainPagination } from "@/test/integration/test-domain-pagination";

// via devnet
const DEFAULT_OWNER: Address = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const NEW_OWNER: Address = "0x90f79bf6eb2c4f870365e785982e1f101e93b906";

describe("Account.domains", () => {
  type AccountDomainsResult = {
    account: {
      domains: GraphQLConnection<{
        name: Name | null;
      }>;
    };
  };

  const AccountDomains = gql`
    query AccountDomains($address: Address!) {
      account(address: $address) {
        domains(order: { by: NAME, dir: ASC }) {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  `;

  it("returns domains owned by the default owner", async () => {
    const result = await request<AccountDomainsResult>(AccountDomains, { address: DEFAULT_OWNER });
    const domains = flattenConnection(result.account.domains);
    const names = domains.map((d) => d.name);

    const expected = [
      "alias.eth",
      "changerole.eth",
      "demo.eth",
      "example.eth",
      "linked.parent.eth",
      "parent.eth",
      "renew.eth",
      "reregister.eth",
      "sub1.sub2.parent.eth",
      "sub2.parent.eth",
      "test.eth",
      "wallet.linked.parent.eth",
    ];

    for (const name of expected) {
      expect(names, `expected '${name}' in default owner's domains`).toContain(name);
    }
  });

  it("returns domains owned by the new owner", async () => {
    const result = await request<AccountDomainsResult>(AccountDomains, { address: NEW_OWNER });
    const domains = flattenConnection(result.account.domains);
    const names = domains.map((d) => d.name);

    expect(names, "expected 'newowner.eth' in new owner's domains").toContain("newowner.eth");
  });
});

describe("Account.domains pagination", () => {
  testDomainPagination(async (variables) => {
    const result = await request<{
      account: { domains: PaginatedGraphQLConnection<PaginatedDomainResult> };
    }>(AccountDomainsPaginated, { address: DEFAULT_OWNER, ...variables });
    return result.account.domains;
  });
});

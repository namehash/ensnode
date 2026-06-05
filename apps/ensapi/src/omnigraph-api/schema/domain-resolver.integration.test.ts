import { asInterpretedName } from "enssdk";
import { describe, expect, it } from "vitest";

import { effectiveResolverFallback } from "@ensnode/integration-test-env/devnet";

import { request } from "@/test/integration/graphql-utils";
import { gql } from "@/test/integration/omnigraph-api-client";

type ResolverContract = { contract: { chainId: number; address: string } } | null;
type DomainResolverResult = {
  domain: { resolver: { assigned: ResolverContract; effective: ResolverContract } } | null;
};

const DomainResolvers = gql`
  query DomainResolvers($name: InterpretedName!) {
    domain(by: { name: $name }) {
      resolver {
        assigned { contract { chainId address } }
        effective { contract { chainId address } }
      }
    }
  }
`;

const queryResolvers = (name: string) =>
  request<DomainResolverResult>(DomainResolvers, { name: asInterpretedName(name) });

describe("DomainResolver.effective", () => {
  it("equals the assigned Resolver when the Domain has its own Resolver", async () => {
    const { domain } = await queryResolvers("test.eth");
    const resolver = domain?.resolver;

    expect(resolver?.assigned?.contract.address).toBeTruthy();
    expect(resolver?.effective?.contract).toEqual(resolver?.assigned?.contract);
  });

  it("falls back to an ancestor's Resolver when the Domain has none", async () => {
    const { subname, parentName } = effectiveResolverFallback;

    const { domain } = await queryResolvers(subname);
    const resolver = domain?.resolver;

    // the seeded subname has no Resolver of its own
    expect(resolver?.assigned).toBeNull();

    // but its effective Resolver is its parent's (ENSIP-10 fallback)
    const { domain: parent } = await queryResolvers(parentName);
    expect(parent?.resolver.assigned?.contract.address).toBeTruthy();
    expect(resolver?.effective?.contract).toEqual(parent?.resolver.assigned?.contract);
  });
});

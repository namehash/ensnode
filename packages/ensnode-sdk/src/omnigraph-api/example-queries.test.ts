import { describe, expect, it } from "vitest";

import { listGraphqlApiExampleQueryIds, resolveGraphqlApiExampleQuery } from "./example-queries";

describe("resolveGraphqlApiExampleQuery", () => {
  it("uses example defaults when variables are omitted", () => {
    const { variables } = resolveGraphqlApiExampleQuery("registry-domains");
    expect(variables.registry).toBeDefined();
    expect(variables.registry).toMatchObject({
      chainId: expect.any(Number),
      address: expect.any(String),
    });
  });

  it("replaces example defaults when variables are provided", () => {
    const { variables } = resolveGraphqlApiExampleQuery("account-migrated-names", {
      variables: { address: "0x0000000000000000000000000000000000000001" },
    });
    expect(variables).toEqual({ address: "0x0000000000000000000000000000000000000001" });
  });

  it("resolves account-profile alias to hello-world defaults", () => {
    const { query, variables } = resolveGraphqlApiExampleQuery("account-profile");
    expect(query).toContain("primaryName(by: { chainName: ETHEREUM })");
    expect(variables.address).toMatch(/^0x[a-f0-9]{40}$/);
  });
});

describe("listGraphqlApiExampleQueryIds", () => {
  it("includes alias ids alongside canonical ids", () => {
    const ids = listGraphqlApiExampleQueryIds();
    expect(ids).toContain("hello-world");
    expect(ids).toContain("account-profile");
  });
});

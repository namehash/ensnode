import { describe, expect, it } from "vitest";

import { buildCondensedSchemaReference, lookupOmnigraphSchema } from "./schema-reference";

describe("omnigraph schema reference", () => {
  it("builds a condensed schema reference with core entry points", () => {
    const reference = buildCondensedSchemaReference();
    expect(reference).toContain("account(by: AccountByInput!)");
    expect(reference).toContain("#### Account");
    expect(reference).toContain("resolve(accelerate: Boolean): ReverseResolve!");
  });

  it("searches schema fields by keyword", () => {
    const result = lookupOmnigraphSchema({ search: "primaryName" }) as { fields: string[] };
    expect(result.fields).toContain("ReverseResolve.primaryName");
  });

  it("describes a type by name", () => {
    const result = lookupOmnigraphSchema({ type: "Account" }) as {
      name: string;
      fields: unknown[];
    };
    expect(result.name).toBe("Account");
    expect(result.fields.length).toBeGreaterThan(0);
  });
});

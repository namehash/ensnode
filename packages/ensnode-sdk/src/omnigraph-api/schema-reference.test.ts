import { describe, expect, it } from "vitest";

import { buildCondensedSchemaReference, lookupOmnigraphSchema } from "./schema-reference";

describe("omnigraph schema reference", () => {
  it("builds a condensed schema reference with core entry points", () => {
    const reference = buildCondensedSchemaReference();
    expect(reference).toContain("account(by: AccountByInput!)");
    expect(reference).toContain("#### Account");
    expect(reference).toContain("resolve(accelerate: Boolean): ReverseResolve!");
    expect(reference).toContain("#### DomainsNameFilter");
    expect(reference).toContain("starts_with:");
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

  it("reports unknown types for Type.field lookups", () => {
    expect(() => lookupOmnigraphSchema({ type: "NotAType.field" })).toThrow(
      /Unknown type "NotAType"/,
    );
  });

  it("reports missing fields with a schema lookup hint", () => {
    expect(() => lookupOmnigraphSchema({ type: "Account.notAField" })).toThrow(
      /has no field "notAField"/,
    );
  });

  it("rejects Type.field lookups with extra dot-separated segments", () => {
    expect(() => lookupOmnigraphSchema({ type: "Account.resolve.extra" })).toThrow(
      /Invalid `type`/,
    );
  });

  it("rejects type and search together", () => {
    expect(() => lookupOmnigraphSchema({ type: "Account", search: "resolve" })).toThrow(
      /Provide either `type` or `search`/,
    );
  });
});

import { describe, expect, it } from "vitest";

import { parsePnpmCatalog, resolveMonorepoSpecifier } from "./resolveMonorepoSpecifier";

describe("parsePnpmCatalog", () => {
  it("throws when workspace yaml has no catalog section", () => {
    expect(() => parsePnpmCatalog("packages:\n  - apps/*\n")).toThrow(
      "Failed to parse pnpm catalog from pnpm-workspace.yaml",
    );
  });
});

describe("resolveMonorepoSpecifier", () => {
  it("resolves catalog: specifiers from pnpm-workspace.yaml", () => {
    expect(resolveMonorepoSpecifier("@types/node", "catalog:")).toBe("24.10.9");
    expect(resolveMonorepoSpecifier("typescript", "catalog:")).toBe("^5.7.3");
  });

  it("passes through npm semver ranges", () => {
    expect(resolveMonorepoSpecifier("gql.tada", "^1.8.10")).toBe("^1.8.10");
    expect(resolveMonorepoSpecifier("tsx", "^4.7.1")).toBe("^4.7.1");
  });

  it("resolves enssdk workspace:* to the published package version", () => {
    expect(resolveMonorepoSpecifier("enssdk", "workspace:*")).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("resolves enskit workspace:* to the published package version", () => {
    expect(resolveMonorepoSpecifier("enskit", "workspace:*")).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

import { describe, expect, it } from "vitest";

import { resolveMonorepoSpecifier } from "./resolveMonorepoSpecifier";

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
});

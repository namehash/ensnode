import { describe, expect, it } from "vitest";

import { OMNIGRAPH_MCP_INSTRUCTIONS } from "./omnigraph-mcp-support";

describe("omnigraph MCP support", () => {
  it("documents anti-patterns in server instructions", () => {
    expect(OMNIGRAPH_MCP_INSTRUCTIONS).toContain("account(id:");
    expect(OMNIGRAPH_MCP_INSTRUCTIONS).toContain("exampleId account-migrated-names");
  });
});

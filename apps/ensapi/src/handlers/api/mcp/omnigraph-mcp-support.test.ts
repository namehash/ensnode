import { describe, expect, it } from "vitest";

import { buildOmnigraphMcpInstructions } from "./omnigraph-mcp-support";

describe("omnigraph MCP support", () => {
  it("requires exampleId before custom GraphQL and inlines the catalog", () => {
    const instructions = buildOmnigraphMcpInstructions();

    expect(instructions).toContain(
      "Before ANY query: call omnigraph_query with exampleId from the list below. Only write custom GraphQL if no example fits.",
    );
    expect(instructions).toContain("Vetted exampleId values:");
    expect(instructions).toContain("- account-profile —");
    expect(instructions).toContain("- domain-profile —");
    expect(instructions).toContain("- account-migrated-names —");
    expect(instructions).toContain("account(id:");
    expect(instructions).toContain("starts_with");
  });
});

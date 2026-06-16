import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const MCP_URL = new URL("/api/mcp", process.env.ENSNODE_URL!);

type TextContent = { type: "text"; text: string };

/** Connects an MCP client to the live ENSApi `/api/mcp` endpoint over Streamable HTTP. */
async function connect() {
  const client = new Client({ name: "ensapi-integration-test", version: "0.0.0" });
  const transport = new StreamableHTTPClientTransport(MCP_URL);
  await client.connect(transport);
  return client;
}

/** Calls `omnigraph_query` and parses the single text content block as GraphQL JSON. */
async function omnigraphQuery<T = unknown>(
  client: Client,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  const result = await client.callTool({
    name: "omnigraph_query",
    arguments: { query, variables },
  });

  const content = result.content as TextContent[];
  expect(content).toHaveLength(1);
  expect(content[0].type).toBe("text");
  return JSON.parse(content[0].text);
}

describe("Omnigraph MCP API (/api/mcp)", () => {
  let client: Client;

  beforeEach(async () => {
    client = await connect();
  });

  afterEach(async () => {
    await client.close();
  });

  it("advertises the omnigraph_query tool", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(
      expect.arrayContaining(["omnigraph_query", "omnigraph_schema"]),
    );
  });

  it("executes a trivial query end-to-end through Yoga", async () => {
    const { data, errors } = await omnigraphQuery<{ __typename: string }>(client, "{ __typename }");

    expect(errors).toBeUndefined();
    expect(data).toEqual({ __typename: "Query" });
  });

  it("resolves a seeded devnet domain via Query.domain", async () => {
    const { data, errors } = await omnigraphQuery<{
      domain: { canonical: { name: { interpreted: string } } } | null;
    }>(
      client,
      /* GraphQL */ `
        query DomainByName($name: InterpretedName!) {
          domain(by: { name: $name }) {
            canonical { name { interpreted } }
          }
        }
      `,
      { name: "test.eth" },
    );

    expect(errors).toBeUndefined();
    expect(data).toMatchObject({
      domain: { canonical: { name: { interpreted: "test.eth" } } },
    });
  });

  it("surfaces GraphQL errors for invalid queries in the response payload", async () => {
    const { errors } = await omnigraphQuery(client, "{ thisFieldDoesNotExist }");
    expect(errors).toBeDefined();
    expect(errors?.length ?? 0).toBeGreaterThan(0);
  });

  it("runs a vetted example query by exampleId", async () => {
    const result = await client.callTool({
      name: "omnigraph_query",
      arguments: {
        exampleId: "domain-by-name",
        variables: { name: "test.eth" },
      },
    });

    const content = result.content as TextContent[];
    const { data, errors } = JSON.parse(content[0].text) as {
      data?: { domain: { canonical: { name: { interpreted: string } } } | null };
      errors?: unknown[];
    };

    expect(errors).toBeUndefined();
    expect(data).toMatchObject({
      domain: { canonical: { name: { interpreted: "test.eth" } } },
    });
  });
});

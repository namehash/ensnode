import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the in-process Yoga instance so the tool can be exercised without a database. The tool
// imports it dynamically, so the mock is applied at call time.
const fetchMock = vi.fn<(request: Request, context: unknown) => Promise<Response>>();
vi.mock("@/omnigraph-api/yoga", () => ({ yoga: { fetch: fetchMock } }));

import { createOmnigraphMcpServer } from "./mcp-api";

/** Wires an MCP `Client` directly to a fresh server over an in-memory transport pair. */
async function connectClient() {
  const server = createOmnigraphMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return { client, server };
}

describe("Omnigraph MCP server", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("advertises the omnigraph_query tool", async () => {
    const { client } = await connectClient();

    const { tools } = await client.listTools();

    expect(tools.map((t) => t.name)).toContain("omnigraph_query");
  });

  it("executes omnigraph_query via yoga.fetch and returns the raw GraphQL JSON", async () => {
    const graphqlResponse = { data: { __typename: "Query" } };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(graphqlResponse), {
        headers: { "content-type": "application/json" },
      }),
    );

    const { client } = await connectClient();

    const result = await client.callTool({
      name: "omnigraph_query",
      arguments: { query: "{ __typename }" },
    });

    // The tool forwards the request to the in-process Yoga instance.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [request, context] = fetchMock.mock.calls[0];
    expect(request.method).toBe("POST");
    expect(new URL(request.url).pathname).toBe("/api/omnigraph");
    expect(context).toEqual({ canAccelerate: false });
    await expect(request.clone().json()).resolves.toEqual({
      query: "{ __typename }",
      variables: null,
    });

    // The tool returns Yoga's raw response body as text content.
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("text");
    expect(JSON.parse(content[0].text)).toEqual(graphqlResponse);
  });

  it("forwards GraphQL variables to yoga.fetch", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: null }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const { client } = await connectClient();

    await client.callTool({
      name: "omnigraph_query",
      arguments: {
        query: "query($id: ID!) { node(id: $id) { __typename } }",
        variables: { id: "0x1234" },
      },
    });

    const [request] = fetchMock.mock.calls[0];
    await expect(request.clone().json()).resolves.toMatchObject({
      variables: { id: "0x1234" },
    });
  });
});

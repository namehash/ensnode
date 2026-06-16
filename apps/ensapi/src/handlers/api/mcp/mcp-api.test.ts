import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the in-process Yoga instance so the tool can be exercised without a database. The tool
// imports it dynamically, so the mock is applied at call time.
const fetchMock = vi.fn<(request: Request, context: unknown) => Promise<Response>>();
vi.mock("@/omnigraph-api/yoga", () => ({ yoga: { fetch: fetchMock } }));

import mcpApi, { createOmnigraphMcpServer } from "./mcp-api";

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

  it("advertises omnigraph tools", async () => {
    const { client } = await connectClient();

    const { tools } = await client.listTools();

    expect(tools.map((t) => t.name)).toEqual(
      expect.arrayContaining(["omnigraph_query", "omnigraph_schema"]),
    );
  });

  it("advertises schema and example resources", async () => {
    const { client } = await connectClient();

    const { resources } = await client.listResources();

    expect(resources.map((resource) => resource.uri)).toEqual(
      expect.arrayContaining(["omnigraph://schema/condensed", "omnigraph://examples/index"]),
    );
  });

  it("reads the condensed schema resource", async () => {
    const { client } = await connectClient();

    const { contents } = await client.readResource({ uri: "omnigraph://schema/condensed" });

    expect(contents).toHaveLength(1);
    expect(contents[0]).toMatchObject({ mimeType: "text/markdown" });
    if (!("text" in contents[0])) throw new Error("expected text resource");
    expect(contents[0].text).toContain("account(by: AccountByInput!)");
    expect(contents[0].text).toContain("resolve(accelerate: Boolean): ReverseResolve!");
  });

  it("reads an example resource by id", async () => {
    const { client } = await connectClient();

    const { contents } = await client.readResource({ uri: "omnigraph://examples/hello-world" });

    expect(contents).toHaveLength(1);
    if (!("text" in contents[0])) throw new Error("expected text resource");
    const payload = JSON.parse(contents[0].text) as { id: string; query: string };
    expect(payload.id).toBe("hello-world");
    expect(payload.query).toContain("primaryName(by: { chainName: ETHEREUM })");
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [request, context] = fetchMock.mock.calls[0];
    expect(request.method).toBe("POST");
    expect(new URL(request.url).pathname).toBe("/api/omnigraph");
    expect(context).toEqual({ canAccelerate: false });
    await expect(request.clone().json()).resolves.toEqual({
      query: "{ __typename }",
      variables: null,
    });

    const content = result.content as Array<{ type: string; text: string }>;
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("text");
    expect(JSON.parse(content[0].text)).toEqual(graphqlResponse);
  });

  it("executes omnigraph_query by exampleId", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { account: null } }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const { client } = await connectClient();

    await client.callTool({
      name: "omnigraph_query",
      arguments: {
        exampleId: "account-migrated-names",
        variables: { address: "0x0000000000000000000000000000000000000001" },
      },
    });

    const [request] = fetchMock.mock.calls[0];
    const body = (await request.clone().json()) as {
      query: string;
      variables: Record<string, unknown>;
    };
    expect(body.query).toContain("v1DomainsCount");
    expect(body.variables).toEqual({ address: "0x0000000000000000000000000000000000000001" });
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

  it("returns omnigraph_schema lookup for Account", async () => {
    const { client } = await connectClient();

    const result = await client.callTool({
      name: "omnigraph_schema",
      arguments: { type: "Account" },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as { name: string; fields: Array<{ name: string }> };
    expect(parsed.name).toBe("Account");
    expect(parsed.fields.map((field) => field.name)).toContain("resolve");
  });

  it("appends validation hints for common GraphQL mistakes", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: [{ message: 'Unknown argument "id" on field "Query.account".' }],
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );

    const { client } = await connectClient();

    const result = await client.callTool({
      name: "omnigraph_query",
      arguments: { query: '{ account(id: "0x1") { address } }' },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as { hints: string[] };
    expect(parsed.hints).toContain(
      "Use account(by: { address: $address }) — not account(id: ...).",
    );
  });

  it("advertises account-profile prompt", async () => {
    const { client } = await connectClient();

    const { prompts } = await client.listPrompts();
    expect(prompts.map((prompt) => prompt.name)).toContain("account-profile");

    const { messages } = await client.getPrompt({
      name: "account-profile",
      arguments: { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
    });
    const firstMessage = messages[0].content;
    if (firstMessage.type !== "text") throw new Error("expected text prompt");
    expect(firstMessage.text).toContain("hello-world");
  });

  it("supports POST initialize followed by GET SSE for the same session", async () => {
    const init = await mcpApi.fetch(
      new Request("http://ensapi.internal/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test-client", version: "0.0.0" },
          },
        }),
      }),
    );

    expect(init.status).toBe(200);
    const sessionId = init.headers.get("mcp-session-id");
    expect(sessionId).toBeTruthy();

    const sse = await mcpApi.fetch(
      new Request("http://ensapi.internal/", {
        method: "GET",
        headers: {
          accept: "text/event-stream",
          "mcp-protocol-version": "2025-03-26",
          "mcp-session-id": sessionId!,
        },
      }),
    );

    expect(sse.status).toBe(200);
    expect(sse.headers.get("content-type")).toContain("text/event-stream");
  });
});

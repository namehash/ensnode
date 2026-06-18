import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Omnigraph API handler so the tool can be exercised without a database. The tool
// imports it dynamically, so the mock is applied at call time.
const omnigraphApiFetchMock = vi.fn<(request: Request) => Promise<Response>>();
vi.mock("@/handlers/api/omnigraph/omnigraph-api", () => ({
  default: { fetch: omnigraphApiFetchMock },
}));

import mcpApi, { createOmnigraphMcpServer } from "./mcp-api";

const activeConnections: Array<{ client: Client; server: McpServer }> = [];
const activeHttpSessionIds: string[] = [];

/** Wires an MCP `Client` directly to a fresh server over an in-memory transport pair. */
async function connectClient() {
  const server = createOmnigraphMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  activeConnections.push({ client, server });
  return { client, server };
}

describe("Omnigraph MCP server", () => {
  beforeEach(() => {
    omnigraphApiFetchMock.mockReset();
  });

  afterEach(async () => {
    for (const { client, server } of activeConnections) {
      await client.close();
      await server.close();
    }
    activeConnections.length = 0;

    for (const sessionId of activeHttpSessionIds) {
      await mcpApi.fetch(
        new Request("http://ensapi.internal/", {
          method: "DELETE",
          headers: { "mcp-session-id": sessionId },
        }),
      );
    }
    activeHttpSessionIds.length = 0;

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
    expect(contents[0].text).toContain("ProfileSocials");
    expect(contents[0].text).toContain("github:");
    expect(contents[0].text).toContain("DomainsNameFilter");
    expect(contents[0].text).toContain("starts_with:");
  });

  it("includes defaultVariables in the examples index", async () => {
    const { client } = await connectClient();

    const { contents } = await client.readResource({ uri: "omnigraph://examples/index" });

    if (!("text" in contents[0])) throw new Error("expected text resource");
    const payload = JSON.parse(contents[0].text) as {
      examples: Array<{ id: string; defaultVariables?: Record<string, unknown> }>;
    };
    const registryDomains = payload.examples.find((example) => example.id === "registry-domains");
    expect(registryDomains?.defaultVariables?.registry).toMatchObject({
      chainId: expect.any(Number),
      address: expect.any(String),
    });
    expect(payload.examples.map((example) => example.id)).toContain("account-profile");
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

  it("executes omnigraph_query via the omnigraph API handler and returns the raw GraphQL JSON", async () => {
    const graphqlResponse = { data: { __typename: "Query" } };
    omnigraphApiFetchMock.mockResolvedValue(
      new Response(JSON.stringify(graphqlResponse), {
        headers: { "content-type": "application/json" },
      }),
    );

    const { client } = await connectClient();

    const result = await client.callTool({
      name: "omnigraph_query",
      arguments: { query: "{ __typename }" },
    });

    expect(omnigraphApiFetchMock).toHaveBeenCalledTimes(1);
    const [request] = omnigraphApiFetchMock.mock.calls[0];
    expect(request.method).toBe("POST");
    expect(new URL(request.url).pathname).toBe("/api/omnigraph");
    await expect(request.clone().json()).resolves.toEqual({
      query: "{ __typename }",
      variables: null,
    });

    const content = result.content as Array<{ type: string; text: string }>;
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe("text");
    expect(JSON.parse(content[0].text)).toEqual(graphqlResponse);
  });

  it("rejects whitespace-only query or exampleId", async () => {
    const { client } = await connectClient();

    for (const arguments_ of [
      { query: "   " },
      { exampleId: "   " },
      { query: "   ", exampleId: "   " },
    ]) {
      const result = await client.callTool({ name: "omnigraph_query", arguments: arguments_ });
      expect(result.isError).toBe(true);
      const content = result.content as Array<{ type: string; text: string }>;
      expect(content[0].text).toMatch(/Provide exactly one of `query` or `exampleId`/);
    }

    expect(omnigraphApiFetchMock).not.toHaveBeenCalled();
  });

  it("executes omnigraph_query by exampleId", async () => {
    omnigraphApiFetchMock.mockResolvedValue(
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

    const [request] = omnigraphApiFetchMock.mock.calls[0];
    const body = (await request.clone().json()) as {
      query: string;
      variables: Record<string, unknown>;
    };
    expect(body.query).toContain("v1DomainsCount");
    expect(body.variables).toEqual({ address: "0x0000000000000000000000000000000000000001" });
  });

  it("forwards GraphQL variables to the omnigraph API handler", async () => {
    omnigraphApiFetchMock.mockResolvedValue(
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

    const [request] = omnigraphApiFetchMock.mock.calls[0];
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
    omnigraphApiFetchMock.mockResolvedValue(
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
    expect(firstMessage.text).toContain("account-profile");
  });

  it("executes omnigraph_query by account-profile exampleId alias", async () => {
    omnigraphApiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { account: null } }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const { client } = await connectClient();

    await client.callTool({
      name: "omnigraph_query",
      arguments: {
        exampleId: "account-profile",
        variables: { address: "0x0000000000000000000000000000000000000001" },
      },
    });

    const [request] = omnigraphApiFetchMock.mock.calls[0];
    const body = (await request.clone().json()) as { query: string };
    expect(body.query).toContain("primaryName(by: { chainName: ETHEREUM })");
    expect(body.query).toContain("v1DomainsCount");
  });

  it("appends validation hints for invalid ProfileSocials fields", async () => {
    omnigraphApiFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: [{ message: 'Cannot query field "discord" on type "ProfileSocials".' }],
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );

    const { client } = await connectClient();

    const result = await client.callTool({
      name: "omnigraph_query",
      arguments: {
        query:
          '{ domain(by: { name: "vitalik.eth" }) { resolve { profile { socials { discord { handle } } } } } }',
      },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as { hints: string[] };
    expect(parsed.hints.some((hint) => hint.includes("ProfileSocials"))).toBe(true);
  });

  it("appends validation hints for camelCase filter fields", async () => {
    omnigraphApiFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: [
            {
              message:
                'Variable "$name" got invalid value { startsWith: "vit" }; Field "startsWith" is not defined by type "DomainsNameFilter".',
            },
          ],
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );

    const { client } = await connectClient();

    const result = await client.callTool({
      name: "omnigraph_query",
      arguments: {
        query:
          "query($name: DomainsNameFilter!) { domains(where: { name: $name }, first: 1) { totalCount } }",
        variables: { name: { startsWith: "vit" } },
      },
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text) as { hints: string[] };
    expect(parsed.hints.some((hint) => hint.includes("starts_with"))).toBe(true);
  });

  it("returns a JSON-RPC parse error for invalid JSON on initialize", async () => {
    const response = await mcpApi.fetch(
      new Request("http://ensapi.internal/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: "{not-json",
      }),
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as {
      jsonrpc: string;
      error: { code: number; message: string };
      id: null;
    };
    expect(payload).toMatchObject({
      jsonrpc: "2.0",
      error: { code: -32_700, message: "Parse error" },
      id: null,
    });
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
    activeHttpSessionIds.push(sessionId!);

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

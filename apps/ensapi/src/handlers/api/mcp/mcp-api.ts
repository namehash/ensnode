import packageJson from "@/../package.json" with { type: "json" };

import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";
import { z } from "zod/v4";

const OmnigraphQueryInputSchema = z.object({
  query: z.string().describe("The GraphQL query document to execute."),
  variables: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Optional GraphQL variables, keyed by variable name."),
});

/** GraphQL-over-HTTP request body; always includes `variables` (`null` when omitted). */
function buildGraphQLRequestBody(query: string, variables?: Record<string, unknown>): string {
  return JSON.stringify({ query, variables: variables ?? null });
}

/**
 * Builds the ENSNode Omnigraph MCP server and registers its tools.
 *
 * Exported so tests can drive the server over an in-memory transport without the HTTP layer.
 */
export function createOmnigraphMcpServer(): McpServer {
  const server = new McpServer({
    name: "ensnode-omnigraph",
    version: packageJson.version,
  });

  server.registerTool(
    "omnigraph_query",
    {
      title: "Run an ENS Omnigraph GraphQL query",
      description:
        "Execute a read-only GraphQL query against this ENSNode instance's ENS Omnigraph API - the " +
        "unified ENSv1 + ENSv2 data model. Returns the raw GraphQL JSON response (`{ data, errors }`). " +
        "Use the `omnigraph` agent skill and the GraphiQL playground at `/api/omnigraph` to discover " +
        "the schema and author queries.",
      inputSchema: OmnigraphQueryInputSchema,
    },
    async ({ query, variables }) => {
      // Defer importing yoga to runtime (matching @/handlers/api/omnigraph/omnigraph-api) so the
      // module's Namechain datasource requirement is only triggered at request time.
      const { yoga } = await import("@/omnigraph-api/yoga");

      // Execute against the in-process Yoga instance rather than looping back over HTTP. This reuses
      // the Pothos schema, per-request context creation, and Yoga's error masking.
      //
      // NOTE: this bypasses the indexing-status middleware on the `/api/omnigraph` HTTP route, so
      // queries run against whatever the index currently holds. `canAccelerate` only affects the
      // Resolution API, so `false` is correct for generic Omnigraph queries.
      const response = await yoga.fetch(
        new Request("http://ensapi.internal/api/omnigraph", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: buildGraphQLRequestBody(query, variables),
        }),
        { canAccelerate: false },
      );

      return {
        content: [{ type: "text", text: await response.text() }],
      };
    },
  );

  return server;
}

/**
 * The single, stateless MCP server + transport for this ENSApi process.
 *
 * Stateless mode (no `sessionIdGenerator`) lets one server and one transport be shared across all
 * requests, which is appropriate for read-only query tools.
 */
const mcpServer = createOmnigraphMcpServer();
const transport = new StreamableHTTPTransport();

/** In-flight `connect()` shared across concurrent cold-start requests. */
let mcpConnectPromise: Promise<void> | undefined;

function ensureMcpConnected(): Promise<void> {
  if (mcpServer.isConnected()) {
    return Promise.resolve();
  }

  mcpConnectPromise ??= mcpServer.connect(transport).catch((error) => {
    mcpConnectPromise = undefined;
    throw error;
  });

  return mcpConnectPromise;
}

const app = new Hono();

app.all("/", async (c) => {
  await ensureMcpConnected();

  // `handleRequest` may return undefined for messages that have no HTTP body (e.g. notifications).
  const response = await transport.handleRequest(c);
  return response ?? c.body(null, 202);
});

export default app;

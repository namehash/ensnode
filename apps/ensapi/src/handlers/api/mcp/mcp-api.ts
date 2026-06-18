import packageJson from "@/../package.json" with { type: "json" };

import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { Hono } from "hono";
import { z } from "zod/v4";

import {
  buildCondensedSchemaReference,
  lookupOmnigraphSchema,
  OmnigraphSchemaLookupInputSchema,
} from "@ensnode/ensnode-sdk/internal";

import { makeLogger } from "@/lib/logger";

import {
  buildOmnigraphExamplesIndex,
  executeOmnigraphQuery,
  listOmnigraphExampleIds,
  OMNIGRAPH_MCP_INSTRUCTIONS,
  resolveOmnigraphExample,
} from "./omnigraph-mcp-support";

const logger = makeLogger("mcp-api");

const OmnigraphQueryInputSchema = z
  .object({
    query: z
      .string()
      .optional()
      .describe("GraphQL query document. Mutually exclusive with `exampleId`."),
    exampleId: z
      .string()
      .optional()
      .describe(
        "Run a vetted example query by id (see omnigraph://examples/index). Mutually exclusive with `query`.",
      ),
    variables: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("GraphQL variables. With `exampleId`, overrides the example defaults."),
  })
  .superRefine((value, ctx) => {
    const hasQuery = value.query !== undefined && value.query.trim().length > 0;
    const hasExample = value.exampleId !== undefined && value.exampleId.trim().length > 0;
    if (hasQuery === hasExample) {
      ctx.addIssue({
        code: "custom",
        message: "Provide exactly one of `query` or `exampleId`.",
      });
    }
  });

/**
 * Builds the ENSNode Omnigraph MCP server and registers its tools.
 *
 * Exported so tests can drive the server over an in-memory transport without the HTTP layer.
 */
export function createOmnigraphMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "ENS",
      version: packageJson.version,
    },
    {
      instructions: OMNIGRAPH_MCP_INSTRUCTIONS,
    },
  );

  server.registerResource(
    "omnigraph-schema-condensed",
    "omnigraph://schema/condensed",
    {
      title: "Omnigraph condensed schema",
      description: "Core Omnigraph entry points and types for query authoring.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        { uri: uri.href, mimeType: "text/markdown", text: buildCondensedSchemaReference() },
      ],
    }),
  );

  server.registerResource(
    "omnigraph-examples-index",
    "omnigraph://examples/index",
    {
      title: "Omnigraph example query index",
      description:
        "Vetted example query ids; read omnigraph://examples/{exampleId} for the payload.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        { uri: uri.href, mimeType: "application/json", text: buildOmnigraphExamplesIndex() },
      ],
    }),
  );

  server.registerResource(
    "omnigraph-example",
    new ResourceTemplate("omnigraph://examples/{exampleId}", {
      list: undefined,
      complete: {
        exampleId: async () => listOmnigraphExampleIds(),
      },
    }),
    {
      title: "Omnigraph example query",
      description: "A vetted GraphQL query and namespace-aware default variables.",
      mimeType: "application/json",
    },
    async (uri, { exampleId }) => {
      const id = String(exampleId);
      const { query, variables } = resolveOmnigraphExample(id);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify({ id, query, variables }, null, 2),
          },
        ],
      };
    },
  );

  server.registerTool(
    "omnigraph_schema",
    {
      title: "Look up ENS Omnigraph schema",
      description:
        "Discover Omnigraph types and fields from the bundled schema (no network). Omit arguments for " +
        "root query fields and type names; pass `type` for a type or Type.field; pass `search` to find matches. " +
        "Use type DomainsNameFilter or SubdomainsWhereInput before writing custom where filters.",
      inputSchema: OmnigraphSchemaLookupInputSchema,
    },
    async ({ type, search }) => {
      const result = lookupOmnigraphSchema({ type, search });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "omnigraph_query",
    {
      title: "Run an ENS Omnigraph GraphQL query",
      description:
        "Execute a read-only GraphQL query against this ENSNode instance's ENS Omnigraph API. Returns " +
        "`{ data, errors }` JSON (with optional `hints` on common validation mistakes). Prefer `exampleId` " +
        "from omnigraph://examples/index; use omnigraph_schema or omnigraph://schema/condensed before writing custom queries.",
      inputSchema: OmnigraphQueryInputSchema,
    },
    async ({ query, exampleId, variables }) => {
      const resolved = exampleId
        ? resolveOmnigraphExample(exampleId, variables)
        : { query: query ?? "", variables };
      return {
        content: [
          { type: "text", text: await executeOmnigraphQuery(resolved.query, resolved.variables) },
        ],
      };
    },
  );

  return server;
}

type McpSession = {
  server: McpServer;
  transport: StreamableHTTPTransport;
  lastActivityAt: number;
};

type McpRequestContext = Parameters<StreamableHTTPTransport["handleRequest"]>[0];

/** Active MCP sessions keyed by `mcp-session-id` (one server + transport pair per client). */
const sessions = new Map<string, McpSession>();

/** Cap stored sessions to limit memory growth from repeated initialize requests. */
const MAX_MCP_SESSIONS = 200;

/** Close sessions with no client activity for this long. */
const MCP_SESSION_IDLE_TTL_MS = 30 * 60 * 1000;

function jsonRpcErrorResponse(
  c: { json: (data: unknown, status: number) => Response },
  code: number,
  message: string,
  status: number,
) {
  return c.json({ jsonrpc: "2.0", error: { code, message }, id: null }, status);
}

function touchSession(session: McpSession) {
  session.lastActivityAt = Date.now();
}

function closeSessionFireAndForget(sessionId: string) {
  void closeSession(sessionId).catch((err) => {
    logger.error({ err, sessionId }, "MCP session cleanup failed");
  });
}

function evictIdleSessions(exceptSessionId?: string) {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (id !== exceptSessionId && now - session.lastActivityAt > MCP_SESSION_IDLE_TTL_MS) {
      closeSessionFireAndForget(id);
    }
  }
}

function storeSession(id: string, session: McpSession) {
  evictIdleSessions(id);
  sessions.set(id, session);
  if (sessions.size <= MAX_MCP_SESSIONS) return;

  // Evict the least-recently-active session (LRU), not the oldest-created.
  let lruId: string | undefined;
  let lruAt = Number.POSITIVE_INFINITY;
  for (const [candidateId, candidate] of sessions) {
    if (candidateId === id) continue;
    if (candidate.lastActivityAt < lruAt) {
      lruAt = candidate.lastActivityAt;
      lruId = candidateId;
    }
  }
  if (lruId) closeSessionFireAndForget(lruId);
}

function getSessionId(ctx: {
  req: { header: (name: string) => string | undefined };
}): string | undefined {
  const sessionId = ctx.req.header("mcp-session-id");
  return sessionId && sessionId.length > 0 ? sessionId : undefined;
}

function invalidSessionResponse(c: { json: (data: unknown, status: number) => Response }) {
  return jsonRpcErrorResponse(c, -32_000, "Invalid or missing session ID", 400);
}

async function closeSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) return;

  sessions.delete(sessionId);
  await session.transport.close();
  await session.server.close();
}

const app = new Hono<any>();

app.all("/", async (c) => {
  const sessionId = getSessionId(c);
  const mcpContext = c as unknown as McpRequestContext;

  if (c.req.method === "GET") {
    const session = sessionId ? sessions.get(sessionId) : undefined;
    if (!session) return invalidSessionResponse(c);
    touchSession(session);
    evictIdleSessions(sessionId);
    const response = await session.transport.handleRequest(mcpContext);
    return response ?? c.body(null, 202);
  }

  if (c.req.method === "DELETE") {
    if (!sessionId) return invalidSessionResponse(c);
    const session = sessions.get(sessionId);
    if (!session) return invalidSessionResponse(c);

    const response = await session.transport.handleRequest(mcpContext);
    await closeSession(sessionId);
    return response ?? c.body(null, 202);
  }

  if (c.req.method === "POST") {
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (!session) {
        return jsonRpcErrorResponse(c, -32_000, "Session not found", 404);
      }
      touchSession(session);
      evictIdleSessions(sessionId);
      const response = await session.transport.handleRequest(mcpContext);
      return response ?? c.body(null, 202);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return jsonRpcErrorResponse(c, -32_700, "Parse error", 400);
    }
    if (!isInitializeRequest(body)) {
      return jsonRpcErrorResponse(c, -32_000, "Bad Request: No valid session ID provided", 400);
    }

    const server = createOmnigraphMcpServer();
    let initializedSessionId: string | undefined;
    const session: McpSession = {
      server,
      lastActivityAt: Date.now(),
      transport: new StreamableHTTPTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
          initializedSessionId = id;
          storeSession(id, session);
        },
        onsessionclosed: (id) => {
          closeSessionFireAndForget(id);
        },
      }),
    };

    try {
      await server.connect(session.transport);
      const response = await session.transport.handleRequest(mcpContext, body);
      return response ?? c.body(null, 202);
    } catch {
      if (initializedSessionId) {
        await closeSession(initializedSessionId);
      } else {
        await session.transport.close();
        await session.server.close();
      }
      return jsonRpcErrorResponse(c, -32_603, "Internal error", 500);
    }
  }

  return jsonRpcErrorResponse(c, -32_000, "Method not allowed.", 405);
});

export default app;

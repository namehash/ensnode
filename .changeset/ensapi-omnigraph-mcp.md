---
"ensapi": minor
---

Add a first-party **Model Context Protocol (MCP)** server for the ENS Omnigraph API, mounted on every ENSApi instance at **`/api/mcp`** via the streamable-HTTP transport (`@hono/mcp` + `@modelcontextprotocol/sdk`). It exposes a single read-only **`omnigraph_query`** tool that runs an arbitrary GraphQL `query` (with optional `variables`) against the in-process Omnigraph Yoga instance and returns the raw `{ data, errors }` payload — the same endpoint serves local development and hosted instances, so MCP clients (Cursor, Claude Desktop, agents) need no install beyond pointing at the URL.

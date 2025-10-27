---
"ensindexer": major
"ensapi": major
---

Introduces the ENSApi application, a separate, horizontally scalable ENSNode API server to replace the legacy `ponder serve` experience.

Connecting ENSApi to:
- your Postgres Database (`DATABASE_URL`, `DATABASE_SCHEMA`),
- ENSIndexer (`ENSINDEXER_URL`), and
- an ENS Root Chain RPC (`ALCHEMY_API_KEY`, `RPC_URL_*`)

provides the following APIs:
- ENSIndexer Config API (`/api/config`)
- ENSIndexer Indexing Status API (`/api/indexing-status`)
- Legacy ENS Subgraph GraphQL API (`/subgraph`)
- ENSNode's Protocol-Accelerated Resolution API (`/api/resolve/*`)
  - (note: only accelerated if the `protocol-acceleration` plugin is enabled on the connected ENSIndexer)

This results in a breaking change — `ponder serve` is no longer explicitly supported, and future deployments of ENSNode require the use of ENSApi to serve APIs previously available via Ponder's built-in API server.

# ensapi

## 1.0.0

### Major Changes

- [#1194](https://github.com/namehash/ensnode/pull/1194) [`af52f0b`](https://github.com/namehash/ensnode/commit/af52f0befda8220d56ff26a30208c196acb0d3cb) Thanks [@shrugs](https://github.com/shrugs)! - Introduces the ENSApi application, a separate, horizontally scalable ENSNode API server to replace the legacy `ponder serve` experience.

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

### Patch Changes

- Updated dependencies [[`bbf0d3b`](https://github.com/namehash/ensnode/commit/bbf0d3b6e328f5c18017bd7660b1ff93e7214ce2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5)]:
  - @ensnode/ensnode-sdk@1.0.0
  - @ensnode/datasources@1.0.0
  - @ensnode/ensnode-schema@1.0.0
  - @ensnode/ponder-subgraph@1.0.0

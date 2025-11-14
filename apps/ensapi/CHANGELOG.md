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

### Minor Changes

- [#1238](https://github.com/namehash/ensnode/pull/1238) [`ff2a9b9`](https://github.com/namehash/ensnode/commit/ff2a9b9a3c53d6abb85134b94661088ebbe9e088) Thanks [@shrugs](https://github.com/shrugs)! - Introduces THEGRAPH_API_KEY environment variable: if this value is set, on the condition that
  the connected ENSIndexer is not sufficiently "realtime", ENSApi's Subgraph API will fallback
  to proxying subgraph queries it receives to The Graph's hosted subgraphs using this API key.

- [#1265](https://github.com/namehash/ensnode/pull/1265) [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2) Thanks [@tk-o](https://github.com/tk-o)! - Implement a HTTP endpoint for the Registrar Actions API.

### Patch Changes

- Updated dependencies [[`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`bbf0d3b`](https://github.com/namehash/ensnode/commit/bbf0d3b6e328f5c18017bd7660b1ff93e7214ce2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5), [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5), [`617ab00`](https://github.com/namehash/ensnode/commit/617ab00cc57c2dc9df5af90eeaf3896f8864145d), [`63376ad`](https://github.com/namehash/ensnode/commit/63376ad8a4f1fe72b7ad5a9368496d235411bc28), [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`40658a7`](https://github.com/namehash/ensnode/commit/40658a70d591d972150f69cb18fbd3dd390b4114)]:
  - @ensnode/ensnode-sdk@1.0.0
  - @ensnode/ensnode-schema@1.0.0
  - @ensnode/datasources@1.0.0
  - @ensnode/ponder-subgraph@1.0.0

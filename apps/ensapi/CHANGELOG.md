# ensapi

## 1.3.1

### Patch Changes

- [#1400](https://github.com/namehash/ensnode/pull/1400) [`6388ee7`](https://github.com/namehash/ensnode/commit/6388ee772940a6190ab95d6dc4a78d355614ca0a) Thanks [@tk-o](https://github.com/tk-o)! - Optimizes pagination helper used with Registrar Actions API.

- [#1396](https://github.com/namehash/ensnode/pull/1396) [`5d3237d`](https://github.com/namehash/ensnode/commit/5d3237d89f075be7a42d5fddb07b71837993e07a) Thanks [@tk-o](https://github.com/tk-o)! - Fixes SWR Cache management by cleaning up resources on application shutdown.

- Updated dependencies [[`5d3237d`](https://github.com/namehash/ensnode/commit/5d3237d89f075be7a42d5fddb07b71837993e07a)]:
  - @ensnode/ensnode-sdk@1.3.1
  - @ensnode/datasources@1.3.1
  - @ensnode/ensnode-schema@1.3.1
  - @ensnode/ponder-subgraph@1.3.1
  - @namehash/ens-referrals@1.3.0

## 1.3.0

### Minor Changes

- [#1358](https://github.com/namehash/ensnode/pull/1358) [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173) Thanks [@tk-o](https://github.com/tk-o)! - Introduces Name Tokens API.

- [#1379](https://github.com/namehash/ensnode/pull/1379) [`4bc9e82`](https://github.com/namehash/ensnode/commit/4bc9e82c288157fe29d00157160ae01517255728) Thanks [@Goader](https://github.com/Goader)! - Extended the `registrar-actions` endpoint to support filtering by `decodedReferrer` and pagination.

- [#1382](https://github.com/namehash/ensnode/pull/1382) [`9558b9f`](https://github.com/namehash/ensnode/commit/9558b9f6dd4aa65c81be067b82003bb9404f7137) Thanks [@Goader](https://github.com/Goader)! - Renamed `itemsPerPage` to `recordsPerPage` and `paginationContext` to `pageContext` in referrer leaderboard APIs to align with registrar actions terminology.

### Patch Changes

- Updated dependencies [[`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173), [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173), [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173), [`4bc9e82`](https://github.com/namehash/ensnode/commit/4bc9e82c288157fe29d00157160ae01517255728), [`9558b9f`](https://github.com/namehash/ensnode/commit/9558b9f6dd4aa65c81be067b82003bb9404f7137), [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173), [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173)]:
  - @ensnode/ensnode-sdk@1.3.0
  - @namehash/ens-referrals@1.3.0
  - @ensnode/datasources@1.3.0
  - @ensnode/ensnode-schema@1.3.0
  - @ensnode/ponder-subgraph@1.3.0

## 1.2.0

### Minor Changes

- [#1345](https://github.com/namehash/ensnode/pull/1345) [`4cee4ba`](https://github.com/namehash/ensnode/commit/4cee4ba538e5655ca1e8b75f4d72738f3413c9d3) Thanks [@tk-o](https://github.com/tk-o)! - Enable auto-generated QuickNode RPC provider support with `QUICKNODE_API_KEY` and `QUICKNODE_ENDPOINT_NAME` environment variables.

- [#1318](https://github.com/namehash/ensnode/pull/1318) [`e35600f`](https://github.com/namehash/ensnode/commit/e35600fe9808f3c72960429b2a56a7f22893bff6) Thanks [@Goader](https://github.com/Goader)! - Add referrer detail endpoint API. Supports querying individual referrers whether they are ranked on the leaderboard or not.

### Patch Changes

- Updated dependencies [[`97e4545`](https://github.com/namehash/ensnode/commit/97e4545c70d8c7469f4bd566b91277fdb0c3a699), [`ea06a3c`](https://github.com/namehash/ensnode/commit/ea06a3cf7d802c6dd338676d0f2439185934e0ab), [`976e284`](https://github.com/namehash/ensnode/commit/976e2842f2e25ff0844471de48a34659b136b5be), [`e35600f`](https://github.com/namehash/ensnode/commit/e35600fe9808f3c72960429b2a56a7f22893bff6), [`4cee4ba`](https://github.com/namehash/ensnode/commit/4cee4ba538e5655ca1e8b75f4d72738f3413c9d3)]:
  - @ensnode/ensnode-sdk@1.2.0
  - @namehash/ens-referrals@1.2.0
  - @ensnode/datasources@1.2.0
  - @ensnode/ensnode-schema@1.2.0
  - @ensnode/ponder-subgraph@1.2.0

## 1.1.0

### Minor Changes

- [#1307](https://github.com/namehash/ensnode/pull/1307) [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582) Thanks [@tk-o](https://github.com/tk-o)! - Updates `ReferrerLeaderboard` data model and related logic to match updated ENS Holiday Awards rules.

- [#1307](https://github.com/namehash/ensnode/pull/1307) [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582) Thanks [@tk-o](https://github.com/tk-o)! - Renamed /ensanalytics/aggregated-referrers to /ensanalytics/referrers

- [#1307](https://github.com/namehash/ensnode/pull/1307) [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582) Thanks [@tk-o](https://github.com/tk-o)! - Refined schema for /ensanalytics/referrers response

### Patch Changes

- Updated dependencies [[`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582), [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582), [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582)]:
  - @ensnode/ensnode-sdk@1.1.0
  - @namehash/ens-referrals@1.1.0
  - @ensnode/datasources@1.1.0
  - @ensnode/ensnode-schema@1.1.0
  - @ensnode/ponder-subgraph@1.1.0

## 1.0.3

### Patch Changes

- Updated dependencies [[`4faad0b`](https://github.com/namehash/ensnode/commit/4faad0b534c5bbdfdeca4227565fe24ff29c3dd4)]:
  - @namehash/ens-referrals@1.0.1
  - @ensnode/ensnode-sdk@1.0.3
  - @ensnode/datasources@1.0.3
  - @ensnode/ensnode-schema@1.0.3
  - @ensnode/ponder-subgraph@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [[`f6aeb17`](https://github.com/namehash/ensnode/commit/f6aeb17330da0f73ee337a2f94a02cabbab6613e)]:
  - @ensnode/ensnode-sdk@1.0.2
  - @ensnode/datasources@1.0.2
  - @ensnode/ensnode-schema@1.0.2
  - @ensnode/ponder-subgraph@1.0.2
  - @namehash/ens-referrals@1.0.0

## 1.0.1

### Patch Changes

- Updated dependencies []:
  - @ensnode/datasources@1.0.1
  - @ensnode/ensnode-schema@1.0.1
  - @ensnode/ponder-subgraph@1.0.1
  - @ensnode/ensnode-sdk@1.0.1
  - @namehash/ens-referrals@1.0.0

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

- [#1239](https://github.com/namehash/ensnode/pull/1239) [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893) Thanks [@Goader](https://github.com/Goader)! - Introduces ENS Analytics API for tracking and analyzing referral metrics. Adds `/ensanalytics/aggregated-referrers` endpoint with pagination support to retrieve aggregated referrer metrics and contribution percentages.

- [#1238](https://github.com/namehash/ensnode/pull/1238) [`ff2a9b9`](https://github.com/namehash/ensnode/commit/ff2a9b9a3c53d6abb85134b94661088ebbe9e088) Thanks [@shrugs](https://github.com/shrugs)! - Introduces THEGRAPH_API_KEY environment variable: if this value is set, on the condition that
  the connected ENSIndexer is not sufficiently "realtime", ENSApi's Subgraph API will fallback
  to proxying subgraph queries it receives to The Graph's hosted subgraphs using this API key.

- [#1279](https://github.com/namehash/ensnode/pull/1279) [`11b8372`](https://github.com/namehash/ensnode/commit/11b8372ccb2456f2e71d9195f6e50b2fbbeb405a) Thanks [@Goader](https://github.com/Goader)! - Add configurable ENS Holiday Awards date range environment variables (`ENS_HOLIDAY_AWARDS_START` and `ENS_HOLIDAY_AWARDS_END`) to ENSApi. If not set, defaults to hardcoded values from `@namehash/ens-referrals` package. Includes validation to ensure end date is after or equal to start date. Dates must be specified in ISO 8601 format (e.g., '2025-12-01T00:00:00Z').

- [#1301](https://github.com/namehash/ensnode/pull/1301) [`7baefbd`](https://github.com/namehash/ensnode/commit/7baefbda39fca03d1cc77ece974136d7330919a8) Thanks [@tk-o](https://github.com/tk-o)! - Indexing Status cache only stores responses with `responseCode: IndexingStatusResponseCodes.Ok`.

- [#1302](https://github.com/namehash/ensnode/pull/1302) [`6659c57`](https://github.com/namehash/ensnode/commit/6659c57e487938761d642a5f46ff0e86baeac286) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `withReferral` filter for Registrar Actions API.

- [#1265](https://github.com/namehash/ensnode/pull/1265) [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2) Thanks [@tk-o](https://github.com/tk-o)! - Implement a HTTP endpoint for the Registrar Actions API.

### Patch Changes

- Updated dependencies [[`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`bbf0d3b`](https://github.com/namehash/ensnode/commit/bbf0d3b6e328f5c18017bd7660b1ff93e7214ce2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5), [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`11b8372`](https://github.com/namehash/ensnode/commit/11b8372ccb2456f2e71d9195f6e50b2fbbeb405a), [`617ab00`](https://github.com/namehash/ensnode/commit/617ab00cc57c2dc9df5af90eeaf3896f8864145d), [`63376ad`](https://github.com/namehash/ensnode/commit/63376ad8a4f1fe72b7ad5a9368496d235411bc28), [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`6659c57`](https://github.com/namehash/ensnode/commit/6659c57e487938761d642a5f46ff0e86baeac286), [`40658a7`](https://github.com/namehash/ensnode/commit/40658a70d591d972150f69cb18fbd3dd390b4114), [`6be7a18`](https://github.com/namehash/ensnode/commit/6be7a189d0f9ac21d89c01941eb6b5a3cd13f88f)]:
  - @ensnode/ensnode-sdk@1.0.0
  - @ensnode/ensnode-schema@1.0.0
  - @ensnode/datasources@1.0.0
  - @ensnode/ponder-subgraph@1.0.0
  - @namehash/ens-referrals@1.0.0

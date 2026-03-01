# ensapi

## 1.6.0

### Minor Changes

- [#1621](https://github.com/namehash/ensnode/pull/1621) [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c) Thanks [@Goader](https://github.com/Goader)! - Added `status` field to referral program API responses (`ReferrerLeaderboardPage`, `ReferrerEditionMetricsRanked`, `ReferrerEditionMetricsUnranked`) indicating whether a program is "Scheduled", "Active", or "Closed" based on the program's timing relative to `accurateAsOf`.

- [#1603](https://github.com/namehash/ensnode/pull/1603) [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91) Thanks [@Goader](https://github.com/Goader)! - Introduces referral program editions support with pre-configured edition definitions (ENS Holiday Awards December 2025, March 2026 edition). Updated ENSAnalytics API v1 to support edition-based leaderboard queries and added edition configuration to environment schema.

- [#1654](https://github.com/namehash/ensnode/pull/1654) [`40b95fb`](https://github.com/namehash/ensnode/commit/40b95fb2cb5209546c0bd38145dbf7c231a968e7) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 GraphQL API: BREAKING: Removes Account.domains in favor of `Query.domains` with `owner` specified.

- [#1576](https://github.com/namehash/ensnode/pull/1576) [`6e98fb6`](https://github.com/namehash/ensnode/commit/6e98fb677d5021c4bc9d17b01289290d1c286003) Thanks [@shrugs](https://github.com/shrugs)! - The experimental ENSv2 API now supports the following Domain filters, namely matching indexed Domains by name prefix.

  - `Query.domains(where: { name?: "example.et", owner?: "0xdead...beef" })`

- [#1670](https://github.com/namehash/ensnode/pull/1670) [`3ce245e`](https://github.com/namehash/ensnode/commit/3ce245e12c0f87e8439b7018921eed54574afa8c) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 GraphQL API: BREAKING — `Domain.label` is now a `Label` rather than a `String`, providing `Label.hash` and `Label.interpreted` (the previous value of `Domain.label`).

- [#1670](https://github.com/namehash/ensnode/pull/1670) [`3ce245e`](https://github.com/namehash/ensnode/commit/3ce245e12c0f87e8439b7018921eed54574afa8c) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2GraphQL API: Introduce `Domain.subdomainCount`.

- [#1659](https://github.com/namehash/ensnode/pull/1659) [`43b50cf`](https://github.com/namehash/ensnode/commit/43b50cf399e80ce0bae198eb520dbbb5318c336f) Thanks [@shrugs](https://github.com/shrugs)! - The `ens-test-env` namespace now functions against devnet commit `762de44`, which includes the major refactor of ENSv2 onto the ENS Root Chain, away from Namechain.

- [#1621](https://github.com/namehash/ensnode/pull/1621) [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c) Thanks [@Goader](https://github.com/Goader)! - Referral program edition leaderboard caches now check for immutability within the cache builder function. Closed editions past the safety window return cached data without re-fetching.

- [#1655](https://github.com/namehash/ensnode/pull/1655) [`41077b3`](https://github.com/namehash/ensnode/commit/41077b3fc105b349fa42aaef5312d5195ac43472) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 API: Breaking change, Registration.start is replaced by Registration.event.timestamp.

- [#1658](https://github.com/namehash/ensnode/pull/1658) [`08e893e`](https://github.com/namehash/ensnode/commit/08e893e137307f76303a6ff04707cbcc56ee4c26) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 GraphQL API: Introduces `Domain.subdomains` for traversal of the unified ENSv1/ENSv2 namegraph without needing to select a type-specific fragment.

- [#1554](https://github.com/namehash/ensnode/pull/1554) [`365c996`](https://github.com/namehash/ensnode/commit/365c9967e07680659746af352b8ba623839c7d6e) Thanks [@Goader](https://github.com/Goader)! - Implemented API versioning for ENSAnalytics referral endpoints. Introduced explicit `/ensanalytics/v1/*` routes while preserving existing `/ensanalytics/*` routes as implicit v0.

- [#1595](https://github.com/namehash/ensnode/pull/1595) [`229eaeb`](https://github.com/namehash/ensnode/commit/229eaeb37bd446bef05c28c1603503c3fd318c47) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 GraphQL API: Introduces order criteria for Domain methods, i.e. `Query.domains(order: { by: NAME, dir: ASC })`. The supported Order criteria are `NAME`, `REGISTRATION_TIMESTAMP`, and `REGISTRATION_EXPIRY` in either `ASC` or `DESC` orders, defaulting to `NAME` and `ASC`.

- [#1654](https://github.com/namehash/ensnode/pull/1654) [`40b95fb`](https://github.com/namehash/ensnode/commit/40b95fb2cb5209546c0bd38145dbf7c231a968e7) Thanks [@shrugs](https://github.com/shrugs)! - Adds a `canonical?: boolean` filter to the where filter in `Query.domains`. When specified, the resulting set of Domains is composed exclusively of Canonical Domains.

### Patch Changes

- [#1680](https://github.com/namehash/ensnode/pull/1680) [`a5f9178`](https://github.com/namehash/ensnode/commit/a5f9178bdd1d4e42440e4ad24daf5df6036f7737) Thanks [@shrugs](https://github.com/shrugs)! - add `Account.domains` and enhance `Domain.subdomains` and `Registry.domains` with filtering and ordering

  **`Account.domains`** (new) — paginated connection of domains owned by this account.

  - `where: { name?: String, canonical?: Boolean }` — optional partial Interpreted Name filter and canonical filter (defaults to false)
  - `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

  **`Domain.subdomains`** (enhanced) — paginated connection of subdomains of this domain, now with filtering and ordering.

  - `where: { name?: String }` — optional partial Interpreted Name filter
  - `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

  **`Registry.domains`** (enhanced) — paginated connection of domains in this registry, now with filtering and ordering.

  - `where: { name?: String }` — optional partial Interpreted Name filter
  - `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

  **`Query.domains`** (updated) — `where.name` is now required. Added optional `where.canonical` filter (defaults to false).

  - `where: { name: String!, canonical?: Boolean }` — required partial Interpreted Name, optional canonical filter
  - `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

- [#1542](https://github.com/namehash/ensnode/pull/1542) [`500388b`](https://github.com/namehash/ensnode/commit/500388b217ea420b79b85670891b99ade07f07f0) Thanks [@Goader](https://github.com/Goader)! - Flipped dependency relationship between `ensnode-sdk` and `ens-referrals`. Introduced new `ENSReferralsClient` for referral leaderboard APIs. Consolidated duplicate types (`ChainId`, `AccountId`, `UnixTimestamp`, `Duration`) by importing from `ensnode-sdk`.

- [#1562](https://github.com/namehash/ensnode/pull/1562) [`84a4c5e`](https://github.com/namehash/ensnode/commit/84a4c5e70df1e33ceed495888fc9b4436c577fc8) Thanks [@Goader](https://github.com/Goader)! - Migrated v1 referrer leaderboard API to use mature `PriceEth` and `PriceUsdc` types from `ensnode-sdk`, replacing temporary `RevenueContribution` and `USDQuantity` types. Added `/v1` subpath export to `ens-referrals`.

- Updated dependencies [[`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c), [`220b71f`](https://github.com/namehash/ensnode/commit/220b71f1dfcf7d7d7ef6e5a2841dced2501ad3d7), [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c), [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`91d7653`](https://github.com/namehash/ensnode/commit/91d7653b0447e0e767e41b275515fb8423af3c0a), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2), [`6f4d39b`](https://github.com/namehash/ensnode/commit/6f4d39b026f42ecfeb0f9e21b4473f515dc31a23), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`4cf6f41`](https://github.com/namehash/ensnode/commit/4cf6f412a9fa9aa6c438b83acf090adb8365f497), [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91), [`1bc599f`](https://github.com/namehash/ensnode/commit/1bc599f99804d1cf08dd0d23d5518b1b8e7928c5), [`500388b`](https://github.com/namehash/ensnode/commit/500388b217ea420b79b85670891b99ade07f07f0), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`a87b437`](https://github.com/namehash/ensnode/commit/a87b4370ff8b4da6a254dda39afac19e3a7f6e94), [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2), [`70b15a1`](https://github.com/namehash/ensnode/commit/70b15a18800921d3a28e1dcfe512a79287537d87), [`43d3e9c`](https://github.com/namehash/ensnode/commit/43d3e9cdc6456c8b32940a8860b92c523157ffea), [`84a4c5e`](https://github.com/namehash/ensnode/commit/84a4c5e70df1e33ceed495888fc9b4436c577fc8)]:
  - @namehash/ens-referrals@1.6.0
  - @ensnode/ensnode-sdk@1.6.0
  - @ensnode/ensnode-schema@1.6.0
  - @ensnode/datasources@1.6.0
  - @ensnode/ponder-subgraph@1.6.0

## 1.5.1

### Patch Changes

- [#1529](https://github.com/namehash/ensnode/pull/1529) [`b25605b`](https://github.com/namehash/ensnode/commit/b25605b49c09d57dae44ff53092303eb7330df85) Thanks [@notrab](https://github.com/notrab)! - Add production and testnet servers to OpenAPI spec

  The OpenAPI specification now includes the following servers:

  - https://api.alpha.ensnode.io (ENSNode Alpha - Mainnet)
  - https://api.alpha-sepolia.ensnode.io (ENSNode Alpha - Sepolia Testnet)
  - localhost (Local Development)

- [#1537](https://github.com/namehash/ensnode/pull/1537) [`63617fa`](https://github.com/namehash/ensnode/commit/63617fa827daa4bd7761f482812daf7b507da3d2) Thanks [@tk-o](https://github.com/tk-o)! - Updates Node.js runtime to the current LTS version (v24).

- Updated dependencies []:
  - @ensnode/datasources@1.5.1
  - @ensnode/ensnode-schema@1.5.1
  - @ensnode/ponder-subgraph@1.5.1
  - @ensnode/ensnode-sdk@1.5.1
  - @namehash/ens-referrals@1.5.1

## 1.5.0

### Patch Changes

- Updated dependencies [[`dc7e07f`](https://github.com/namehash/ensnode/commit/dc7e07f6e69e30d597a871b79bd2c6876de9f8cc)]:
  - @ensnode/ensnode-schema@1.5.0
  - @ensnode/datasources@1.5.0
  - @ensnode/ponder-subgraph@1.5.0
  - @ensnode/ensnode-sdk@1.5.0
  - @namehash/ens-referrals@1.5.0

## 1.4.0

### Minor Changes

- [#1412](https://github.com/namehash/ensnode/pull/1412) [`fae127e`](https://github.com/namehash/ensnode/commit/fae127ed94a62a212d406daed9e86a0c51eb4f37) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `GET /amirealtime` endpoint allowing for easy realtime indexing distance verification.

- [#1442](https://github.com/namehash/ensnode/pull/1442) [`05d7481`](https://github.com/namehash/ensnode/commit/05d7481d6fd3e1842262c72b930bbdbddd866715) Thanks [@shrugs](https://github.com/shrugs)! - Fixed issue regarding Protocol Accelerated Resolution API requests and legacy unmigrated names, which should now resolve correctly when accelerated.

- [#1280](https://github.com/namehash/ensnode/pull/1280) [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec) Thanks [@shrugs](https://github.com/shrugs)! - Introduces the ENSv2 Plugin ('ensv2') for indexing both ENSv1 and the future ENSv2 protocol.

- [#1411](https://github.com/namehash/ensnode/pull/1411) [`ec96ff9`](https://github.com/namehash/ensnode/commit/ec96ff912c010d4623e586dc2b60a22f122a128d) Thanks [@shrugs](https://github.com/shrugs)! - Disabled viem's built-in Transport Ranking feature in order to minimize net_listening RPC credit ussage.

- [#1444](https://github.com/namehash/ensnode/pull/1444) [`fcd96db`](https://github.com/namehash/ensnode/commit/fcd96db1aae297a445597e3867de811bc42ca31d) Thanks [@Goader](https://github.com/Goader)! - Added optional time range filtering to the Registrar Actions API.

- [#1484](https://github.com/namehash/ensnode/pull/1484) [`cf1b218`](https://github.com/namehash/ensnode/commit/cf1b218c27cb2253f37ef6b452c908d5c387aa0a) Thanks [@Goader](https://github.com/Goader)! - Added `accurateAsOf` response field to the Registrar Actions API.

- [#1418](https://github.com/namehash/ensnode/pull/1418) [`4e0579b`](https://github.com/namehash/ensnode/commit/4e0579b85c3b118450e7907242b60ca46bebebda) Thanks [@Goader](https://github.com/Goader)! - Added revenue contribution tracking to referrer metrics, calculating total revenue contributed to the ENS DAO from referrals. Added `totalRevenueContribution` to individual referrer metrics and `grandTotalRevenueContribution` to aggregated metrics.

### Patch Changes

- [#1485](https://github.com/namehash/ensnode/pull/1485) [`4f3abbe`](https://github.com/namehash/ensnode/commit/4f3abbe6c1447b7d5c5e7f2a39cf250067122877) Thanks [@notrab](https://github.com/notrab)! - Fix openapi validation errors by adding missing route descriptions

  - Add `describeRoute` with tags, summary, description, and responses to `/amirealtime`, `/ensanalytics/referrers`, `/ensanalytics/referrers/:referrer`, `/registrar-actions`, and `/registrar-actions/:parentNode` endpoints
  - Add `.describe()` to Zod schema fields for query and path parameters to improve OpenAPI documentation
  - Add OpenAPI tags (`Resolution`, `Meta`, `Explore`, `ENSAwards`) to organize endpoints in the spec
  - Split optional parent node path param in registrar-actions-api into dedicated handlers to fix OpenAPI validation

- [#1338](https://github.com/namehash/ensnode/pull/1338) [`bb1686a`](https://github.com/namehash/ensnode/commit/bb1686a34ce1bd36a44598f8de0a24c40a439bc3) Thanks [@stevedylandev](https://github.com/stevedylandev)! - Adds OpenAPI schema endpoint and route descriptions to ENSApi

- Updated dependencies [[`706f86b`](https://github.com/namehash/ensnode/commit/706f86b47caf5693153cd2fb7e009b331795d990), [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec), [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec), [`fcd96db`](https://github.com/namehash/ensnode/commit/fcd96db1aae297a445597e3867de811bc42ca31d), [`9862514`](https://github.com/namehash/ensnode/commit/9862514d320b2ed50e06410b57b28e3e30077ade), [`cf1b218`](https://github.com/namehash/ensnode/commit/cf1b218c27cb2253f37ef6b452c908d5c387aa0a), [`4e0579b`](https://github.com/namehash/ensnode/commit/4e0579b85c3b118450e7907242b60ca46bebebda), [`bb1686a`](https://github.com/namehash/ensnode/commit/bb1686a34ce1bd36a44598f8de0a24c40a439bc3)]:
  - @ensnode/ensnode-sdk@1.4.0
  - @ensnode/ensnode-schema@1.4.0
  - @ensnode/datasources@1.4.0
  - @namehash/ens-referrals@1.4.0
  - @ensnode/ponder-subgraph@1.4.0

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

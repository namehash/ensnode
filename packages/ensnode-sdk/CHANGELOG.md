# @ensnode/ensnode-sdk

## 1.6.0

### Minor Changes

- [#1621](https://github.com/namehash/ensnode/pull/1621) [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c) Thanks [@Goader](https://github.com/Goader)! - SWRCache `fn` now optionally receives the currently cached result as a parameter, allowing implementations to inspect cached data before deciding whether to return it or fetch fresh data. Fully backward compatible.

- [#1675](https://github.com/namehash/ensnode/pull/1675) [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c) Thanks [@tk-o](https://github.com/tk-o)! - Includes `mergeBlockNumberRanges` helper function to enable indexed blockrange aggregation, for example, across multiple contract definitions.

- [#1660](https://github.com/namehash/ensnode/pull/1660) [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842) Thanks [@tk-o](https://github.com/tk-o)! - Introduces ENSDb module which includes data model definitions.

- [#1690](https://github.com/namehash/ensnode/pull/1690) [`91d7653`](https://github.com/namehash/ensnode/commit/91d7653b0447e0e767e41b275515fb8423af3c0a) Thanks [@tk-o](https://github.com/tk-o)! - Renames `ChainIndexingConfig*` types to match `BlockRefRange*` pattern to support further data model improvements.

- [#1660](https://github.com/namehash/ensnode/pull/1660) [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842) Thanks [@tk-o](https://github.com/tk-o)! - Extends ENSIndexer module with functionality allowing compatibility check between two instances of ENSIndexer public config.

- [#1675](https://github.com/namehash/ensnode/pull/1675) [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c) Thanks [@tk-o](https://github.com/tk-o)! - Includes `buildOmnichainIndexingStatusSnapshot` function for simple builder returning `OmnichainIndexingStatusSnapshot` object.

- [#1699](https://github.com/namehash/ensnode/pull/1699) [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2) Thanks [@tk-o](https://github.com/tk-o)! - Replaced `Blockrange` data model with more versatile ones: `BlockNumberRange` and `BlockRefRange`.

- [#1675](https://github.com/namehash/ensnode/pull/1675) [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c) Thanks [@tk-o](https://github.com/tk-o)! - Introduced `buildIndexedBlockranges` function that builds a map of indexed blockranges configured for each indexed chain.

- [#1643](https://github.com/namehash/ensnode/pull/1643) [`4cf6f41`](https://github.com/namehash/ensnode/commit/4cf6f412a9fa9aa6c438b83acf090adb8365f497) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `EnsIndexerClient` class, supporting easy interactions with ENSIndexer APIs.

- [#1617](https://github.com/namehash/ensnode/pull/1617) [`1bc599f`](https://github.com/namehash/ensnode/commit/1bc599f99804d1cf08dd0d23d5518b1b8e7928c5) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `validateChainIndexingStatusSnapshot` which enables validating values against business-layer requirements.

- [#1542](https://github.com/namehash/ensnode/pull/1542) [`500388b`](https://github.com/namehash/ensnode/commit/500388b217ea420b79b85670891b99ade07f07f0) Thanks [@Goader](https://github.com/Goader)! - Flipped dependency relationship between `ensnode-sdk` and `ens-referrals`. Introduced new `ENSReferralsClient` for referral leaderboard APIs. Consolidated duplicate types (`ChainId`, `AccountId`, `UnixTimestamp`, `Duration`) by importing from `ensnode-sdk`.

- [#1699](https://github.com/namehash/ensnode/pull/1699) [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2) Thanks [@tk-o](https://github.com/tk-o)! - Replaced `createIndexingConfig` function with `buildBlockRefRange` that utilises updated `BlockRefRange` data model.

- [#1697](https://github.com/namehash/ensnode/pull/1697) [`70b15a1`](https://github.com/namehash/ensnode/commit/70b15a18800921d3a28e1dcfe512a79287537d87) Thanks [@tk-o](https://github.com/tk-o)! - Introduced streamlined datamodel for block ranges.

- [#1629](https://github.com/namehash/ensnode/pull/1629) [`43d3e9c`](https://github.com/namehash/ensnode/commit/43d3e9cdc6456c8b32940a8860b92c523157ffea) Thanks [@tk-o](https://github.com/tk-o)! - Introduced `validate*` functions for Indexing Status data model. These functions enable new use cases on consumer side.

- [#1562](https://github.com/namehash/ensnode/pull/1562) [`84a4c5e`](https://github.com/namehash/ensnode/commit/84a4c5e70df1e33ceed495888fc9b4436c577fc8) Thanks [@Goader](https://github.com/Goader)! - Migrated v1 referrer leaderboard API to use mature `PriceEth` and `PriceUsdc` types from `ensnode-sdk`, replacing temporary `RevenueContribution` and `USDQuantity` types. Added `/v1` subpath export to `ens-referrals`.

### Patch Changes

- [#1553](https://github.com/namehash/ensnode/pull/1553) [`220b71f`](https://github.com/namehash/ensnode/commit/220b71f1dfcf7d7d7ef6e5a2841dced2501ad3d7) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Added getDefaultEnsNodeUrl utility to get the URL for the default ENSNode deployment for a given ENS namespace

- [#1688](https://github.com/namehash/ensnode/pull/1688) [`6f4d39b`](https://github.com/namehash/ensnode/commit/6f4d39b026f42ecfeb0f9e21b4473f515dc31a23) Thanks [@djstrong](https://github.com/djstrong)! - `EnsRainbowApiClient.heal()` now accepts labelhashes in any common format — with or without a `0x` prefix, uppercase hex characters, bracket-enclosed encoded labelhashes, or odd-length hex strings — and normalizes them automatically. Invalid inputs return a `HealBadRequestError` rather than throwing.

  The underlying normalization utilities (`parseLabelHash`, `parseEncodedLabelHash`, `parseLabelHashOrEncodedLabelHash`) are also exported from `@ensnode/ensnode-sdk` for use in other contexts.

- [#1603](https://github.com/namehash/ensnode/pull/1603) [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91) Thanks [@Goader](https://github.com/Goader)! - Adds `parseTimestamp` utility to parse ISO 8601 date strings into Unix timestamps. Adds `errorTtl` option to `SWRCache` for configuring separate revalidation intervals for cached errors vs. successful results.

- Updated dependencies [[`a87b437`](https://github.com/namehash/ensnode/commit/a87b4370ff8b4da6a254dda39afac19e3a7f6e94)]:
  - @ensnode/datasources@1.6.0

## 1.5.1

### Patch Changes

- Updated dependencies []:
  - @ensnode/datasources@1.5.1
  - @namehash/ens-referrals@1.5.1

## 1.5.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/datasources@1.5.0
  - @namehash/ens-referrals@1.5.0

## 1.4.0

### Minor Changes

- [#1444](https://github.com/namehash/ensnode/pull/1444) [`fcd96db`](https://github.com/namehash/ensnode/commit/fcd96db1aae297a445597e3867de811bc42ca31d) Thanks [@Goader](https://github.com/Goader)! - Added optional time range filtering to the Registrar Actions API.

- [#1484](https://github.com/namehash/ensnode/pull/1484) [`cf1b218`](https://github.com/namehash/ensnode/commit/cf1b218c27cb2253f37ef6b452c908d5c387aa0a) Thanks [@Goader](https://github.com/Goader)! - Added `accurateAsOf` response field to the Registrar Actions API.

- [#1418](https://github.com/namehash/ensnode/pull/1418) [`4e0579b`](https://github.com/namehash/ensnode/commit/4e0579b85c3b118450e7907242b60ca46bebebda) Thanks [@Goader](https://github.com/Goader)! - Added revenue contribution tracking to referrer metrics, calculating total revenue contributed to the ENS DAO from referrals. Added `totalRevenueContribution` to individual referrer metrics and `grandTotalRevenueContribution` to aggregated metrics.

### Patch Changes

- [#1075](https://github.com/namehash/ensnode/pull/1075) [`706f86b`](https://github.com/namehash/ensnode/commit/706f86b47caf5693153cd2fb7e009b331795d990) Thanks [@djstrong](https://github.com/djstrong)! - Refine ENSRainbow Docs

- [#1338](https://github.com/namehash/ensnode/pull/1338) [`bb1686a`](https://github.com/namehash/ensnode/commit/bb1686a34ce1bd36a44598f8de0a24c40a439bc3) Thanks [@stevedylandev](https://github.com/stevedylandev)! - Adds OpenAPI schema endpoint and route descriptions to ENSApi

- Updated dependencies [[`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec), [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec), [`9862514`](https://github.com/namehash/ensnode/commit/9862514d320b2ed50e06410b57b28e3e30077ade), [`4e0579b`](https://github.com/namehash/ensnode/commit/4e0579b85c3b118450e7907242b60ca46bebebda)]:
  - @ensnode/datasources@1.4.0
  - @namehash/ens-referrals@1.4.0

## 1.3.1

### Patch Changes

- [#1396](https://github.com/namehash/ensnode/pull/1396) [`5d3237d`](https://github.com/namehash/ensnode/commit/5d3237d89f075be7a42d5fddb07b71837993e07a) Thanks [@tk-o](https://github.com/tk-o)! - Replace `SWRCache` implementation to address memory leaks.

- Updated dependencies []:
  - @ensnode/datasources@1.3.1
  - @namehash/ens-referrals@1.3.0

## 1.3.0

### Minor Changes

- [#1358](https://github.com/namehash/ensnode/pull/1358) [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173) Thanks [@tk-o](https://github.com/tk-o)! - Includes support for strigifying/parsing, and serializing/deserializing the following types: `AssetId`, `AccountId`.

- [#1358](https://github.com/namehash/ensnode/pull/1358) [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173) Thanks [@tk-o](https://github.com/tk-o)! - Updates serialization and deserialization methods for `AccountId` type.

- [#1358](https://github.com/namehash/ensnode/pull/1358) [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `name-token` submodule to `api` module.

- [#1379](https://github.com/namehash/ensnode/pull/1379) [`4bc9e82`](https://github.com/namehash/ensnode/commit/4bc9e82c288157fe29d00157160ae01517255728) Thanks [@Goader](https://github.com/Goader)! - Extended the `registrar-actions` endpoint to support filtering by `decodedReferrer` and pagination.

- [#1382](https://github.com/namehash/ensnode/pull/1382) [`9558b9f`](https://github.com/namehash/ensnode/commit/9558b9f6dd4aa65c81be067b82003bb9404f7137) Thanks [@Goader](https://github.com/Goader)! - Renamed `itemsPerPage` to `recordsPerPage` and `paginationContext` to `pageContext` in referrer leaderboard APIs to align with registrar actions terminology.

- [#1358](https://github.com/namehash/ensnode/pull/1358) [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173) Thanks [@tk-o](https://github.com/tk-o)! - Introduces the `NameToken` concept to `tokenscope` module.

- [#1358](https://github.com/namehash/ensnode/pull/1358) [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173) Thanks [@tk-o](https://github.com/tk-o)! - Implements `nameTokens` method on `ENSNodeClient`.

### Patch Changes

- Updated dependencies [[`9558b9f`](https://github.com/namehash/ensnode/commit/9558b9f6dd4aa65c81be067b82003bb9404f7137)]:
  - @namehash/ens-referrals@1.3.0
  - @ensnode/datasources@1.3.0

## 1.2.0

### Minor Changes

- [#1357](https://github.com/namehash/ensnode/pull/1357) [`97e4545`](https://github.com/namehash/ensnode/commit/97e4545c70d8c7469f4bd566b91277fdb0c3a699) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `tokenscope` module.

- [#1353](https://github.com/namehash/ensnode/pull/1353) [`976e284`](https://github.com/namehash/ensnode/commit/976e2842f2e25ff0844471de48a34659b136b5be) Thanks [@tk-o](https://github.com/tk-o)! - Create shared module for `pagination` features.

- [#1318](https://github.com/namehash/ensnode/pull/1318) [`e35600f`](https://github.com/namehash/ensnode/commit/e35600fe9808f3c72960429b2a56a7f22893bff6) Thanks [@Goader](https://github.com/Goader)! - Add referrer detail endpoint API. Supports querying individual referrers whether they are ranked on the leaderboard or not.

- [#1345](https://github.com/namehash/ensnode/pull/1345) [`4cee4ba`](https://github.com/namehash/ensnode/commit/4cee4ba538e5655ca1e8b75f4d72738f3413c9d3) Thanks [@tk-o](https://github.com/tk-o)! - Add QuickNode RPC provider support for auto-generated chain RPC URLs.

### Patch Changes

- Updated dependencies [[`ea06a3c`](https://github.com/namehash/ensnode/commit/ea06a3cf7d802c6dd338676d0f2439185934e0ab), [`e35600f`](https://github.com/namehash/ensnode/commit/e35600fe9808f3c72960429b2a56a7f22893bff6)]:
  - @namehash/ens-referrals@1.2.0
  - @ensnode/datasources@1.2.0

## 1.1.0

### Minor Changes

- [#1307](https://github.com/namehash/ensnode/pull/1307) [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582) Thanks [@tk-o](https://github.com/tk-o)! - Updates `ReferrerLeaderboard` data model and related logic to match updated ENS Holiday Awards rules.

- [#1307](https://github.com/namehash/ensnode/pull/1307) [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582) Thanks [@tk-o](https://github.com/tk-o)! - Refined schema for /ensanalytics/referrers response

### Patch Changes

- Updated dependencies [[`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582)]:
  - @namehash/ens-referrals@1.1.0
  - @ensnode/datasources@1.1.0

## 1.0.3

### Patch Changes

- [#1316](https://github.com/namehash/ensnode/pull/1316) [`4faad0b`](https://github.com/namehash/ensnode/commit/4faad0b534c5bbdfdeca4227565fe24ff29c3dd4) Thanks [@tk-o](https://github.com/tk-o)! - Support ESM and CJS package import format.

- Updated dependencies [[`4faad0b`](https://github.com/namehash/ensnode/commit/4faad0b534c5bbdfdeca4227565fe24ff29c3dd4)]:
  - @namehash/ens-referrals@1.0.1
  - @ensnode/datasources@1.0.3

## 1.0.2

### Patch Changes

- [#1314](https://github.com/namehash/ensnode/pull/1314) [`f6aeb17`](https://github.com/namehash/ensnode/commit/f6aeb17330da0f73ee337a2f94a02cabbab6613e) Thanks [@tk-o](https://github.com/tk-o)! - Fixes the output bundle format so the package can be used on the client-side.

- Updated dependencies []:
  - @ensnode/datasources@1.0.2
  - @namehash/ens-referrals@1.0.0

## 1.0.1

### Patch Changes

- Updated dependencies []:
  - @ensnode/datasources@1.0.1
  - @namehash/ens-referrals@1.0.0

## 1.0.0

### Minor Changes

- [#1265](https://github.com/namehash/ensnode/pull/1265) [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2) Thanks [@tk-o](https://github.com/tk-o)! - Implement Registrar Actions API module.

- [#1179](https://github.com/namehash/ensnode/pull/1179) [`bbf0d3b`](https://github.com/namehash/ensnode/commit/bbf0d3b6e328f5c18017bd7660b1ff93e7214ce2) Thanks [@tk-o](https://github.com/tk-o)! - Removed `endBlock` field from `ChainIndexingConfigIndefinite` type.

- [#1211](https://github.com/namehash/ensnode/pull/1211) [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5) Thanks [@shrugs](https://github.com/shrugs)! - BREAKING: Removed DefaultRecordsSelection export: integrating apps should define their own set of records to request when using useRecords().

- [#1239](https://github.com/namehash/ensnode/pull/1239) [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893) Thanks [@Goader](https://github.com/Goader)! - Introduces ENS Analytics API for tracking and analyzing referral metrics. Adds `/ensanalytics/aggregated-referrers` endpoint with pagination support to retrieve aggregated referrer metrics and contribution percentages.

- [#1257](https://github.com/namehash/ensnode/pull/1257) [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5) Thanks [@tk-o](https://github.com/tk-o)! - Replace `referrals` plugin with new `registrars` plugin.

- [#1239](https://github.com/namehash/ensnode/pull/1239) [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893) Thanks [@Goader](https://github.com/Goader)! - Added `staleWhileRevalidate` function for Stale-While-Revalidate caching pattern.

- [#1279](https://github.com/namehash/ensnode/pull/1279) [`11b8372`](https://github.com/namehash/ensnode/commit/11b8372ccb2456f2e71d9195f6e50b2fbbeb405a) Thanks [@Goader](https://github.com/Goader)! - Add configurable ENS Holiday Awards date range environment variables (`ENS_HOLIDAY_AWARDS_START` and `ENS_HOLIDAY_AWARDS_END`) to ENSApi. If not set, defaults to hardcoded values from `@namehash/ens-referrals` package. Includes validation to ensure end date is after or equal to start date. Dates must be specified in ISO 8601 format (e.g., '2025-12-01T00:00:00Z').

- [#1249](https://github.com/namehash/ensnode/pull/1249) [`617ab00`](https://github.com/namehash/ensnode/commit/617ab00cc57c2dc9df5af90eeaf3896f8864145d) Thanks [@tk-o](https://github.com/tk-o)! - Introduces a new `registrars` plugin for tracking all registrations and renewals for direct subnames of `eth`, `base.eth`, and `linea.eth`.

- [#1250](https://github.com/namehash/ensnode/pull/1250) [`63376ad`](https://github.com/namehash/ensnode/commit/63376ad8a4f1fe72b7ad5a9368496d235411bc28) Thanks [@tk-o](https://github.com/tk-o)! - Create `currencies` module in SDK.

- [#1265](https://github.com/namehash/ensnode/pull/1265) [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2) Thanks [@tk-o](https://github.com/tk-o)! - Implement `registrarActions()` method on ENSNodeClient.

- [#1211](https://github.com/namehash/ensnode/pull/1211) [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5) Thanks [@shrugs](https://github.com/shrugs)! - BREAKING: client.config() now returns Promise<EnsApiPublicConfig> instead of ENSIndexerPublicConfig.

- [#1239](https://github.com/namehash/ensnode/pull/1239) [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893) Thanks [@Goader](https://github.com/Goader)! - Added ENS Analytics module with types, serialization/deserialization functions, and Zod validation schemas for `PaginatedAggregatedReferrersResponse`. This includes support for aggregated referrer metrics with contribution percentages and pagination.

- [#1302](https://github.com/namehash/ensnode/pull/1302) [`6659c57`](https://github.com/namehash/ensnode/commit/6659c57e487938761d642a5f46ff0e86baeac286) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `withReferral` filter for Registrar Actions API.

- [#1253](https://github.com/namehash/ensnode/pull/1253) [`40658a7`](https://github.com/namehash/ensnode/commit/40658a70d591d972150f69cb18fbd3dd390b4114) Thanks [@tk-o](https://github.com/tk-o)! - Create serialization and deserialization helpers for `AccountId` type.

### Patch Changes

- [#1239](https://github.com/namehash/ensnode/pull/1239) [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893) Thanks [@Goader](https://github.com/Goader)! - Migrated cache implementation to use `UnixTimestamp` and `Duration` types for better type safety and consistency.

- Updated dependencies [[`6be7a18`](https://github.com/namehash/ensnode/commit/6be7a189d0f9ac21d89c01941eb6b5a3cd13f88f)]:
  - @ensnode/datasources@1.0.0
  - @namehash/ens-referrals@1.0.0

## 0.36.0

### Minor Changes

- [#1015](https://github.com/namehash/ensnode/pull/1015) [`6b5bfd0`](https://github.com/namehash/ensnode/commit/6b5bfd00a8d8217a76da0bec9d8ee6685adc29e9) Thanks [@tk-o](https://github.com/tk-o)! - Rename chain indexing status from `Unstarted` to `Queued`.

- [#1074](https://github.com/namehash/ensnode/pull/1074) [`e4d3ce3`](https://github.com/namehash/ensnode/commit/e4d3ce3d9659430a8f0597a4c719ad1993342eaf) Thanks [@tk-o](https://github.com/tk-o)! - Assume all `Address` values to be lowercase EVM addresses.

- [#1137](https://github.com/namehash/ensnode/pull/1137) [`1460d20`](https://github.com/namehash/ensnode/commit/1460d204a4b4ff798597577f63c3a2a801bfc815) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Introduce data models for Identity / UnresolvedIdentity / ResolvedIdentity

- [#1157](https://github.com/namehash/ensnode/pull/1157) [`ffb4103`](https://github.com/namehash/ensnode/commit/ffb4103aeb2ce3cb4c5a37885de62fa4f435362d) Thanks [@tk-o](https://github.com/tk-o)! - Extend `ENSIndexerVersionInfo` with `ensDb`, `ensIndexer`, and `ensNormalize` fields.

- [#1015](https://github.com/namehash/ensnode/pull/1015) [`6b5bfd0`](https://github.com/namehash/ensnode/commit/6b5bfd00a8d8217a76da0bec9d8ee6685adc29e9) Thanks [@tk-o](https://github.com/tk-o)! - Extends the `ENSIndexerOverallIndexingCompletedStatus` data model with the `omnichainIndexingCursor` field.

- [#1009](https://github.com/namehash/ensnode/pull/1009) [`98983ac`](https://github.com/namehash/ensnode/commit/98983ac3c026073da5133aeb64025cbaf88523c8) Thanks [@tk-o](https://github.com/tk-o)! - Drops `latestSyncedBlock` field from `ChainIndexingBackfillStatus` data model.

- [#1095](https://github.com/namehash/ensnode/pull/1095) [`16b4748`](https://github.com/namehash/ensnode/commit/16b474849386387141fe2534574f8b16defbcb09) Thanks [@tk-o](https://github.com/tk-o)! - Refine Indexing Status API data model around _snapshots_ and _projections_.

### Patch Changes

- Updated dependencies [[`afbf575`](https://github.com/namehash/ensnode/commit/afbf575d8448446f52ab0da8cbe8f5f2d7da6827), [`7fc0465`](https://github.com/namehash/ensnode/commit/7fc0465d3b816affe2930c7f36577d0214d145b9)]:
  - @ensnode/datasources@0.36.0

## 0.35.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/datasources@0.35.0

## 0.34.0

### Minor Changes

- [#919](https://github.com/namehash/ensnode/pull/919) [`6f20c5d`](https://github.com/namehash/ensnode/commit/6f20c5dd1bdc8517679155efff6e6c461b15defa) Thanks [@tk-o](https://github.com/tk-o)! - Includes `latestSyncedBlock` field in `ChainIndexingBackfillStatus` data model.

- [#919](https://github.com/namehash/ensnode/pull/919) [`6f20c5d`](https://github.com/namehash/ensnode/commit/6f20c5dd1bdc8517679155efff6e6c461b15defa) Thanks [@tk-o](https://github.com/tk-o)! - Extends `ENSNodeClient` with new methods: `.config()` and `.indexingStatus()`.

### Patch Changes

- [#962](https://github.com/namehash/ensnode/pull/962) [`845a037`](https://github.com/namehash/ensnode/commit/845a03761dc830303a56cd70fe0d57c36d78a663) Thanks [@djstrong](https://github.com/djstrong)! - Add label set configuration support to ENSNode SDK

  - Add label set configuration types to ENSIndexerConfig
  - Update configuration serialization and deserialization
  - Add Zod schema validation for label set configuration
  - Update configuration conversion utilities and tests

- Updated dependencies [[`373e934`](https://github.com/namehash/ensnode/commit/373e9343f7ac14010ae9a995cb812c42210c92e2)]:
  - @ensnode/datasources@0.34.0

## 0.33.0

### Patch Changes

- Updated dependencies [[`748a16e`](https://github.com/namehash/ensnode/commit/748a16e3a74798b21ccf1881dcf36d411ee6a27c)]:
  - @ensnode/datasources@0.33.0

## 0.32.0

### Minor Changes

- [#896](https://github.com/namehash/ensnode/pull/896) [`2b60fad`](https://github.com/namehash/ensnode/commit/2b60fad313e31735c77372c514d22523f9d2cbc3) Thanks [@tk-o](https://github.com/tk-o)! - Introduced `ensindexer/indexing-status` module.

- [#865](https://github.com/namehash/ensnode/pull/865) [`32ad3d8`](https://github.com/namehash/ensnode/commit/32ad3d8d129c5ce872615819de2fcc0be433a294) Thanks [@shrugs](https://github.com/shrugs)! - adds protocol-tracing-related types to the sdk

- [#902](https://github.com/namehash/ensnode/pull/902) [`a769e90`](https://github.com/namehash/ensnode/commit/a769e9028a0dd55b88e62fe90669c5dc54e51485) Thanks [@shrugs](https://github.com/shrugs)! - include support for resolveRecords, resolvePrimaryName, and resolvePrimaryNames

- [#886](https://github.com/namehash/ensnode/pull/886) [`ad7fc8b`](https://github.com/namehash/ensnode/commit/ad7fc8bb4d12fe0ef1bb133eef9670d4eb84911b) Thanks [@notrab](https://github.com/notrab)! - Adds `resolveRecords` and `resolvePrimaryName` methods to ENSNode-SDK.

- [#894](https://github.com/namehash/ensnode/pull/894) [`f3eff8a`](https://github.com/namehash/ensnode/commit/f3eff8aef94cf6162ae4bab39059abd1e852352b) Thanks [@tk-o](https://github.com/tk-o)! - Split `utils` module into two modules: `ens` and `shared`. Create a new `@ensnode/ensnode-sdk/internal` import path allowing other monorepo packages to re-use validation methods from ENSNode SDK.

### Patch Changes

- Updated dependencies [[`a769e90`](https://github.com/namehash/ensnode/commit/a769e9028a0dd55b88e62fe90669c5dc54e51485), [`38711f8`](https://github.com/namehash/ensnode/commit/38711f88b327284ce51a9b4a21c39af2192f2e01), [`3c6378b`](https://github.com/namehash/ensnode/commit/3c6378bd8f1504ed4da724f537dc6869371a40e0), [`cad61ef`](https://github.com/namehash/ensnode/commit/cad61efc9984aa1b8b0738e90e29b28a879886a8)]:
  - @ensnode/datasources@0.32.0

## 0.31.0

## 0.30.0

## 0.29.0

## 0.28.0

### Minor Changes

- [#756](https://github.com/namehash/ensnode/pull/756) [`af2cb03`](https://github.com/namehash/ensnode/commit/af2cb0314bcfc1b5a523670eae558b040407156b) Thanks [@tk-o](https://github.com/tk-o)! - Renamed @ensnode/utils to @ensnode/ensnode-sdk.

### Patch Changes

- [#779](https://github.com/namehash/ensnode/pull/779) [`e30289e`](https://github.com/namehash/ensnode/commit/e30289e5292a991638fd55cc04d663dc97ecb30a) Thanks [@tk-o](https://github.com/tk-o)! - Fix references across monorepo dependencies.

## 0.27.0

## 0.26.0

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.1

### Patch Changes

- [#658](https://github.com/namehash/ensnode/pull/658) [`8f494c4`](https://github.com/namehash/ensnode/commit/8f494c499ec1693d25d0c033158ac75cfdb88cc5) Thanks [@tk-o](https://github.com/tk-o)! - Ensuring Github Release Notes correctness: NPM links

## 0.22.0

## 0.21.0

## 0.20.0

## 0.19.4

### Patch Changes

- [#628](https://github.com/namehash/ensnode/pull/628) [`829d50f`](https://github.com/namehash/ensnode/commit/829d50f6b2ea1f49276a8cb614b082c80aea760d) Thanks [@tk-o](https://github.com/tk-o)! - Update release notes format when creating Github Release. Also, stop pushing git tag per each released package.

## 0.19.3

### Patch Changes

- [#624](https://github.com/namehash/ensnode/pull/624) [`387c7c2`](https://github.com/namehash/ensnode/commit/387c7c24c5a7e76c2145799962b3537ed000b6c4) Thanks [@tk-o](https://github.com/tk-o)! - Allow CI workflow to read PR information to generate Github Release notes.

## 0.19.2

### Patch Changes

- [#622](https://github.com/namehash/ensnode/pull/622) [`396607e`](https://github.com/namehash/ensnode/commit/396607e08532e22b2367b2b4b1a2962983924e81) Thanks [@tk-o](https://github.com/tk-o)! - Updated CI workflow for creating Github Releases.

## 0.19.1

## 0.19.0

### Minor Changes

- [#532](https://github.com/namehash/ensnode/pull/532) [`7e0c78d`](https://github.com/namehash/ensnode/commit/7e0c78d8218519421b923e84723867e3e0ba76be) Thanks [@shrugs](https://github.com/shrugs)! - the great naming terminology refactor

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

## 0.6.0

## 0.2.0

### Minor Changes

- [#362](https://github.com/namehash/ensnode/pull/362) [`afbc730`](https://github.com/namehash/ensnode/commit/afbc730ff98d72b8118df0d2e7712429f23b8747) Thanks [@tk-o](https://github.com/tk-o)! - ENSIndexer gains ability to heal labels based on reverse addresses.

## 0.1.0

### Minor Changes

- 6941f0b: Initial Release

# @ensnode/ensnode-sdk

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

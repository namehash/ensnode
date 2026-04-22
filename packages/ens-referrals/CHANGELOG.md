# @namehash/ens-referrals

## 1.10.0

### Minor Changes

- [#1925](https://github.com/namehash/ensnode/pull/1925) [`b5da4a6`](https://github.com/namehash/ensnode/commit/b5da4a6d78d6c4d0de83ea7928f561757eb8d7f4) Thanks [@Goader](https://github.com/Goader)! - Flatten the `@namehash/ens-referrals/v1` subpath export to the package root. Import from `@namehash/ens-referrals` instead of `@namehash/ens-referrals/v1` (and `@namehash/ens-referrals/internal` instead of `@namehash/ens-referrals/v1/internal`).

- [#1874](https://github.com/namehash/ensnode/pull/1874) [`b781245`](https://github.com/namehash/ensnode/commit/b781245036e67479ded836df3916ab9675a38285) Thanks [@Goader](https://github.com/Goader)! - Rename rev-share-limit API fields for clarity: `minQualifiedRevenueContribution` → `minBaseRevenueContribution`, `qualifiedRevenueShare` → `maxBaseRevenueShare`, `standardAwardValue` → `uncappedAward`, `awardPoolApproxValue` → `cappedAward`. Rename `totalAwardPoolValue` → `awardPool` for both rev-share-limit and pie-split rules. Extract the previously hardcoded `BASE_REVENUE_CONTRIBUTION_PER_YEAR` constant into a per-edition `baseAnnualRevenueContribution` rule field.

- [#1925](https://github.com/namehash/ensnode/pull/1925) [`b5da4a6`](https://github.com/namehash/ensnode/commit/b5da4a6d78d6c4d0de83ea7928f561757eb8d7f4) Thanks [@Goader](https://github.com/Goader)! - Remove v0 ENS Referrals API. The `/ensanalytics/*` routes are deleted — use `/v1/ensanalytics/*` instead.

- [#1849](https://github.com/namehash/ensnode/pull/1849) [`5c2dc68`](https://github.com/namehash/ensnode/commit/5c2dc687a6b6e6dd31c1f1aeab08e89d3a9a5e36) Thanks [@Y3drk](https://github.com/Y3drk)! - Added a README section showcasing a working example of defining referral program edition configs via JSON files.

- [#1912](https://github.com/namehash/ensnode/pull/1912) [`d5225c0`](https://github.com/namehash/ensnode/commit/d5225c00f4528b09826ca2a59f87271df6c7b330) Thanks [@Goader](https://github.com/Goader)! - Removed the hardcoded "default" referral program edition config set and renamed `CUSTOM_REFERRAL_PROGRAM_EDITIONS` to `REFERRAL_PROGRAM_EDITIONS`. An unset `REFERRAL_PROGRAM_EDITIONS` now means the referral program has zero configured editions, so ENSApi performs no referral-related work against ENSDb. The editions array may also now be empty.

- [#1943](https://github.com/namehash/ensnode/pull/1943) [`49a0e75`](https://github.com/namehash/ensnode/commit/49a0e75e25d92c4e3ebb08e87abee3e33c0e8101) Thanks [@Goader](https://github.com/Goader)! - Generalize disqualifications into admin actions: introduce AdminAction discriminated union (Disqualification | Warning), rename `disqualifications` to `adminActions` in rev-share-cap rules, and replace `adminDisqualificationReason` with `adminAction` in referrer metrics.

- [#1919](https://github.com/namehash/ensnode/pull/1919) [`319d619`](https://github.com/namehash/ensnode/commit/319d619f6259f7bda5813c685a993074acb259ba) Thanks [@Goader](https://github.com/Goader)! - Rename `rev-share-limit` award model to `rev-share-cap`.

### Patch Changes

- [#1938](https://github.com/namehash/ensnode/pull/1938) [`ab20d4d`](https://github.com/namehash/ensnode/commit/ab20d4ddf7233151bdf5ab78f4f04a5f77c72d87) Thanks [@Goader](https://github.com/Goader)! - Tighten referral program types to use `NormalizedAddress` instead of `Address` in internal leaderboard map keys (pie-split, shared `sliceReferrers`) and related JSDoc. No runtime behavior change.

- Updated dependencies [[`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`29afaa6`](https://github.com/namehash/ensnode/commit/29afaa6ad8a3f3c8133241cf1a9324980498ded4), [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`7fca45d`](https://github.com/namehash/ensnode/commit/7fca45d09dc6e3456fec2cae0827e9d2c54827a6), [`29fcfc7`](https://github.com/namehash/ensnode/commit/29fcfc7a1ab01c3214b5c16fc0e4a349010e9360), [`5f341e1`](https://github.com/namehash/ensnode/commit/5f341e14420146db772fc01b1b3c0f4e2d4a3cb7), [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`b8f5be7`](https://github.com/namehash/ensnode/commit/b8f5be761748f75c06ba4da81dd6098eec6ebb9a), [`4c99177`](https://github.com/namehash/ensnode/commit/4c991777ac13ffd2cc1fb947e5a47bd7733b112b), [`b2481d6`](https://github.com/namehash/ensnode/commit/b2481d6dae6f704493140aa63cd4ad1bfd3e3301), [`9abb302`](https://github.com/namehash/ensnode/commit/9abb30238374f0847a68615827dddafb6dc05dad), [`ed6ee96`](https://github.com/namehash/ensnode/commit/ed6ee9641bfa6f42ddc95955cf8b013c93bf2f4a), [`677db8b`](https://github.com/namehash/ensnode/commit/677db8b67effc6d530716c0a1902244dba56d787)]:
  - @ensnode/ensnode-sdk@1.10.0
  - enssdk@1.10.0

## 1.9.0

### Minor Changes

- [#1823](https://github.com/namehash/ensnode/pull/1823) [`113232b`](https://github.com/namehash/ensnode/commit/113232bd02a876a1dbf4607019e724d7cc577351) Thanks [@Y3drk](https://github.com/Y3drk)! - Updated package documentation with a client methods overview.

### Patch Changes

- Updated dependencies [[`70e6f24`](https://github.com/namehash/ensnode/commit/70e6f2475a566135602f4adbcf44df2a6f74e5fd), [`387715e`](https://github.com/namehash/ensnode/commit/387715e1bc4c996c0ae7545bfc78b79149e04f58)]:
  - @ensnode/ensnode-sdk@1.9.0

## 1.8.1

### Patch Changes

- Updated dependencies []:
  - @ensnode/ensnode-sdk@1.8.1

## 1.8.0

### Minor Changes

- [#1780](https://github.com/namehash/ensnode/pull/1780) [`0bb79fc`](https://github.com/namehash/ensnode/commit/0bb79fc601a43ea35dfdeed2afe91e24bbc6b5fd) Thanks [@Goader](https://github.com/Goader)! - Add `Exhausted` and `AwardsReview` referral program statuses; add `areAwardsDistributed` to base rules; enrich `/editions` with runtime `status` and `awardPoolRemaining` per edition.

### Patch Changes

- [#1742](https://github.com/namehash/ensnode/pull/1742) [`0bde568`](https://github.com/namehash/ensnode/commit/0bde56873f5cba6ee8bcfa18534a6026b8649bbd) Thanks [@Goader](https://github.com/Goader)! - Simplify how rev-share-limit leaderboard race sorting achieves deterministic sorting by execution order.

- Updated dependencies [[`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772), [`9ea8580`](https://github.com/namehash/ensnode/commit/9ea858055109eaf3a92d210f2b3d9170232a32e8)]:
  - @ensnode/ensnode-sdk@1.8.0

## 1.7.0

### Minor Changes

- [#1732](https://github.com/namehash/ensnode/pull/1732) [`9ef8ab7`](https://github.com/namehash/ensnode/commit/9ef8ab740f03cbc9abba189ff959e4f94b093cbb) Thanks [@Goader](https://github.com/Goader)! - Add client-side forward compatibility for unrecognized leaderboard page and edition metrics award models. When a server returns a newer `awardModel` not known to this client, the deserializers now wrap the response as `ReferrerLeaderboardPageUnrecognized` or `ReferrerEditionMetricsUnrecognized` instead of throwing.

### Patch Changes

- Updated dependencies [[`2d03bcd`](https://github.com/namehash/ensnode/commit/2d03bcd94107168e24b9620721e023cfa17d0440)]:
  - @ensnode/ensnode-sdk@1.7.0

## 1.6.0

### Minor Changes

- [#1663](https://github.com/namehash/ensnode/pull/1663) [`c6cc7c4`](https://github.com/namehash/ensnode/commit/c6cc7c4f6d910b196d1475f89e79097d569840cf) Thanks [@Goader](https://github.com/Goader)! - Introduces a pluggable award model architecture for referral program editions. The original Holiday Awards logic is now encapsulated as the `pie-split` model. A new `rev-share-limit` model is added to support the upcoming referral program edition. `ReferralProgramRules` is now a discriminated union over `awardModel`, with an `Unrecognized` variant for forward compatibility — older clients safely skip editions with unknown models rather than crashing.

- [#1621](https://github.com/namehash/ensnode/pull/1621) [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c) Thanks [@Goader](https://github.com/Goader)! - Added `status` field to referral program API responses (`ReferrerLeaderboardPage`, `ReferrerEditionMetricsRanked`, `ReferrerEditionMetricsUnranked`) indicating whether a program is "Scheduled", "Active", or "Closed" based on the program's timing relative to `accurateAsOf`.

- [#1603](https://github.com/namehash/ensnode/pull/1603) [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91) Thanks [@Goader](https://github.com/Goader)! - Introduces referral program editions support with pre-configured edition definitions (ENS Holiday Awards December 2025, March 2026 edition). Updated ENSAnalytics API v1 to support edition-based leaderboard queries and added edition configuration to environment schema.

- [#1712](https://github.com/namehash/ensnode/pull/1712) [`3ece8f0`](https://github.com/namehash/ensnode/commit/3ece8f02f5ad82344f73aa98d67cb83cf3da3c03) Thanks [@Goader](https://github.com/Goader)! - Add admin disqualification support for rev-share-limit referral program editions.

- [#1542](https://github.com/namehash/ensnode/pull/1542) [`500388b`](https://github.com/namehash/ensnode/commit/500388b217ea420b79b85670891b99ade07f07f0) Thanks [@Goader](https://github.com/Goader)! - Flipped dependency relationship between `ensnode-sdk` and `ens-referrals`. Introduced new `ENSReferralsClient` for referral leaderboard APIs. Consolidated duplicate types (`ChainId`, `AccountId`, `UnixTimestamp`, `Duration`) by importing from `ensnode-sdk`.

- [#1562](https://github.com/namehash/ensnode/pull/1562) [`84a4c5e`](https://github.com/namehash/ensnode/commit/84a4c5e70df1e33ceed495888fc9b4436c577fc8) Thanks [@Goader](https://github.com/Goader)! - Migrated v1 referrer leaderboard API to use mature `PriceEth` and `PriceUsdc` types from `ensnode-sdk`, replacing temporary `RevenueContribution` and `USDQuantity` types. Added `/v1` subpath export to `ens-referrals`.

### Patch Changes

- Updated dependencies [[`220b71f`](https://github.com/namehash/ensnode/commit/220b71f1dfcf7d7d7ef6e5a2841dced2501ad3d7), [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`1f8a05b`](https://github.com/namehash/ensnode/commit/1f8a05b85ed264e2e54e90fbf8b8c0201a526512), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`91d7653`](https://github.com/namehash/ensnode/commit/91d7653b0447e0e767e41b275515fb8423af3c0a), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`a0be9a6`](https://github.com/namehash/ensnode/commit/a0be9a6fb188fb6dc982ba297896ee5b357c3072), [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2), [`6f4d39b`](https://github.com/namehash/ensnode/commit/6f4d39b026f42ecfeb0f9e21b4473f515dc31a23), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`4cf6f41`](https://github.com/namehash/ensnode/commit/4cf6f412a9fa9aa6c438b83acf090adb8365f497), [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91), [`1bc599f`](https://github.com/namehash/ensnode/commit/1bc599f99804d1cf08dd0d23d5518b1b8e7928c5), [`500388b`](https://github.com/namehash/ensnode/commit/500388b217ea420b79b85670891b99ade07f07f0), [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2), [`70b15a1`](https://github.com/namehash/ensnode/commit/70b15a18800921d3a28e1dcfe512a79287537d87), [`43d3e9c`](https://github.com/namehash/ensnode/commit/43d3e9cdc6456c8b32940a8860b92c523157ffea), [`84a4c5e`](https://github.com/namehash/ensnode/commit/84a4c5e70df1e33ceed495888fc9b4436c577fc8)]:
  - @ensnode/ensnode-sdk@1.6.0

## 1.5.1

## 1.5.0

## 1.4.0

### Minor Changes

- [#1476](https://github.com/namehash/ensnode/pull/1476) [`9862514`](https://github.com/namehash/ensnode/commit/9862514d320b2ed50e06410b57b28e3e30077ade) Thanks [@Y3drk](https://github.com/Y3drk)! - Moves referral program status business logic to ens-referrals.

- [#1418](https://github.com/namehash/ensnode/pull/1418) [`4e0579b`](https://github.com/namehash/ensnode/commit/4e0579b85c3b118450e7907242b60ca46bebebda) Thanks [@Goader](https://github.com/Goader)! - Added revenue contribution tracking to referrer metrics, calculating total revenue contributed to the ENS DAO from referrals. Added `totalRevenueContribution` to individual referrer metrics and `grandTotalRevenueContribution` to aggregated metrics.

## 1.3.0

### Minor Changes

- [#1382](https://github.com/namehash/ensnode/pull/1382) [`9558b9f`](https://github.com/namehash/ensnode/commit/9558b9f6dd4aa65c81be067b82003bb9404f7137) Thanks [@Goader](https://github.com/Goader)! - Renamed `itemsPerPage` to `recordsPerPage` and `paginationContext` to `pageContext` in referrer leaderboard APIs to align with registrar actions terminology.

## 1.2.0

### Minor Changes

- [#1318](https://github.com/namehash/ensnode/pull/1318) [`e35600f`](https://github.com/namehash/ensnode/commit/e35600fe9808f3c72960429b2a56a7f22893bff6) Thanks [@Goader](https://github.com/Goader)! - Add referrer detail endpoint API. Supports querying individual referrers whether they are ranked on the leaderboard or not.

### Patch Changes

- [#1339](https://github.com/namehash/ensnode/pull/1339) [`ea06a3c`](https://github.com/namehash/ensnode/commit/ea06a3cf7d802c6dd338676d0f2439185934e0ab) Thanks [@Y3drk](https://github.com/Y3drk)! - Fix calculation of `hasNext` parameter

## 1.1.0

### Minor Changes

- [#1307](https://github.com/namehash/ensnode/pull/1307) [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582) Thanks [@tk-o](https://github.com/tk-o)! - Refactored `ens-referrals` package to contain much of the business logic for referrals such that it could be extracted out of other parts of our systems.

## 1.0.1

### Patch Changes

- [#1316](https://github.com/namehash/ensnode/pull/1316) [`4faad0b`](https://github.com/namehash/ensnode/commit/4faad0b534c5bbdfdeca4227565fe24ff29c3dd4) Thanks [@tk-o](https://github.com/tk-o)! - Support ESM and CJS package import format.

# @namehash/ens-referrals

## 1.6.0

### Minor Changes

- [#1621](https://github.com/namehash/ensnode/pull/1621) [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c) Thanks [@Goader](https://github.com/Goader)! - Added `status` field to referral program API responses (`ReferrerLeaderboardPage`, `ReferrerEditionMetricsRanked`, `ReferrerEditionMetricsUnranked`) indicating whether a program is "Scheduled", "Active", or "Closed" based on the program's timing relative to `accurateAsOf`.

- [#1603](https://github.com/namehash/ensnode/pull/1603) [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91) Thanks [@Goader](https://github.com/Goader)! - Introduces referral program editions support with pre-configured edition definitions (ENS Holiday Awards December 2025, March 2026 edition). Updated ENSAnalytics API v1 to support edition-based leaderboard queries and added edition configuration to environment schema.

- [#1542](https://github.com/namehash/ensnode/pull/1542) [`500388b`](https://github.com/namehash/ensnode/commit/500388b217ea420b79b85670891b99ade07f07f0) Thanks [@Goader](https://github.com/Goader)! - Flipped dependency relationship between `ensnode-sdk` and `ens-referrals`. Introduced new `ENSReferralsClient` for referral leaderboard APIs. Consolidated duplicate types (`ChainId`, `AccountId`, `UnixTimestamp`, `Duration`) by importing from `ensnode-sdk`.

- [#1562](https://github.com/namehash/ensnode/pull/1562) [`84a4c5e`](https://github.com/namehash/ensnode/commit/84a4c5e70df1e33ceed495888fc9b4436c577fc8) Thanks [@Goader](https://github.com/Goader)! - Migrated v1 referrer leaderboard API to use mature `PriceEth` and `PriceUsdc` types from `ensnode-sdk`, replacing temporary `RevenueContribution` and `USDQuantity` types. Added `/v1` subpath export to `ens-referrals`.

### Patch Changes

- Updated dependencies [[`220b71f`](https://github.com/namehash/ensnode/commit/220b71f1dfcf7d7d7ef6e5a2841dced2501ad3d7), [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`91d7653`](https://github.com/namehash/ensnode/commit/91d7653b0447e0e767e41b275515fb8423af3c0a), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2), [`6f4d39b`](https://github.com/namehash/ensnode/commit/6f4d39b026f42ecfeb0f9e21b4473f515dc31a23), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`4cf6f41`](https://github.com/namehash/ensnode/commit/4cf6f412a9fa9aa6c438b83acf090adb8365f497), [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91), [`1bc599f`](https://github.com/namehash/ensnode/commit/1bc599f99804d1cf08dd0d23d5518b1b8e7928c5), [`500388b`](https://github.com/namehash/ensnode/commit/500388b217ea420b79b85670891b99ade07f07f0), [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2), [`70b15a1`](https://github.com/namehash/ensnode/commit/70b15a18800921d3a28e1dcfe512a79287537d87), [`43d3e9c`](https://github.com/namehash/ensnode/commit/43d3e9cdc6456c8b32940a8860b92c523157ffea), [`84a4c5e`](https://github.com/namehash/ensnode/commit/84a4c5e70df1e33ceed495888fc9b4436c577fc8)]:
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

# @ensnode/ensdb-sdk

## 1.9.0

### Minor Changes

- [#1832](https://github.com/namehash/ensnode/pull/1832) [`9f52a66`](https://github.com/namehash/ensnode/commit/9f52a662e5828e944210f35d47571661899fc30e) Thanks [@tk-o](https://github.com/tk-o)! - Hotfixed the `buildConcreteEnsIndexerSchema` function by replacing the cloning approach with working mutation approach.

- [#1809](https://github.com/namehash/ensnode/pull/1809) [`aaa471f`](https://github.com/namehash/ensnode/commit/aaa471f0a33d0f96389e706dcaed2b704e2952ea) Thanks [@tk-o](https://github.com/tk-o)! - Renamed the `client` getter on `EnsDbReader` class to `ensDb`.

### Patch Changes

- Updated dependencies [[`70e6f24`](https://github.com/namehash/ensnode/commit/70e6f2475a566135602f4adbcf44df2a6f74e5fd), [`387715e`](https://github.com/namehash/ensnode/commit/387715e1bc4c996c0ae7545bfc78b79149e04f58)]:
  - @ensnode/ensnode-sdk@1.9.0

## 1.8.1

### Patch Changes

- [#1820](https://github.com/namehash/ensnode/pull/1820) [`12f279d`](https://github.com/namehash/ensnode/commit/12f279da603da358869a709cc8a7a8c0d56080e5) Thanks [@tk-o](https://github.com/tk-o)! - Temporarily removed the `byName` index on `subgraph_domains` table in ENSDb.

- Updated dependencies []:
  - @ensnode/ensnode-sdk@1.8.1

## 1.8.0

### Minor Changes

- [#1772](https://github.com/namehash/ensnode/pull/1772) [`5ce102e`](https://github.com/namehash/ensnode/commit/5ce102e11c7b891844b0762cffa45ade1a997e0f) Thanks [@tk-o](https://github.com/tk-o)! - Renamed `@ensnode/ensnode-schema` to `@ensnode/ensdb-sdk`.

- [#1798](https://github.com/namehash/ensnode/pull/1798) [`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772) Thanks [@tk-o](https://github.com/tk-o)! - Moved `ensdb` module from ENSNode SDK into ENSDb SDK.

- [#1778](https://github.com/namehash/ensnode/pull/1778) [`d6dd425`](https://github.com/namehash/ensnode/commit/d6dd4252f690daba13bf02aa53a1ef3e868c823e) Thanks [@tk-o](https://github.com/tk-o)! - Created isolated database schema definitions: ENSIndexer Schema and ENSNode Schema.

- [#1779](https://github.com/namehash/ensnode/pull/1779) [`5ac81cb`](https://github.com/namehash/ensnode/commit/5ac81cb42ad3a4bf561d82c2dd628e85988240ef) Thanks [@tk-o](https://github.com/tk-o)! - Introduced toolkit for managing ENSDb migrations for ENSNode Schema.

- [#1798](https://github.com/namehash/ensnode/pull/1798) [`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772) Thanks [@tk-o](https://github.com/tk-o)! - Introduced two client implementations for ENSDb: `EnsDbReader` and `EnsDbWriter`.

### Patch Changes

- Updated dependencies [[`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772), [`9ea8580`](https://github.com/namehash/ensnode/commit/9ea858055109eaf3a92d210f2b3d9170232a32e8)]:
  - @ensnode/ensnode-sdk@1.8.0

## 1.7.0

## 1.6.0

### Minor Changes

- [#1660](https://github.com/namehash/ensnode/pull/1660) [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842) Thanks [@tk-o](https://github.com/tk-o)! - Includes schema for `ENSNodeMetadata`.

## 1.5.1

## 1.5.0

### Minor Changes

- [#1527](https://github.com/namehash/ensnode/pull/1527) [`dc7e07f`](https://github.com/namehash/ensnode/commit/dc7e07f6e69e30d597a871b79bd2c6876de9f8cc) Thanks [@tk-o](https://github.com/tk-o)! - Update `registrars` schema to enable storing at most one metadata record.

## 1.4.0

### Minor Changes

- [#1280](https://github.com/namehash/ensnode/pull/1280) [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec) Thanks [@shrugs](https://github.com/shrugs)! - Introduces the ENSv2 Plugin ('ensv2') for indexing both ENSv1 and the future ENSv2 protocol.

## 1.3.1

## 1.3.0

## 1.2.0

## 1.1.0

## 1.0.3

## 1.0.2

## 1.0.1

## 1.0.0

### Minor Changes

- [#1257](https://github.com/namehash/ensnode/pull/1257) [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5) Thanks [@tk-o](https://github.com/tk-o)! - Replace `referrals` schema with new `registrarActions` schema.

- [#1249](https://github.com/namehash/ensnode/pull/1249) [`617ab00`](https://github.com/namehash/ensnode/commit/617ab00cc57c2dc9df5af90eeaf3896f8864145d) Thanks [@tk-o](https://github.com/tk-o)! - Introduces a new `registrars` plugin for tracking all registrations and renewals for direct subnames of `eth`, `base.eth`, and `linea.eth`.

- [#1265](https://github.com/namehash/ensnode/pull/1265) [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2) Thanks [@tk-o](https://github.com/tk-o)! - Update `registrant` field type on the `registrars` schema to store hex values.

## 0.36.0

## 0.35.0

### Minor Changes

- [#1001](https://github.com/namehash/ensnode/pull/1001) [`7ccaa65`](https://github.com/namehash/ensnode/commit/7ccaa65c5142f0491d7f1882cd84eed7e0d3c8ea) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Index mappings between ENS names and their ownership controlling tokens.

## 0.34.0

### Minor Changes

- [#970](https://github.com/namehash/ensnode/pull/970) [`373e934`](https://github.com/namehash/ensnode/commit/373e9343f7ac14010ae9a995cb812c42210c92e2) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Initial launch of ENS TokenScope with support for indexing Seaport sales.

## 0.33.0

## 0.32.0

### Minor Changes

- [#902](https://github.com/namehash/ensnode/pull/902) [`a769e90`](https://github.com/namehash/ensnode/commit/a769e9028a0dd55b88e62fe90669c5dc54e51485) Thanks [@shrugs](https://github.com/shrugs)! - include schema to index an account's primary name records as emitted by StandaloneReverseRegistrars

## 0.31.0

## 0.30.0

## 0.29.0

## 0.28.0

### Minor Changes

- [#746](https://github.com/namehash/ensnode/pull/746) [`9aeaccd`](https://github.com/namehash/ensnode/commit/9aeaccd1034b970dc3a770a349292e65ba53cd2d) Thanks [@shrugs](https://github.com/shrugs)! - addded resolver record value entities to schema

## 0.27.0

### Minor Changes

- [#706](https://github.com/namehash/ensnode/pull/706) [`fcea8c1`](https://github.com/namehash/ensnode/commit/fcea8c1fbcc19b3948ecf7d1bef61c38480e8e7d) Thanks [@shrugs](https://github.com/shrugs)! - renamed @ensnode/ponder-schema to @ensnode/ensnode-schema

## 0.26.0

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.1

## 0.22.0

## 0.21.0

## 0.20.0

## 0.19.4

## 0.19.3

## 0.19.2

## 0.19.1

## 0.19.0

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

## 0.1.0

### Minor Changes

- 6941f0b: Initial Release

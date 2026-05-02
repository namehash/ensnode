# @ensnode/integration-test-env

## 1.11.0

### Minor Changes

- [#1997](https://github.com/namehash/ensnode/pull/1997) [`0aa0c5a`](https://github.com/namehash/ensnode/commit/0aa0c5ac7a5636ccdd685de96c9f9f1312a2021b) Thanks [@tk-o](https://github.com/tk-o)! - Introduced `IndexingMetadataContext` data model, a single record type in ENSNode Metadata table replacing three separate record types (`ensdb_version`, `ensindexer_public_config`, `ensindexer_indexing_status`). Also, consolidated startup init into `initIndexingOnchainEvents()` for reliable execution on every ENSIndexer startup.

  **ensnode-sdk**: `EnsIndexerStackInfo` added as base type, `EnsNodeStackInfo` refactored to extend it.

  **ensdb-sdk**: For `EnsDbReader`, added following method: `getIndexingMetadataContext()`, `isHealthy()`, `isReady()`. For `EnsDbWriter`, added `upsertIndexingMetadataContext()` method. Old per-record read/write methods removed. `EnsNodeMetadataKeys` reduced to single `IndexingMetadataContext` key.

  **ensindexer**: `IndexingMetadataContextBuilder` and `StackInfoBuilder` added. `EnsDbWriterWorker` simplified to single recurring task. HTTP `/config` and `/indexing-status` endpoints now read from in-memory builders instead of ENSDb. `initializeIndexingSetup`/`initializeIndexingActivation` replaced by `initIndexingOnchainEvents`.

  **ensapi**: `indexing-status.cache` and `stack-info.cache` updated to consume `IndexingMetadataContext`. Config schema updated to fetch `EnsIndexerPublicConfig` from `EnsNodeStackInfo`.

  **integration-test-env**: `pollIndexingStatus` updated to use `getIndexingMetadataContext()`.

### Patch Changes

- [#1965](https://github.com/namehash/ensnode/pull/1965) [`3facf20`](https://github.com/namehash/ensnode/commit/3facf206d7cb144593257cc9cd4e98059e29d792) Thanks [@sevenzing](https://github.com/sevenzing)! - Moved docker-compose.yml file to separate `docker` directory, updates docs and cicd-tests

- Updated dependencies [[`0d8a4b4`](https://github.com/namehash/ensnode/commit/0d8a4b4b7c8c70be904652e2132e7c67fd9e39ef), [`0aa0c5a`](https://github.com/namehash/ensnode/commit/0aa0c5ac7a5636ccdd685de96c9f9f1312a2021b), [`43d8a9b`](https://github.com/namehash/ensnode/commit/43d8a9b838b15719f520cd3f3bbfd1b52a4ad1ce), [`824d819`](https://github.com/namehash/ensnode/commit/824d819d291b2b642d2664d09cb10d6de69a6ea7), [`7e77c5c`](https://github.com/namehash/ensnode/commit/7e77c5c2bef96d1a2eb363871fb87379b5f6f7e9), [`6173160`](https://github.com/namehash/ensnode/commit/61731608632f62139496656f6231210f63383f20), [`0d8a4b4`](https://github.com/namehash/ensnode/commit/0d8a4b4b7c8c70be904652e2132e7c67fd9e39ef), [`0d64d9e`](https://github.com/namehash/ensnode/commit/0d64d9e0c97c48e37f87d2abaaff50ff08df06e4), [`54edf26`](https://github.com/namehash/ensnode/commit/54edf26c15ae9ade9d1a57f1f0195dcd827aad57), [`43d8a9b`](https://github.com/namehash/ensnode/commit/43d8a9b838b15719f520cd3f3bbfd1b52a4ad1ce), [`c186ad8`](https://github.com/namehash/ensnode/commit/c186ad8c0d85c4db8619a436173d7e21f857f689), [`6173160`](https://github.com/namehash/ensnode/commit/61731608632f62139496656f6231210f63383f20)]:
  - @ensnode/ensnode-sdk@1.11.0
  - @ensnode/ensdb-sdk@1.11.0
  - @ensnode/datasources@1.11.0
  - @ensnode/shared-configs@1.11.0

## 1.10.1

### Patch Changes

- Updated dependencies [[`e92fa4d`](https://github.com/namehash/ensnode/commit/e92fa4d28f183b62fb6d9665db3332b43a46f279), [`9d50f64`](https://github.com/namehash/ensnode/commit/9d50f647802fde286dfef2dc23c884801d06b228)]:
  - @ensnode/ensdb-sdk@1.10.1
  - @ensnode/ensnode-sdk@1.10.1
  - @ensnode/datasources@1.10.1
  - @ensnode/shared-configs@1.10.1

## 1.10.0

### Patch Changes

- Updated dependencies [[`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`29afaa6`](https://github.com/namehash/ensnode/commit/29afaa6ad8a3f3c8133241cf1a9324980498ded4), [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`7fca45d`](https://github.com/namehash/ensnode/commit/7fca45d09dc6e3456fec2cae0827e9d2c54827a6), [`29fcfc7`](https://github.com/namehash/ensnode/commit/29fcfc7a1ab01c3214b5c16fc0e4a349010e9360), [`5f341e1`](https://github.com/namehash/ensnode/commit/5f341e14420146db772fc01b1b3c0f4e2d4a3cb7), [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`c336c79`](https://github.com/namehash/ensnode/commit/c336c79b08e46ce53caa536ebf6158eba9f3e017), [`fc88ee5`](https://github.com/namehash/ensnode/commit/fc88ee5f910de1a94ce2734776d4a5640f839641), [`4c99177`](https://github.com/namehash/ensnode/commit/4c991777ac13ffd2cc1fb947e5a47bd7733b112b), [`4c51c75`](https://github.com/namehash/ensnode/commit/4c51c75ec8b3807d0aa988618893b2da07e11a83), [`b2481d6`](https://github.com/namehash/ensnode/commit/b2481d6dae6f704493140aa63cd4ad1bfd3e3301), [`9abb302`](https://github.com/namehash/ensnode/commit/9abb30238374f0847a68615827dddafb6dc05dad), [`ed6ee96`](https://github.com/namehash/ensnode/commit/ed6ee9641bfa6f42ddc95955cf8b013c93bf2f4a)]:
  - @ensnode/ensnode-sdk@1.10.0
  - @ensnode/ensdb-sdk@1.10.0
  - @ensnode/datasources@1.10.0
  - @ensnode/shared-configs@1.10.0

## 0.0.3

### Patch Changes

- Updated dependencies [[`70e6f24`](https://github.com/namehash/ensnode/commit/70e6f2475a566135602f4adbcf44df2a6f74e5fd), [`9f52a66`](https://github.com/namehash/ensnode/commit/9f52a662e5828e944210f35d47571661899fc30e), [`aaa471f`](https://github.com/namehash/ensnode/commit/aaa471f0a33d0f96389e706dcaed2b704e2952ea), [`387715e`](https://github.com/namehash/ensnode/commit/387715e1bc4c996c0ae7545bfc78b79149e04f58)]:
  - @ensnode/ensnode-sdk@1.9.0
  - @ensnode/ensdb-sdk@1.9.0
  - @ensnode/datasources@1.9.0

## 0.0.2

### Patch Changes

- Updated dependencies []:
  - @ensnode/datasources@1.8.1
  - @ensnode/ensnode-sdk@1.8.1

## 0.0.1

### Patch Changes

- Updated dependencies [[`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772), [`9ea8580`](https://github.com/namehash/ensnode/commit/9ea858055109eaf3a92d210f2b3d9170232a32e8)]:
  - @ensnode/ensnode-sdk@1.8.0
  - @ensnode/datasources@1.8.0

---
"@ensnode/integration-test-env": minor
"@ensnode/ensnode-sdk": minor
"@ensnode/ensdb-sdk": minor
"ensindexer": minor
"ensapi": minor
---

Introduced `IndexingMetadataContext` data model, a single record type in ENSNode Metadata table replacing three separate record types (`ensdb_version`, `ensindexer_public_config`, `ensindexer_indexing_status`). Also, consolidated startup  init into `initIndexingOnchainEvents()` for reliable execution on every ENSIndexer startup.

**ensnode-sdk**: `EnsIndexerStackInfo` added as base type, `EnsNodeStackInfo` refactored to extend it.

**ensdb-sdk**: For `EnsDbReader`, added following method: `getIndexingMetadataContext()`, `isHealthy()`, `isReady()`. For `EnsDbWriter`, added `upsertIndexingMetadataContext()` method. Old per-record read/write methods removed. `EnsNodeMetadataKeys` reduced to single `IndexingMetadataContext` key.

**ensindexer**: `IndexingMetadataContextBuilder` and `StackInfoBuilder` added. `EnsDbWriterWorker` simplified to single recurring task. HTTP `/config` and `/indexing-status` endpoints now read from in-memory builders instead of ENSDb. `initializeIndexingSetup`/`initializeIndexingActivation` replaced by `initIndexingOnchainEvents`.

**ensapi**: `indexing-status.cache` and `stack-info.cache` updated to consume `IndexingMetadataContext`. Config schema updated to fetch `EnsIndexerPublicConfig` from `EnsNodeStackInfo`.

**integration-test-env**: `pollIndexingStatus` updated to use `getIndexingMetadataContext()`.

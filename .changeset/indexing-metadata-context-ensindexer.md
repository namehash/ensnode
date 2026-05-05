---
"ensindexer": minor
---

Consolidated startup init into `initIndexingOnchainEvents()` for reliable execution on every ENSIndexer startup. Added `IndexingMetadataContextBuilder` and `StackInfoBuilder`. `EnsDbWriterWorker` simplified to a single recurring task. The HTTP `/config` and `/indexing-status` endpoints now read from in-memory builders instead of ENSDb. `initializeIndexingSetup` / `initializeIndexingActivation` replaced by `initIndexingOnchainEvents`.

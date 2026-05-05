---
"@ensnode/ensdb-sdk": minor
---

Introduced `IndexingMetadataContext` as a single record type in the ENSNode Metadata table, replacing three separate record types (`ensdb_version`, `ensindexer_public_config`, `ensindexer_indexing_status`).

- `EnsDbReader`: added `getIndexingMetadataContext()`, `isHealthy()`, `isReady()`.
- `EnsDbWriter`: added `upsertIndexingMetadataContext()`.
- Old per-record read/write methods removed.
- `EnsNodeMetadataKeys` reduced to a single `IndexingMetadataContext` key.

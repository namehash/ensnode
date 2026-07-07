---
"@ensnode/ensdb-sdk": minor
---

Add public schema and ENSNode metadata helpers. `EnsDbReader` now exposes `schemaExists(schemaName)` and a public, typed `getEnsNodeMetadata({ key })` that returns the full `{ key, value }` record. `EnsDbWriter` now exposes `dropSchema(schemaName)`, `renameSchema(from, to)`, and a public `writeEnsNodeMetadata(metadata)` that re-keys a `SerializedEnsNodeMetadata` record to the writer's ENSIndexer schema. `SerializedEnsNodeMetadata` is now re-exported from the package entrypoint.

---
"@ensnode/ensnode-sdk": minor
"ensapi": patch
"ensindexer": patch
---

Added `replaceBigInts` (sourced from `@ponder/utils`) and `toJson` helpers to `@ensnode/ensnode-sdk`. `toJson` now takes an options object (`{ pretty?: boolean }`) with `pretty` defaulting to `false` — pass `{ pretty: true }` for indented output. Migrated all in-repo call sites and dropped the `@ponder/utils` dependency from `ensapi`.

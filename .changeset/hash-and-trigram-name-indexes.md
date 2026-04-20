---
"ensindexer": minor
"@ensnode/ensdb-sdk": minor
---

Re-enable `subgraph_domain.name` indexes (originally disabled in #1819) by pairing a hash index for exact-match lookups with a GIN trigram index (`gin_trgm_ops`) for partial-match filters (`_contains`, `_starts_with`, `_ends_with`). The hash index avoids the btree 8191-byte row size limit triggered by spam names. The trigram index requires the `pg_trgm` Postgres extension, which ENSIndexer now installs automatically via a Drizzle migration (`0001_enable_ext_pg_trgm.sql`) that runs before Ponder starts.

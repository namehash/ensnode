---
"@ensnode/ensdb-sdk": patch
"ensindexer": patch
"ensapi": patch
---

Add a materialized `domains.__canonical_name_prefix` column — the first 64 code points of `canonical_name` — to back left-anchored / substring search and NAME ordering. Direct-SQL consumers can now `WHERE __canonical_name_prefix LIKE 'vit%' ORDER BY __canonical_name_prefix` instead of replicating the previous `left(canonical_name, 256)` expression index. `canonical_name` is unchanged and remains the column for exact (`=` / `IN`) matches and display; the Omnigraph `name.starts_with` filter now targets the prefix column while continuing to return `canonical_name`. Reindex required.

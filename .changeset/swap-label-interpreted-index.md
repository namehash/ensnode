---
"@ensnode/ensdb-sdk": patch
---

Replace the default btree index on `label.interpreted` with a hash index (for exact-match lookups) and a GIN trigram index (for substring / prefix `LIKE` queries). Avoids the btree 8191-byte leaf-size hazard that surfaces when a single label exceeds the limit (e.g. spam names), which previously crashed `create_indexes` at the historical→realtime boundary.

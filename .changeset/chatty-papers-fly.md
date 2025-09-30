---
"ensindexer": minor
---

Introduces new `SUBGRAPH_COMPAT` flag (default false) to configure ENSIndexer's subgraph-compatible indexing behavior and removes the `HEAL_REVERSE_ADDRESSES`, `INDEX_ADDITIONAL_RESOLVER_RECORDS`, and `REPLACE_UNNORMALIZED` configuration flags.

If `SUBGRAPH_COMPAT=true`, the following default configuration is provided:
- `PLUGINS=subgraph`
- `LABEL_SET_ID=subgraph`
- `LABEL_SET_VERSION=0`

If `SUBGRAPH_COMPAT=false` (default behavior), the following default configuration is provided:
- `PLUGINS=subgraph,basenames,lineanames,threedns`
- `LABEL_SET_ID=subgraph`
- `LABEL_SET_VERSION=0`

To continue runnning ENSIndexer with legacy ENS Subgraph indexing behavior, use `SUBGRAPH_COMPAT=true` in place of `HEAL_REVERSE_ADDRESSES=false INDEX_ADDITIONAL_RESOLVER_RECORDS=false REPLACE_UNNORMALIZED=false`.

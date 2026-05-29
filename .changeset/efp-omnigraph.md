---
"ensapi": minor
"enssdk": minor
---

Expose EFP (Ethereum Follow Protocol) data through the Omnigraph API under a single `efp` root field. The `EfpQuery` namespace provides `list` / `lists`, `listRecords`, `accountMetadata` / `accountMetadatas`, and `listPointers` (the `eth.efp.list` ENS↔list correlation), with cursor-paginated connections and where-filters (owner/user/manager, recordData, address, node/listTokenId). Requires the `efp` plugin to be enabled on the indexer.

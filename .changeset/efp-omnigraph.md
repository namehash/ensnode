---
"ensapi": minor
"enssdk": minor
---

Expose EFP (Ethereum Follow Protocol) data through the Omnigraph API under a single `efp` root field. The `EfpQuery` namespace provides `list` / `lists`, `listRecords` (with each record's owning `list`), `accountMetadata` / `accountMetadatas`, and `primaryList` (an account's validated primary list, applying the EFP two-step user-role check), with cursor-paginated connections and where-filters (owner/user/manager, recordData, address). Requires the `efp` plugin to be enabled on the indexer.

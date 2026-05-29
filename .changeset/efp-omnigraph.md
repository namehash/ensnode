---
"ensapi": minor
"enssdk": minor
---

Expose EFP (Ethereum Follow Protocol) data through the Omnigraph API under a single `efp` root field. The `EfpQuery` namespace provides `list` / `lists`, `listRecords` (with each record's owning `list`), `accountMetadata` / `accountMetadatas`, and `primaryList` (an account's validated primary list, applying the EFP two-step user-role check), with cursor-paginated connections and where-filters (owner/user/manager, recordData, address). EFP is also reachable from the ENS graph: `Account.efp` exposes an account's validated `primaryList` and the `lists` it is the `user` of, and `EfpListRecord.account` resolves a record's target address to its `Account`, so one query can walk from an account to whom it follows and on into their ENS names and EFP lists. Requires the `efp` plugin to be enabled on the indexer.

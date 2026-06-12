---
"ensapi": minor
"enssdk": minor
---

Expose EFP (Ethereum Follow Protocol) data through the Omnigraph API. Protocol-rooted queries live under a single nullable `efp` root field (`Query.efp`, null when the indexer lacks the `efp` plugin): the `EfpQuery` namespace provides `list(by:)`, `lists(where:)`, and `listRecords(where:)` (each record exposing its owning `list`), with cursor-paginated connections and where-filters (owner/user/manager, recordData). Account-rooted EFP data hangs off the ENS graph via the nullable `Account.efp`: an account's validated `primaryList` (applying the EFP two-step user-role check), the `lists` it is the `user` of, and its account `metadata(key:)` / `metadatas`. `EfpListRecord.account` links a record to the `Account` it points at. List NFT token ids are surfaced through a dedicated `TokenId` scalar (a uint256, serialized as a decimal string), and the shared EFP id helpers are published from `enssdk/efp`. Requires the `efp` plugin to be enabled on the indexer.

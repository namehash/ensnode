---
"ensapi": minor
"enssdk": minor
---

Exposes EFP (Ethereum Follow Protocol) data through the Omnigraph API.

`Query.efp` (null if `efp` plugin is not enabled) exposes the EFP-protocol-level queries `Query.efp.list(by:)`, `Query.efp.lists(where:)`, and `Query.efp.listRecords(where:)` (each record exposing its owning `list`), with cursor-paginated connections and where-filters (owner/user/manager, recordData).

`Account.efp` (null if `efp` plugin is not enabled) exposes the Account-specific queries `Account.efp.primaryList`, `Account.efp.following` / `Account.efp.followers` (the validated social follow graph — accounts whose validated primary list follows, or is followed by, this account, excluding `block`/`mute`-tagged records), the `Account.efp.lists` it is the `user` of, and its account `Account.efp.metadata(key:)` / `Account.efp.metadatas`.

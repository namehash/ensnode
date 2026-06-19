---
"ensskills": minor
---

Adds an `efp-protocol` skill orienting agents on the Ethereum Follow Protocol: the onchain social graph data model (lists, list records, tags, storage locations, account metadata), primary-list validation, `block`/`mute` follower semantics, and how EFP surfaces in the Omnigraph via `query.efp` / `Account.efp`. The `omnigraph` skill now declares `efp-protocol` as a conditional dependency, to be loaded when a query touches EFP fields.

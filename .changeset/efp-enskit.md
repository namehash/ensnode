---
"enskit": minor
---

Adds urql cache key resolvers for the EFP (Ethereum Follow Protocol) Omnigraph types (`EfpList` keyed by `tokenId`; `AccountEfp`, `EfpQuery`, and `EfpListStorageLocation` as Embedded Data), and a `by tokenId` lookup resolver on `EfpQuery.list` so repeat list lookups are cache hits.

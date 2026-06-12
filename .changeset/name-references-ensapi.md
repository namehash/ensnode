---
"ensapi": minor
---

Add `Account.nameReferences` to the Omnigraph API: a cursor-paginated connection over the new `NameReference` type surfacing the Names whose indexed `addr()` record points at an Account ("names pointing to this address"), optionally scoped to a single `CoinType` via `where: { coinType }`. Each `NameReference` exposes the canonical `domain`, the matching `coinType`, the `resolver` holding the record, and `match` (whether ENSIP-19 reverse resolution of the address resolves back to that exact name). Reflects literally-indexed, canonical Domains only — records whose node has no canonical Domain are omitted, and Forward Resolution / CCIP-Read and ENSIP-19 default-address-record expansion are not applied.

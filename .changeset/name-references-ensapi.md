---
"ensapi": minor
---

**Omnigraph API**: Adds `Account.nameReferences`, surfacing the Names whose indexed `addr()` record points at the Account, optionally scoped to a single `CoinType` via `where: { coinType }`. Reflects literally-indexed, Canonical Domains only: records whose node has no canonical Domain are omitted, and Forward Resolution / CCIP-Read and ENSIP-19 address record defaulting are not applied.

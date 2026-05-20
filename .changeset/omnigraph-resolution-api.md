---
"ensapi": patch
---

**Omnigraph**: add live ENS resolution fields — `Domain.records` for forward resolution (texts, addresses, contenthash, pubkey, ABI, interfaces, and related record types) and `Account.primaryNames` for ENSIP-19 multichain primary names. Record types to resolve are selected via the GraphQL field selection on `records`; both fields accept an optional `disableAcceleration` argument.

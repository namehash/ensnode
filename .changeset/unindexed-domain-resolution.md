---
"ensapi": patch
---

**Omnigraph API** — Resolvable-but-unindexed Domains & Accounts (off-chain / CCIP-Read names, unindexed 3DNS names, wildcard subnames) are now resolvable via `Query.domain(by: { name })` and `Query.account(by: { address })`, instead of returning `null`. This is supported by an additional concept, the `UnindexedDomain`, which expands the possible concrete types of the `Domain` interface.

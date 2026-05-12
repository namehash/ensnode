---
"ensindexer": minor
"ensapi": minor
"@ensnode/ensdb-sdk": minor
"@ensnode/ensnode-sdk": patch
---

**Materialize `Domain.canonicalName`, `canonicalLabelHashPath`, and `canonicalNode`** on every Canonical Domain, maintained synchronously by `canonicality-db-helpers.ts` during domain creation, canonicality flips, and label heals. Indexes: hash on `canonicalName` (exact lookup), GIN trigram on `canonicalName` (substring), GIN on `canonicalLabelHashPath` (heal cascade), hash on `canonicalNode` (resolver-record joins).

**Omnigraph (breaking)**: restructure `Domain.canonical` into a nullable `DomainCanonical` object. Removes top-level `Domain.canonical: Boolean!`, `Domain.name: InterpretedName`, and `Domain.path: [DomainInterface]`; adds `Domain.canonical: DomainCanonical` (null when the Domain is not Canonical) with subfields `{ name: InterpretedName!, path: [DomainId!]!, node: Node! }`. `Domain.canonical.path` now returns DomainIds instead of nested Domain objects.

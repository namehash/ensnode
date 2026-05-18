---
"ensapi": minor
---

**Omnigraph (breaking)**: restructure `Domain.canonical` into a nullable `DomainCanonical` object. Removes top-level `Domain.canonical: Boolean!`, `Domain.name: InterpretedName`, and `Domain.path: [DomainInterface]`; adds `Domain.canonical: DomainCanonical` (null when the Domain is not Canonical) with subfields `{ name: InterpretedName!, path: [Domain!]!, node: Node! }`.

**Omnigraph (semantic change)**: `Domain.parent` now follows a single unidirectional pointer (`Registry.canonicalDomainId`) and does NOT enforce bidirectional canonical-edge agreement. Previously, `parent` was effectively null for non-canonical Domains and always pointed at a canonical Domain when non-null. With this change, a non-canonical Domain may have a non-null `parent`, and a canonical Domain's `parent` may itself be non-canonical. Consumers that relied on `parent ⇒ canonical` should additionally check `domain.canonical`.

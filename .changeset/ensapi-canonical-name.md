---
"ensapi": minor
---

**Omnigraph (breaking)**: restructure `Domain.canonical` into a nullable `DomainCanonical` object. Removes top-level `Domain.canonical: Boolean!`, `Domain.name: InterpretedName`, and `Domain.path: [DomainInterface]`; adds `Domain.canonical: DomainCanonical` (null when the Domain is not Canonical) with subfields `{ name: InterpretedName!, path: [Domain!]!, node: Node! }`.

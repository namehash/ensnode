---
"ensapi": minor
---

**Omnigraph (breaking)**: `Domain.resolver` is now a non-null `DomainResolver` wrapper exposing `Domain.resolver.assigned: Resolver` (replacing the previous flat `Domain.resolver: Resolver`). The wrapper leaves room for future fields (e.g. `effective`) describing the Domain's resolution graph. Semantics of `assigned` are unchanged — it remains the Domain's _assigned_ Resolver, not its _effective_ Resolver.

**Omnigraph (breaking)**: `DomainCanonical.name` is now a non-null `CanonicalName` wrapper exposing `DomainCanonical.name.interpreted: InterpretedName` (replacing the previous flat `DomainCanonical.name: InterpretedName`). The wrapper leaves room for additional representations (e.g. a future `beautified` field).

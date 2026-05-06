---
"ensapi": minor
---

**Omnigraph**: expose `Domain.canonical` and `Registry.canonical` on the Omnigraph schema. Both are non-null `Boolean!` fields indicating whether the entity participates in the Canonical Nametree.

Canonicality describes nameability, not addressability or resolvability — both the ENSv1 and ENSv2 Root Registries are canonical, so ENSv1 Domains remain canonical even after ENSv2 is deployed and continue to surface a `Domain.name` and `Domain.path`. Forward Resolution still prefers the ENSv2 namegraph when both exist.

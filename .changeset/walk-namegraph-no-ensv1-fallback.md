---
"ensapi": patch
---

The Omnigraph namegraph walk (`domain(by: name)` and related Name→Domain lookups) no longer falls back to the ENSv1 disjoint namegraph when the ENSv2 Root walk fails to exact-match. UniversalResolverV2 has no registry-level ENSv1 fallback — its only ENSv1 fallback is the `ENSV1Resolver` (a mirror Resolver) set within the ENSv2 namegraph on reserved entries, which the walk already follows. A name present only in ENSv1 and not reserved in ENSv2 is therefore not resolvable under UR2, so the walk no longer addresses it as vestigial ENSv1 state.

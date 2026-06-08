---
"enssdk": patch
---

Adds the `ResolvableName` branded type with `isResolvableName`/`asResolvableName` guards — an `InterpretedName` that can be DNS-encoded and resolved (no Encoded LabelHash segments, every label under 256 bytes). Also adds the `UnindexedDomainId` type and `makeUnindexedDomainId`; `DomainId` now includes `UnindexedDomainId`.

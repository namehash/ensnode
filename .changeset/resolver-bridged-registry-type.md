---
"ensapi": minor
---

**Omnigraph (breaking)**: `Resolver.bridged` now returns the bridged target `Registry` (resolved by id) instead of an `AccountId` scalar. Consumers selecting `bridged { ... }` now get the full `Registry` interface and can navigate into the bridged sub-registry's canonical Domain etc.; consumers reading `bridged` as an `AccountId` shape will need to update their selection.

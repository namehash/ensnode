---
"ensapi": minor
---

**Omnigraph (breaking)**: `Resolver.bridged` is no longer an `AccountId` scalar; it now returns the bridged target `Registry` interface. Consumers should change their selection from `bridged` (scalar) to `bridged { ... }` (Registry interface) — the new shape exposes the full `Registry` and allows navigation into the bridged sub-registry's canonical Domain etc.

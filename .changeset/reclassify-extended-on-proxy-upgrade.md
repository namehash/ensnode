---
"ensindexer": patch
---

ENSIndexer now re-derives a Resolver's ENSIP-10 `IExtendedResolver` support when a known proxy Resolver emits an EIP-1967 `Upgraded` event, instead of fixing the value once at first visibility. Proxy Resolvers that activate `IExtendedResolver` via a post-assignment upgrade (e.g. the 3DNS Resolver behind `.box`) were stuck `extended = false` forever, silently breaking wildcard resolution for affected names.

---
"@ensnode/datasources": patch
"ensindexer": patch
---

ENSIndexer now re-classifies a Resolver's `extended` (ENSIP-10 `IExtendedResolver`) support when a known proxy Resolver emits an EIP-1967 `Upgraded` event, instead of fixing the value once at first visibility. Proxy Resolvers that activate `IExtendedResolver` via a post-assignment upgrade (e.g. the 3DNS Resolver behind `.box`) were stuck `extended = false` forever, silently breaking wildcard resolution for affected names (`mystery.box` returned `null`). The Protocol Acceleration plugin now watches the 3DNS Resolver's `Upgraded` events and re-runs the `supportsInterface` probe against the new implementation. Fixes #2275.

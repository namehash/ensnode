---
"@ensnode/ensdb-sdk": patch
"ensindexer": patch
"ensapi": patch
---

The `resolvers` table gains an `is_extended` column — whether the Resolver implements ENSIP-10 wildcard resolution (`IExtendedResolver`, interfaceId `0x9061b923`) — populated at index time via a single cached `supportsInterface` RPC. The Omnigraph API exposes it as a new `Resolver.extended: Boolean!` field.

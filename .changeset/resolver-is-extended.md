---
"@ensnode/ensdb-sdk": patch
"ensindexer": patch
"ensapi": patch
---

The `resolvers` table's `extended` column is renamed to `is_extended` (Drizzle property `isExtended`). The Omnigraph API now exposes this as a new `Resolver.extended: Boolean!` field — whether the Resolver implements ENSIP-10 wildcard resolution (`IExtendedResolver`, interfaceId `0x9061b923`).

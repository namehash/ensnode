---
"@ensnode/ensdb-sdk": minor
"@ensnode/ensnode-sdk": minor
"ensindexer": minor
"ensapi": minor
"enssdk": minor
---

Resolution API: support `contenthash`, `pubkey`, `abi`, `interfaces`, `dnszonehash`, and `version` selection. Protocol acceleration indexes `contenthash`, `pubkey`, `dnszonehash`, and handles `VersionChanged` (clears records for the node, bumps version). `ABI` (bitmask query, contract-equivalent) and `interface` records are selectable but always resolved via RPC. Adds `ContentType` / `InterfaceId` / `RecordVersion` semantic types to `enssdk`.

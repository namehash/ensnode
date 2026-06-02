---
"@ensnode/datasources": minor
"@ensnode/ensdb-sdk": minor
"@ensnode/ensnode-sdk": minor
"ensindexer": minor
---

Add an EFP (Ethereum Follow Protocol) indexer plugin. Enable it by including `efp` in the `PLUGINS` environment variable (on the `mainnet` ENS namespace, or the `ens-test-env` devnet) to index EFP list NFTs, records, tags, and account metadata into ENSDb's `efp_*` tables.

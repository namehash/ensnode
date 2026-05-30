---
"ensindexer": minor
---

ENSIndexer now supports tuning Ponder's `eth_getLogs` block range per chain. Set `ETH_GET_LOGS_BLOCK_RANGE` to apply a default cap across all chains, or `ETH_GET_LOGS_BLOCK_RANGE_<chainId>` to override it for a specific chain (use `0` to opt a chain out and let Ponder auto-determine its range). This makes it easy to work with RPC providers that require a smaller `eth_getLogs` window. Like RPC connection settings, these are performance-only knobs: changing them does not affect indexed data and does not trigger a re-index.

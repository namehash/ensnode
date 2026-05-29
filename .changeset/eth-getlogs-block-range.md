---
"ensindexer": minor
---

Add a per-chain `ETH_GET_LOGS_BLOCK_RANGE_<chainId>` environment variable (analogous to `RPC_URL_<chainId>`) that overrides Ponder's auto-determined `eth_getLogs` block range for a specific chain. This is useful for RPC providers that reject Ponder's default range. Like RPC connection settings, it is a performance-only knob: changing it does not affect indexed data and does not trigger a re-index.

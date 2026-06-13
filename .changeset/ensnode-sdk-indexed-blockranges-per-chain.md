---
"@ensnode/ensnode-sdk": minor
---

`buildIndexedBlockranges` now takes a per-chain end-block map (`ReadonlyMap<ChainId, number>`) instead of a single global end block, supporting ENSIndexer's per-chain `END_BLOCK_<chainId>` configuration.

---
"@ensnode/ensnode-sdk": minor
---

`buildIndexedBlockranges` now accepts a `chainEndBlocks: ReadonlyMap<ChainId, number>` (per-chain end blocks via `END_BLOCK_<chainId>`) instead of a single `globalBlockrangeEndBlock: number | undefined`. The chain's end block now caps each contract's indexed range, mirroring the Ponder config path.

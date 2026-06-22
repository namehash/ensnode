---
"ensindexer": minor
---

Replace the global `START_BLOCK`/`END_BLOCK` indexing-range configuration with per-chain end blocks via `END_BLOCK_<chainId>` environment variables (e.g. `END_BLOCK_1`, `END_BLOCK_8453`). Each constrains the indexing end block of its chain independently and MAY be set across any number of indexed chains. This enables deterministic, reproducible multichain checkpoints where every indexed chain stops at a block corresponding to a shared timestamp.

---
"@ensnode/ensnode-sdk": patch
---

`buildIndexedBlockranges` now skips contracts whose `address` is the zero address. These exist in some namespaces purely as typesystem placeholders for plugin-required datasource fields and are not actually indexed by Ponder; including their `startBlock: 0` was incorrectly dragging the chain's indexed blockrange lower bound to `0`, which propagated into `ChainIndexingStatusSnapshot` and produced repeated `latestIndexedBlock must be before or same as backfillEndBlock` validation errors during backfill.

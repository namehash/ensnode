---
"ensindexer": patch
---

ENSIndexer: fix crash on startup after crash recovery when one or more chains were in Queued status pre-crash. The omnichain status snapshot builder now promotes such chains to Backfill once other chains' progress has advanced past their `startBlock` timestamp, instead of failing the `omnichainIndexingCursor < earliestQueuedStartBlock` invariant.

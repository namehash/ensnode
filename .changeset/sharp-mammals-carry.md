---
"ensapi": patch
---

Use `slowestChainIndexingCursor` from indexing status as the aggregated referrer metrics cache `updatedAt` timestamp instead of current system time. This ensures the timestamp accurately reflects the indexer state rather than the current system time, preventing issues with clock skew between systems.

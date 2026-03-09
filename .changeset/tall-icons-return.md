---
"ensapi": patch
---

Fix non-deterministic ordering of registrar actions when multiple actions share the same block timestamp by sorting on `id` (Ponder checkpoint) instead of `timestamp`.

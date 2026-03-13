---
"ensapi": patch
---

Fix inconsistent ordering of registrar actions by sorting on the constant-length Ponder checkpoint `id` field (lexicographic = chronological order) instead of timestamp alone.

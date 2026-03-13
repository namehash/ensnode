---
"ensapi": patch
"@namehash/ens-referrals": patch
---

Fix inconsistent ordering of registrar actions by sorting on the constant-length Ponder checkpoint `id` field (lexicographic = chronological). Simplify the rev-share-limit leaderboard race sort the same way and remove the now-unused `compareEventIds` / `resetEncodedEventType` helpers.

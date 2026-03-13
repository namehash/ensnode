---
"@namehash/ens-referrals": patch
---

Simplify rev-share-limit leaderboard race sort to use direct lexicographic comparison of the constant-length Ponder checkpoint `id`, removing the now-unnecessary `compareEventIds` and `resetEncodedEventType` helpers.

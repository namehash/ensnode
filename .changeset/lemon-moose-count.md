---
"ensapi": minor
---

Referral program edition leaderboard caches now check for immutability within the cache builder function. Closed editions past the safety window return cached data without re-fetching.

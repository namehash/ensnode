---
"@ensnode/ensnode-sdk": patch
---

Fix boundary gap in `isRegistrationInGracePeriod`: the grace-period upper bound is now inclusive (`>=`) so that `isRegistrationInGracePeriod` and `isRegistrationFullyExpired` are complementary at `now == expiry + gracePeriod`.

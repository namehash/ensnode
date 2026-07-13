---
"@ensnode/ensnode-sdk": patch
---

Fix grace-period boundary handling in registration expiration helpers: `isRegistrationInGracePeriod` upper bound is now inclusive (`>=`) so it is complementary with `isRegistrationFullyExpired` at `now == expiry + gracePeriod`.

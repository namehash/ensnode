---
"@namehash/ens-referrals": minor
"@ensnode/ensnode-sdk": minor
"ensapi": patch
---

Migrated v1 referrer leaderboard API to use mature `PriceEth` and `PriceUsdc` types from `ensnode-sdk`, replacing temporary `RevenueContribution` and `USDQuantity` types. Added `/v1` subpath export to `ens-referrals`.

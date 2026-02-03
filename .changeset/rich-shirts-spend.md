---
"@namehash/ens-referrals": minor
"@ensnode/ensnode-sdk": minor
"ensapi": patch
---

Flipped dependency relationship between `ensnode-sdk` and `ens-referrals`. Introduced new `ENSReferralsClient` for referral leaderboard APIs. Consolidated duplicate types (`ChainId`, `AccountId`, `UnixTimestamp`, `Duration`) by importing from `ensnode-sdk`.

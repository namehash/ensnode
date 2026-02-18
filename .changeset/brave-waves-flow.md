---
"@namehash/ens-referrals": minor
"ensapi": minor
---

Added `status` field to referral program API responses (`ReferrerLeaderboardPage`, `ReferrerEditionMetricsRanked`, `ReferrerEditionMetricsUnranked`) indicating whether a program is "Scheduled", "Active", or "Closed" based on the program's timing relative to `accurateAsOf`.

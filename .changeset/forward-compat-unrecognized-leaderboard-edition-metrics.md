---
"@namehash/ens-referrals": minor
---

Add client-side forward compatibility for unrecognized leaderboard page and edition metrics award models. When a server returns a newer `awardModel` not known to this client, the deserializers now wrap the response as `ReferrerLeaderboardPageUnrecognized` or `ReferrerEditionMetricsUnrecognized` instead of throwing.

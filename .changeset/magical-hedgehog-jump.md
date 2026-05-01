---
"@namehash/ens-referrals": minor
"ensapi": minor
---

Identify referrers in the ENSAnalytics v1 surface by `AccountId` instead of bare address. Domain types (`ReferrerMetrics`, `RankedReferrer`, `AdminAction`, `ReferralEvent`, leaderboard maps, etc.), JSON wire format, and the `getReferrerMetricsEditions` client now all use `AccountId`. The `GET /v1/ensanalytics/referrer/{referrer}` path param is now a URL-encoded CAIP-10 string (e.g. `eip155%3A1%3A0xabc...`).

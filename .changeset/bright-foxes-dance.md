---
"@namehash/ens-referrals": minor
---

Rename rev-share-limit API fields for clarity: `minQualifiedRevenueContribution` → `minBaseRevenueContribution`, `qualifiedRevenueShare` → `maxBaseRevenueShare`, `standardAwardValue` → `uncappedAwardValue`, `awardPoolApproxValue` → `cappedAwardValue`. Rename `totalAwardPoolValue` → `awardPool` for both rev-share-limit and pie-split rules. Extract the previously hardcoded `BASE_REVENUE_CONTRIBUTION_PER_YEAR` constant into a per-edition `baseAnnualRevenueContribution` rule field.

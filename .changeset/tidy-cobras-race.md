---
"@namehash/ens-referrals": patch
---

Refine internal `ReferrerRaceState` fields in the rev-share-cap race algorithm: rename `totalRevenueContributionAmount`/`cappedAwardAmount`/`wasQualified` to `totalRevenueContribution` (`PriceEth`) / `cappedAward` (`PriceUsdc`) / `hasQualified`, and rewrite the loop body to operate on `Price` objects end-to-end. Extract the repeated `baseAnnualRevenueContribution × (duration / 1 year)` formula into a `calcBaseRevenueContribution` domain helper and apply it at all rev-share-cap call sites.

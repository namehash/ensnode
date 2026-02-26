---
"@namehash/ens-referrals": minor
"ensapi": minor
---

Introduces a pluggable award model architecture for referral program editions. The original Holiday Awards logic is now encapsulated as the `pie-split` model. A new `rev-share-limit` model is added to support the upcoming referral program edition. `ReferralProgramRules` is now a discriminated union over `awardModel`, with an `Unrecognized` variant for forward compatibility — older clients safely skip editions with unknown models rather than crashing.

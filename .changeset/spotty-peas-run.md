---
"@namehash/ens-referrals": minor
"ensapi": minor
---

Rename `BaseReferralProgramRules.subregistryId` to `registryId` everywhere across ENS referrals logic to align with the new ENSv2 terminology. This affects the `ReferralProgramEditionConfig` JSON format consumed via `CUSTOM_REFERRAL_PROGRAM_EDITIONS` and all v1 ENSAnalytics responses that embed referral program rules.

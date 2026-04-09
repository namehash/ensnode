---
"@namehash/ens-referrals": minor
"ensapi": minor
---

Removed the hardcoded "default" referral program edition config set and renamed `CUSTOM_REFERRAL_PROGRAM_EDITIONS` to `REFERRAL_PROGRAM_EDITIONS`. An unset `REFERRAL_PROGRAM_EDITIONS` now means the referral program has zero configured editions, so ENSApi performs no referral-related work against ENSDb. The editions array may also now be empty.

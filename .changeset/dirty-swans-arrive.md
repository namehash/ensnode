---
"@namehash/ens-referrals": minor
"@ensnode/ensnode-sdk": minor
"enssdk": minor
---

Added `Referrer` type to `enssdk` (raw 32-byte onchain referrer bytes). Runtime helpers (`buildEncodedReferrer`, `decodeReferrer` — renamed from `decodeEncodedReferrer`, `ZERO_ENCODED_REFERRER`, and related constants) moved from `@ensnode/ensnode-sdk` to `@namehash/ens-referrals`, which now owns a branded `EncodedReferrer` type returned by `buildEncodedReferrer`. `buildEncodedReferrer` now accepts `Address` (previously `NormalizedAddress`) and normalizes internally.

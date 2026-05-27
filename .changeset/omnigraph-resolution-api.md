---
"ensapi": patch
---

**Omnigraph (breaking)**: replace `Account.primaryNames(chainIds:)` and `PrimaryNameByChain` with `Account.primaryName(by: PrimaryNameByInput!)` and `Account.primaryNames(by: PrimaryNamesByInput)`. Primary name lookups now accept `coinType`/`coinTypes` or `chain`/`chains` via `@oneOf` inputs; `ENSIP19Chain` covers ENSIP-19 supported chains only. `PrimaryNameRecord` exposes `coinType`, `chain`, `name`, wired `records` (chained forward resolution), and a preview `profile` field.

**Omnigraph (additive)**: add types-only `Domain.profile` and shared `DomainProfile` preview types (`ProfileName`, `ProfileAvatar`, `ProfileBanner`, `ProfileWebsite`, `ProfileAddresses`, `ProfileSocials`, etc.). Profile resolution is not wired yet; subfields return null. `Domain.records` is unchanged.

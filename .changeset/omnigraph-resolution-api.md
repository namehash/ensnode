---
"ensapi": patch
---

Changes related to **Omnigraph**:

- add `Domain.records` with raw records resolution (`ResolvedRawTextRecord` for text record values)
- add `Account.primaryName(by: PrimaryNameByInput!)` and `Account.primaryNames(by: PrimaryNamesByInput!)`. Primary name lookups accept `coinType`/`coinTypes` or `chain`/`chains` via `@oneOf` inputs; `PrimaryNameRecord.name` is a `CanonicalName` with `interpreted` and `beautified`
- add types-only `Domain.profile` and shared `DomainProfile` preview types (`ProfileAvatar`, `ProfileBanner`, `ProfileWebsite`, `ProfileAddresses`, `ProfileSocials`, etc.). Profile resolution is not wired yet; subfields return null

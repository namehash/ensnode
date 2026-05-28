---
"ensapi": patch
---

Changes related to **Omnigraph**:

- add `Domain.records` with raw records resolution (`ResolvedRawTextRecord` for text record values)
- add `Account.primaryName(by: PrimaryNameByInput!)` and `Account.primaryNames(where: AccountPrimaryNamesWhereInput!)`. Primary name lookups accept `coinType` or `chain` (singular) and `coinTypes` or `chains` (plural, `@oneOf`); `ENSIP19Chain` includes `DEFAULT`; `PrimaryNameRecord.name` is a `CanonicalName` with `interpreted` and `beautified`
- add `UID` cache keys on `ResolvedRecords` (keyed by resolution `InterpretedName`) for graphcache normalization across queries
- add types-only `Domain.profile` and shared `DomainProfile` preview types (`ProfileAvatar`, `ProfileBanner`, `ProfileWebsite`, `ProfileAddresses`, `ProfileSocials`, etc.). Profile resolution is not wired yet; subfields return null

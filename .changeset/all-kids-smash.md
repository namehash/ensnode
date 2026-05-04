---
"@ensnode/ensrainbow-sdk": minor
"@ensnode/ensnode-sdk": minor
---

**Breaking**: Updated core ENSNode data models.

- `EnsIndexerPublicConfig`
  - Renamed `labelSet` field to `clientLabelSet`.
- `EnsRainbowApiClientOptions`
  - Renamed `labelSet` field to `clientLabelSet`.
- `EnsRainbowPublicConfig`
  - Replaced `version: string` field with `versionInfo: EnsRainbowVersionInfo`.
  - Renamed `labelSet` field to `serverLabelSet`.
  - Removed `recordsCount` field from `EnsRainbowPublicConfig`.

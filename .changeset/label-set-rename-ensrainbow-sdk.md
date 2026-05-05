---
"@ensnode/ensrainbow-sdk": minor
---

**Breaking**: Updated core data models.

- `EnsRainbowApiClientOptions`: renamed `labelSet` → `clientLabelSet`.
- `EnsRainbowPublicConfig`:
  - Replaced `version: string` with `versionInfo: EnsRainbowVersionInfo`.
  - Renamed `labelSet` → `serverLabelSet`.
  - Removed `recordsCount`.

---
"@ensnode/ensnode-sdk": patch
"@ensnode/ensrainbow-sdk": patch
---

`EnsRainbowApiClient.heal()` now accepts labelhashes in any common format — with or without a `0x` prefix, uppercase hex characters, bracket-enclosed encoded labelhashes, or odd-length hex strings — and normalizes them automatically. Invalid inputs return a `HealBadRequestError` rather than throwing.

The underlying normalization utilities (`parseLabelHash`, `parseEncodedLabelHash`, `parseLabelHashOrEncodedLabelHash`) are also exported from `@ensnode/ensnode-sdk` for use in other contexts.

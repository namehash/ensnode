---
"@ensnode/ensnode-sdk": minor
---

Add `subtractPrices`, `minPrices`, and `maxPrices` helpers to `@ensnode/ensnode-sdk` (variadic, parallel to the existing `addPrices`; throw on mismatched currencies; `subtractPrices` additionally throws if the result would be negative).

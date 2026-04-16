---
"enssdk": minor
"@ensnode/ensnode-sdk": minor
---

Migrated core ENS types and utilities from `ensnode-sdk` to `enssdk`:
- `UnixTimestamp` type moved to enssdk
- `normalizeName` function (wraps `@adraffy/ens-normalize`) added; `isNormalizedName`/`isNormalizedLabel` consolidated into `normalization.ts`
- `makeSubdomainNode` moved to enssdk
- `reinterpretLabel`/`reinterpretName` moved to enssdk
- `labelhash` renamed to `labelhashInterpretedLabel` (requires branded `InterpretedLabel` input)
- `namehash` renamed to `namehashInterpretedName` (requires branded `InterpretedName` input)
- Added `asInterpretedLabel`, `asInterpretedName`, `asLiteralLabel` validated cast helpers
- Subregistry managed name functions now return `InterpretedName`
- Removed `@adraffy/ens-normalize` dependency from ensnode-sdk (provided by enssdk)

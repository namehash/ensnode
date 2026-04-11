# enssdk

## 1.10.0

### Minor Changes

- [#1889](https://github.com/namehash/ensnode/pull/1889) [`29fcfc7`](https://github.com/namehash/ensnode/commit/29fcfc7a1ab01c3214b5c16fc0e4a349010e9360) Thanks [@shrugs](https://github.com/shrugs)! - Migrated core ENS types and utilities from `ensnode-sdk` to `enssdk`:

  - `UnixTimestamp` type moved to enssdk
  - `normalizeName` function (wraps `@adraffy/ens-normalize`) added; `isNormalizedName`/`isNormalizedLabel` consolidated into `normalization.ts`
  - `makeSubdomainNode` moved to enssdk
  - `reinterpretLabel`/`reinterpretName` moved to enssdk
  - `labelhash` renamed to `labelhashInterpretedLabel` (requires branded `InterpretedLabel` input)
  - `namehash` renamed to `namehashInterpretedName` (requires branded `InterpretedName` input)
  - Added `asInterpretedLabel`, `asInterpretedName`, `asLiteralLabel` validated cast helpers
  - Subregistry managed name functions now return `InterpretedName`
  - Removed `@adraffy/ens-normalize` dependency from ensnode-sdk (provided by enssdk)

- [#1846](https://github.com/namehash/ensnode/pull/1846) [`677db8b`](https://github.com/namehash/ensnode/commit/677db8b67effc6d530716c0a1902244dba56d787) Thanks [@shrugs](https://github.com/shrugs)! - add core client factory with viem-style extend() and omnigraph module with gql.tada typed queries

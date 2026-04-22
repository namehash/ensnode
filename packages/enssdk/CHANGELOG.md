# enssdk

## 1.10.1

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

- [#1967](https://github.com/namehash/ensnode/pull/1967) [`5f341e1`](https://github.com/namehash/ensnode/commit/5f341e14420146db772fc01b1b3c0f4e2d4a3cb7) Thanks [@shrugs](https://github.com/shrugs)! - Resolution API: support `contenthash`, `pubkey`, `abi`, `interfaces`, `dnszonehash`, and `version` selection. Protocol acceleration indexes `contenthash`, `pubkey`, `dnszonehash`, and handles `VersionChanged` (clears records for the node, bumps version). `ABI` (bitmask query, contract-equivalent) and `interface` records are selectable but always resolved via RPC. Adds `ContentType` / `InterfaceId` / `RecordVersion` semantic types to `enssdk`.

- [#1934](https://github.com/namehash/ensnode/pull/1934) [`b8f5be7`](https://github.com/namehash/ensnode/commit/b8f5be761748f75c06ba4da81dd6098eec6ebb9a) Thanks [@shrugs](https://github.com/shrugs)! - Omnigraph API (BREAKING): Renamed `Resolver.records_` argument from `for` to `by` for consistency with other id lookups.

- [#1846](https://github.com/namehash/ensnode/pull/1846) [`677db8b`](https://github.com/namehash/ensnode/commit/677db8b67effc6d530716c0a1902244dba56d787) Thanks [@shrugs](https://github.com/shrugs)! - add core client factory with viem-style extend() and omnigraph module with gql.tada typed queries

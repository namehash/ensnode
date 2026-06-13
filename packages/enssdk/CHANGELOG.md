# enssdk

## 1.16.0

## 1.15.2

### Patch Changes

- [#2271](https://github.com/namehash/ensnode/pull/2271) [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523) Thanks [@shrugs](https://github.com/shrugs)! - Adds the `ResolvableName` branded type with `isResolvableName`/`asResolvableName` guards — an `InterpretedName` that can be DNS-encoded and resolved (no Encoded LabelHash segments, every label under 256 bytes). Also adds the `UnindexedDomainId` type and `makeUnindexedDomainId`; `DomainId` now includes `UnindexedDomainId`.

## 1.15.1

## 1.15.0

### Minor Changes

- [#2161](https://github.com/namehash/ensnode/pull/2161) [`9c40ef1`](https://github.com/namehash/ensnode/commit/9c40ef12b5c5e8a08aa1659b0626c0b87486a7d1) Thanks [@shrugs](https://github.com/shrugs)! - Add `beautifyInterpretedLabel`, which beautifies a single `InterpretedLabel` per [ENSIP-15](https://docs.ens.domains/ensip/15), preserving Encoded LabelHashes verbatim, and returns the new `BeautifiedLabel` branded type. `beautifyInterpretedName` is now defined in terms of `beautifyInterpretedLabel`.

## 1.14.0

## 1.13.1

## 1.13.0

## 1.12.0

## 1.11.1

## 1.11.0

### Minor Changes

- [#2050](https://github.com/namehash/ensnode/pull/2050) [`92ca54f`](https://github.com/namehash/ensnode/commit/92ca54fa2efbef3f32e2dacd8fdc347ef260a2af) Thanks [@shrugs](https://github.com/shrugs)! - Add `beautifyInterpretedName(name: InterpretedName): BeautifiedName` for converting an InterpretedName into a UI-presentable Name, plus a new `BeautifiedName` nominally-typed alias. Each label is either preserved verbatim (Encoded LabelHashes) or passed through `ens_beautify` (normalized labels), so e.g. `"♾♾♾♾.eth"` renders as `"♾️♾️♾️♾️.eth"`. The branded `BeautifiedName` return type prevents the result from being passed to APIs that expect an `InterpretedName` — continue to use the source InterpretedName for navigation targets and lookups.

- [#2016](https://github.com/namehash/ensnode/pull/2016) [`7e77c5c`](https://github.com/namehash/ensnode/commit/7e77c5c2bef96d1a2eb363871fb87379b5f6f7e9) Thanks [@shrugs](https://github.com/shrugs)! - Switch composite ids to dash-delimited tuples so Ponder's profile-pattern matcher can decompose them and prefetch hot tables.

  Every id constructor (`makeENSv1RegistryId`, `makeENSv2RegistryId`, `makeENSv1VirtualRegistryId`, `makeConcreteRegistryId`, `makeResolverId`, `makeENSv1DomainId`, `makeENSv2DomainId`, `makePermissionsId`, `makePermissionsResourceId`, `makePermissionsUserId`, `makeResolverRecordsId`, `makeRegistrationId`, `makeRenewalId`) now joins its components with `-` instead of CAIP-style mixed `:` / `/` delimiters. `makeENSv2DomainId` no longer wraps the registry contract in CAIP-19 ERC1155 form since the registry already namespaces it. Ponder's matcher only does single-level string-delimiter splits, so the unified `-` tuple is the shape it can decompose to derive prefetch lookup keys from event args.

- [#1983](https://github.com/namehash/ensnode/pull/1983) [`6173160`](https://github.com/namehash/ensnode/commit/61731608632f62139496656f6231210f63383f20) Thanks [@shrugs](https://github.com/shrugs)! - Unify `v1Domain` + `v2Domain` into a single polymorphic `domain` table discriminated by a `type` enum (`"ENSv1Domain"` | `"ENSv2Domain"`), and make Registry polymorphic across concrete ENSv1 (mainnet Registry, Basenames Registry, Lineanames Registry), ENSv1 Virtual (per-parent-domain virtual Registry managed by each ENSv1 domain that has children), and ENSv2 Registries.

  ### Breaking schema + id format changes
  - `ENSv1DomainId` is now a dash-delimited tuple: `${ENSv1RegistryId}-${node}` (was `Node`). Every ENSv1 Domain is addressable through a concrete Registry, so bare `node` values no longer identify a Domain by themselves.
  - `RegistryId` is a union of `ENSv1RegistryId`, `ENSv1VirtualRegistryId`, and `ENSv2RegistryId`. New id constructors: `makeENSv1RegistryId`, `makeENSv2RegistryId`, `makeENSv1VirtualRegistryId`, and `makeConcreteRegistryId` (returns `ENSv1RegistryId | ENSv2RegistryId` for callsites that only need to address a concrete Registry contract). `makeENSv1DomainId` now takes `(AccountId, Node)`.
  - `domains` table: replaces `v1_domains` + `v2_domains`. Adds `type`, nullable `tokenId` (non-null iff ENSv2), nullable `node` (non-null iff ENSv1), nullable `rootRegistryOwnerId` (v1 only). `parentId` removed; parent relationships flow through `registryCanonicalDomain` for both v1 and v2.
  - `registries` table: adds `type` enum column and nullable `node` (non-null iff `ENSv1VirtualRegistry`). Unique `(chainId, address)` index becomes a plain index so virtual Registries can share their concrete parent's `(chainId, address)`.
  - `registryCanonicalDomain.domainId` is typed as the unified `DomainId`.

  ### GraphQL
  - `Registry` becomes a GraphQL interface with `ENSv1Registry`, `ENSv1VirtualRegistry`, and `ENSv2Registry` implementations. `ENSv1VirtualRegistry` exposes `node: Node!`.
  - `Domain` interface gains `parent: Domain` (resolved via the canonical-path dataloader); `ENSv1Domain` exposes `node: Node!` and `rootRegistryOwner`; `ENSv2Domain` exposes `tokenId`, `registry`, `subregistry`, `permissions`.
  - `Query.registry(by: { contract })` now DB-looks up the concrete Registry by `(chainId, address, type IN (ENSv1Registry, ENSv2Registry))`. Virtual Registries are not addressable via `AccountId` alone.

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

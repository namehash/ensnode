# ensapi

## 1.17.0

### Minor Changes

- [#2296](https://github.com/namehash/ensnode/pull/2296) [`6542c89`](https://github.com/namehash/ensnode/commit/6542c89569add9fd315bb1f10a9263f59d52da20) Thanks [@shrugs](https://github.com/shrugs)! - Exposes EFP (Ethereum Follow Protocol) data through the Omnigraph API.

  `Query.efp` (null if `efp` plugin is not enabled) exposes the EFP-protocol-level queries `Query.efp.list(by:)`, `Query.efp.lists(where:)`, and `Query.efp.listRecords(where:)` (each record exposing its owning `list`), with cursor-paginated connections and where-filters (owner/user/manager, recordData).

  `Account.efp` (null if `efp` plugin is not enabled) exposes the Account-specific queries `Account.efp.primaryList`, `Account.efp.following` / `Account.efp.followers` (the validated social follow graph — accounts whose validated primary list follows, or is followed by, this account, excluding `block`/`mute`-tagged records), the `Account.efp.lists` it is the `user` of, and its account `Account.efp.metadata(key:)` / `Account.efp.metadatas`.

### Patch Changes

- Updated dependencies [[`6542c89`](https://github.com/namehash/ensnode/commit/6542c89569add9fd315bb1f10a9263f59d52da20), [`6542c89`](https://github.com/namehash/ensnode/commit/6542c89569add9fd315bb1f10a9263f59d52da20), [`6542c89`](https://github.com/namehash/ensnode/commit/6542c89569add9fd315bb1f10a9263f59d52da20), [`eb33f1d`](https://github.com/namehash/ensnode/commit/eb33f1df137c00d17840bb99ecb072ced49259a6), [`edf120e`](https://github.com/namehash/ensnode/commit/edf120e13980ceccf075dede9f8dbfd10c5353af), [`af444c3`](https://github.com/namehash/ensnode/commit/af444c32a9afa5ed741e8b6dbbeafdfadf90f2ba), [`af444c3`](https://github.com/namehash/ensnode/commit/af444c32a9afa5ed741e8b6dbbeafdfadf90f2ba), [`566cab2`](https://github.com/namehash/ensnode/commit/566cab2e064496c3f248c1f22056a7c7e89f5b14), [`ac07f68`](https://github.com/namehash/ensnode/commit/ac07f6807030386b1a226c84d08523d41a0635e0), [`6abf99b`](https://github.com/namehash/ensnode/commit/6abf99b9bca9a54cef209e2ef32433397efa31dc), [`eaab1bf`](https://github.com/namehash/ensnode/commit/eaab1bffdc0db0f61ccdd06efe0f63aaddf709e3)]:
  - @ensnode/datasources@1.17.0
  - @ensnode/ensdb-sdk@1.17.0
  - enssdk@1.17.0
  - @ensnode/ensnode-sdk@1.17.0
  - @namehash/ens-referrals@1.17.0
  - @ensnode/ponder-subgraph@1.17.0

## 1.16.0

### Minor Changes

- [#2292](https://github.com/namehash/ensnode/pull/2292) [`09b4aa5`](https://github.com/namehash/ensnode/commit/09b4aa5281875c7c3472358fa2bbb7f4991d9429) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph API**: Adds `Account.nameReferences`, surfacing the Names whose indexed `addr()` record points at the Account, optionally scoped to a single `CoinType` via `where: { coinType }`. Reflects literally-indexed, Canonical Domains only: records whose node has no canonical Domain are omitted, and Forward Resolution / CCIP-Read and ENSIP-19 address record defaulting are not applied.

### Patch Changes

- [#2285](https://github.com/namehash/ensnode/pull/2285) [`ba68bbe`](https://github.com/namehash/ensnode/commit/ba68bbea2c9890b62905ad9a624b8021f8884703) Thanks [@sevenzing](https://github.com/sevenzing)! - - Add `Domain.resolve.profile.contenthash` interpretation

- Updated dependencies [[`09b4aa5`](https://github.com/namehash/ensnode/commit/09b4aa5281875c7c3472358fa2bbb7f4991d9429)]:
  - @ensnode/ensdb-sdk@1.16.0
  - @ensnode/ensnode-sdk@1.16.0
  - enssdk@1.16.0
  - @ensnode/datasources@1.16.0
  - @ensnode/ponder-subgraph@1.16.0
  - @namehash/ens-referrals@1.16.0

## 1.15.2

### Patch Changes

- [#2240](https://github.com/namehash/ensnode/pull/2240) [`7d23ee9`](https://github.com/namehash/ensnode/commit/7d23ee94d454c81561e5eedb4032377aab1aaedc) Thanks [@sevenzing](https://github.com/sevenzing)! - **Omnigraph API:** Introduces `Domain.resolve.profile` and `PrimaryNameRecord.resolve.profile` for resolving semantic record values.

- [#2265](https://github.com/namehash/ensnode/pull/2265) [`c6f9643`](https://github.com/namehash/ensnode/commit/c6f9643d0855dff6a69b3055fee010a1bbb30342) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph API:** Adds `DomainResolver.effective`, the Resolver that ENS Forward Resolution (ENSIP-10) lands on for a Domain. Complements the existing `DomainResolver.assigned` (the Domain's directly-assigned Resolver).

- [#2267](https://github.com/namehash/ensnode/pull/2267) [`6165f50`](https://github.com/namehash/ensnode/commit/6165f50e26729c6d740c7424034057642f5175b5) Thanks [@shrugs](https://github.com/shrugs)! - Omnigraph API: Resolution now uses the ENSv2-ready stable UniversalResolver proxy address when not accelerated.

- [#2268](https://github.com/namehash/ensnode/pull/2268) [`ff75f79`](https://github.com/namehash/ensnode/commit/ff75f795680490bf4f6d3c0518a6f3ae2460e6cd) Thanks [@shrugs](https://github.com/shrugs)! - Forward Resolution now fully delegates to the `UniversalResolver` whenever records cannot be accelerated, correctly implementing the [ENSv2-Readiness](https://docs.ens.domains/web/ensv2-readiness/) check for `ur.integration-test.eth`. Unaccelerated requests are always delegated to the `UniversalResolver`.

- [#1974](https://github.com/namehash/ensnode/pull/1974) [`8a86fb4`](https://github.com/namehash/ensnode/commit/8a86fb4ac8b2651efa68b5c94e408f37093eca2d) Thanks [@sevenzing](https://github.com/sevenzing)! - Changes related to **Omnigraph**:
  - add `Domain.resolve { records, trace, acceleration, profile? }` for forward resolution driven by the GraphQL selection set
  - add `Account.resolve { primaryName(by: ...), primaryNames(where: ...) }` for reverse (ENSIP-19 primary name) resolution with `@oneOf` inputs (`coinType`/`chainName`, `coinTypes`/`chainNames`)
  - add `PrimaryNameRecord.resolve { records, ... }` for forward resolution of the resolved primary name

- [#2271](https://github.com/namehash/ensnode/pull/2271) [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523) Thanks [@shrugs](https://github.com/shrugs)! - The `resolvers` table gains an `is_extended` column — whether the Resolver implements ENSIP-10 wildcard resolution (`IExtendedResolver`, interfaceId `0x9061b923`) — populated at index time via a single cached `supportsInterface` RPC. The Omnigraph API exposes it as a new `Resolver.extended: Boolean!` field.

- [#2255](https://github.com/namehash/ensnode/pull/2255) [`c8267e4`](https://github.com/namehash/ensnode/commit/c8267e45099efd62e5690f19437c8aa242f77601) Thanks [@shrugs](https://github.com/shrugs)! - Add a materialized `domains.__canonical_name_prefix` column — the first 64 code points of `canonical_name` — to back left-anchored / substring search and NAME ordering. Direct-SQL consumers can now `WHERE __canonical_name_prefix LIKE 'vit%' ORDER BY __canonical_name_prefix` instead of replicating the previous `left(canonical_name, 256)` expression index. `canonical_name` is unchanged and remains the column for exact (`=` / `IN`) matches and display; the Omnigraph `name.starts_with` filter now targets the prefix column while continuing to return `canonical_name`.

- [#2271](https://github.com/namehash/ensnode/pull/2271) [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph API** — Resolvable-but-unindexed Domains & Accounts (off-chain / CCIP-Read names, unindexed 3DNS names, wildcard subnames) are now resolvable via `Query.domain(by: { name })` and `Query.account(by: { address })`, instead of returning `null`. This is supported by an additional concept, the `UnindexedDomain`, which expands the possible concrete types of the `Domain` interface.

- Updated dependencies [[`0eec193`](https://github.com/namehash/ensnode/commit/0eec19344e576db7021ab4f16c420477efe9cd54), [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523), [`0eec193`](https://github.com/namehash/ensnode/commit/0eec19344e576db7021ab4f16c420477efe9cd54), [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523), [`39cb445`](https://github.com/namehash/ensnode/commit/39cb445b8d8790aa9d6fe2ee904e60bdb158efbd), [`5f929d8`](https://github.com/namehash/ensnode/commit/5f929d858a21e935b4b62ce6f2cbccc273623f96), [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523), [`c8267e4`](https://github.com/namehash/ensnode/commit/c8267e45099efd62e5690f19437c8aa242f77601), [`6165f50`](https://github.com/namehash/ensnode/commit/6165f50e26729c6d740c7424034057642f5175b5)]:
  - @ensnode/datasources@1.15.2
  - @ensnode/ensnode-sdk@1.15.2
  - enssdk@1.15.2
  - @ensnode/ensdb-sdk@1.15.2
  - @namehash/ens-referrals@1.15.2
  - @ensnode/ponder-subgraph@1.15.2

## 1.15.1

### Patch Changes

- Updated dependencies []:
  - enssdk@1.15.1
  - @ensnode/datasources@1.15.1
  - @ensnode/ensdb-sdk@1.15.1
  - @ensnode/ensnode-sdk@1.15.1
  - @ensnode/ponder-subgraph@1.15.1
  - @namehash/ens-referrals@1.15.1

## 1.15.0

### Minor Changes

- [#2161](https://github.com/namehash/ensnode/pull/2161) [`9c40ef1`](https://github.com/namehash/ensnode/commit/9c40ef12b5c5e8a08aa1659b0626c0b87486a7d1) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph**: add `BeautifiedName` and `BeautifiedLabel` scalars, a `CanonicalName.beautified: BeautifiedName!` field, and a `Label.beautified: BeautifiedLabel!` field. These expose the Name/Label beautified per [ENSIP-15](https://docs.ens.domains/ensip/15) for display — continue using `interpreted` for navigation targets and lookup keys.

### Patch Changes

- [#2155](https://github.com/namehash/ensnode/pull/2155) [`addfba6`](https://github.com/namehash/ensnode/commit/addfba696d5135a5433c471d2c9ce4575d165f71) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph**: `AccountDomainsWhereInput.canonical` now filters on both `true` and `false` (previously `false` was a no-op). The `defaultValue: false` is dropped — clients omitting `canonical` will receive all Domains owned by the Account regardless of canonicality. Pass `canonical: true` for canonical-only or `canonical: false` for non-canonical-only. The underlying `DomainsWhere.canonical` in `resolveFindDomains` was generalized so `typeof === "boolean"` triggers the filter; `null`/`undefined` is "no filter".

- Updated dependencies [[`bb0b244`](https://github.com/namehash/ensnode/commit/bb0b244e01b0ef7bba88c5ac5f9052fdddac4000), [`9c40ef1`](https://github.com/namehash/ensnode/commit/9c40ef12b5c5e8a08aa1659b0626c0b87486a7d1), [`addfba6`](https://github.com/namehash/ensnode/commit/addfba696d5135a5433c471d2c9ce4575d165f71), [`335f072`](https://github.com/namehash/ensnode/commit/335f0721459a883f9304a8d23ebc08503916f429)]:
  - @ensnode/ensdb-sdk@1.15.0
  - enssdk@1.15.0
  - @ensnode/ensnode-sdk@1.15.0
  - @ensnode/datasources@1.15.0
  - @namehash/ens-referrals@1.15.0
  - @ensnode/ponder-subgraph@1.15.0

## 1.14.0

### Minor Changes

- [#2101](https://github.com/namehash/ensnode/pull/2101) [`7dd0d3f`](https://github.com/namehash/ensnode/commit/7dd0d3ff2905caf357a74470d5630a9ca8bd3369) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph (breaking)**: `Domain.resolver` is now a non-null `DomainResolver` wrapper exposing `Domain.resolver.assigned: Resolver` (replacing the previous flat `Domain.resolver: Resolver`). The wrapper leaves room for future fields (e.g. `effective`) describing the Domain's resolution graph. Semantics of `assigned` are unchanged — it remains the Domain's _assigned_ Resolver, not its _effective_ Resolver.

  **Omnigraph (breaking)**: `DomainCanonical.name` is now a non-null `CanonicalName` wrapper exposing `DomainCanonical.name.interpreted: InterpretedName` (replacing the previous flat `DomainCanonical.name: InterpretedName`). The wrapper leaves room for additional representations (e.g. a future `beautified` field).

- [#2125](https://github.com/namehash/ensnode/pull/2125) [`f6ef397`](https://github.com/namehash/ensnode/commit/f6ef3977931b68997a40fd47755e0fca8d262093) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph (breaking)**: `where: { name }` on `Query.domains`, `Account.domains`, `Registry.domains`, and `Domain.subdomains` now takes a `DomainsNameFilter` `@oneOf` input with three modes: `starts_with` (prefix autocomplete, the previous behavior), `eq` (exact InterpretedName match — sugar for `in: [eq]`), and `in` (exact match against a set of up to 100 InterpretedNames). The old shape `where: { name: "examp" }` becomes `where: { name: { starts_with: "examp" } }`; for exact lookups use `where: { name: { eq: "vitalik.eth" } }` or `where: { name: { in: ["alice.eth", "bob.eth"] } }`. Combine with `version` to disambiguate across ENS protocol versions (e.g. `{ name: { eq: "eth" }, version: ENSv1 }` returns a single Domain).

- [#2125](https://github.com/namehash/ensnode/pull/2125) [`f6ef397`](https://github.com/namehash/ensnode/commit/f6ef3977931b68997a40fd47755e0fca8d262093) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph**: add `DEPTH` to the `DomainsOrderBy` enum, ordering by the materialized `Domain.canonicalDepth` (number of labels in the Canonical Name). Applies to `Query.domains`, `Account.domains`, `Registry.domains`, and `Domain.subdomains` via `order: { by: DEPTH }`. Also wired in as the default ordering for `where: { name: { starts_with } }` (typeahead).

- [#2101](https://github.com/namehash/ensnode/pull/2101) [`7dd0d3f`](https://github.com/namehash/ensnode/commit/7dd0d3ff2905caf357a74470d5630a9ca8bd3369) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph (breaking)**: restructure `Domain.canonical` into a nullable `DomainCanonical` object. Removes top-level `Domain.canonical: Boolean!`, `Domain.name: InterpretedName`, and `Domain.path: [DomainInterface]`; adds `Domain.canonical: DomainCanonical` (null when the Domain is not Canonical) with subfields `{ name: InterpretedName!, path: [Domain!]!, node: Node! }`.

  **Omnigraph (semantic change)**: `Domain.parent` now follows a single unidirectional pointer (`Registry.canonicalDomainId`) and does NOT enforce bidirectional canonical-edge agreement. Previously, `parent` was effectively null for non-canonical Domains and always pointed at a canonical Domain when non-null. With this change, a non-canonical Domain may have a non-null `parent`, and a canonical Domain's `parent` may itself be non-canonical. Consumers that relied on `parent ⇒ canonical` should additionally check `domain.canonical`.

- [#2126](https://github.com/namehash/ensnode/pull/2126) [`26dc2da`](https://github.com/namehash/ensnode/commit/26dc2da878d7a5979603cc204ccedcc7800e8af6) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph (breaking)**: filter args on `*.events` and `*.permissions` connections now use operator-based inputs. `EventsWhereInput`/`AccountEventsWhereInput`: `selector_in: [Hex]` → `selector: { eq | in }`, `timestamp_gte`/`timestamp_lte` → `timestamp: { gt?, gte?, lt?, lte? }`, `from`/`sender` → `{ eq | in }`. `DomainPermissionsWhereInput.user` → `{ eq | in }`. `Account.permissions(in: AccountIdInput)` → `Account.permissions(where: { contract: AccountIdInput })`. Set-membership `in` is capped at 10 items; timestamp ranges require ≥1 bound and reject `gt`+`gte` / `lt`+`lte` combinations and inverted bounds.

- [#2102](https://github.com/namehash/ensnode/pull/2102) [`1b6abb0`](https://github.com/namehash/ensnode/commit/1b6abb06ac364840770dfcc47526111fdf6fb2c9) Thanks [@tk-o](https://github.com/tk-o)! - Continue to support protocol acceleration for data indexed from ENSv1 namespaces. Protocol acceleration for data indexed from ENSv2 namespaces will be supported in the near future.

- [#2090](https://github.com/namehash/ensnode/pull/2090) [`3132a77`](https://github.com/namehash/ensnode/commit/3132a77b809694a4677da69c8c546a4b41eaa583) Thanks [@tk-o](https://github.com/tk-o)! - Added indexing status based guard for Omnigraph API and Subgraph API routes.

### Patch Changes

- [#2104](https://github.com/namehash/ensnode/pull/2104) [`89c022b`](https://github.com/namehash/ensnode/commit/89c022b85669a6703b688b0b304e6caa12f1221b) Thanks [@shrugs](https://github.com/shrugs)! - Resolution API: Protocol Accelerated records now correctly resolve instead of incorrectly always returning `null`.

- [#2097](https://github.com/namehash/ensnode/pull/2097) [`1bc96f8`](https://github.com/namehash/ensnode/commit/1bc96f88c2e66f19fc4ab8bbda58753f5e414c6a) Thanks [@shrugs](https://github.com/shrugs)! - Forward Resolution is no longer disabled on ENSv1-only namespaces when the `unigraph` plugin is enabled. Forward Resolution is only (temporarily) disabled when a namespace has been upgraded to ENSv2. The Resolution API continues to operate in either case, just without Protocol Acceleration (temporarily) when ENSv2 is deployed.

- [#2101](https://github.com/namehash/ensnode/pull/2101) [`7dd0d3f`](https://github.com/namehash/ensnode/commit/7dd0d3ff2905caf357a74470d5630a9ca8bd3369) Thanks [@shrugs](https://github.com/shrugs)! - Omnigraph: The Domain interface now exposes `Domain.registry` and `Domain.subregistry` rather than being isolated to the concrete ENSv2 Domain entity, as in the unified model both ENSv1 and ENSv2 Domains have a parent and child Registry.

- Updated dependencies [[`3132a77`](https://github.com/namehash/ensnode/commit/3132a77b809694a4677da69c8c546a4b41eaa583), [`1b6abb0`](https://github.com/namehash/ensnode/commit/1b6abb06ac364840770dfcc47526111fdf6fb2c9), [`7dd0d3f`](https://github.com/namehash/ensnode/commit/7dd0d3ff2905caf357a74470d5630a9ca8bd3369), [`f6ef397`](https://github.com/namehash/ensnode/commit/f6ef3977931b68997a40fd47755e0fca8d262093), [`65cf37c`](https://github.com/namehash/ensnode/commit/65cf37c24c1bd9a7f30ad758c945015ece9c8461), [`75e8aac`](https://github.com/namehash/ensnode/commit/75e8aac2abb044ce55119daab98d20ebcbda8304)]:
  - @ensnode/ensnode-sdk@1.14.0
  - @ensnode/ensdb-sdk@1.14.0
  - @namehash/ens-referrals@1.14.0
  - enssdk@1.14.0
  - @ensnode/datasources@1.14.0
  - @ensnode/ponder-subgraph@1.14.0

## 1.13.1

### Patch Changes

- Updated dependencies [[`b32f09d`](https://github.com/namehash/ensnode/commit/b32f09dec275196c816b722023a197d3e91a37b1)]:
  - @ensnode/datasources@1.13.1
  - @ensnode/ensnode-sdk@1.13.1
  - @namehash/ens-referrals@1.13.1
  - @ensnode/ensdb-sdk@1.13.1
  - enssdk@1.13.1
  - @ensnode/ponder-subgraph@1.13.1

## 1.13.0

### Patch Changes

- Updated dependencies [[`57bbef2`](https://github.com/namehash/ensnode/commit/57bbef28e24323a4c2f8326512d185a5e4662254)]:
  - @ensnode/datasources@1.13.0
  - @ensnode/ensnode-sdk@1.13.0
  - @namehash/ens-referrals@1.13.0
  - @ensnode/ensdb-sdk@1.13.0
  - enssdk@1.13.0
  - @ensnode/ponder-subgraph@1.13.0

## 1.12.0

### Minor Changes

- [#2061](https://github.com/namehash/ensnode/pull/2061) [`4fb7b33`](https://github.com/namehash/ensnode/commit/4fb7b332fd46ee9924dc9dfb55b5a21ff8b8554a) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph**: expose `Domain.canonical` and `Registry.canonical` on the Omnigraph schema. Both are non-null `Boolean!` fields indicating whether the entity participates in the Canonical Nametree.

- [#2061](https://github.com/namehash/ensnode/pull/2061) [`4fb7b33`](https://github.com/namehash/ensnode/commit/4fb7b332fd46ee9924dc9dfb55b5a21ff8b8554a) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph (breaking)**: drop the `canonical: Boolean = false` field from `DomainsWhereInput` (used by `Query.domains`). Every nameable Domain is canonical by definition, so the filter was redundant; the query now always scopes to Canonical Domains. Consumers passing `where: { canonical: true }` should drop the field; consumers relying on `canonical: false` (or default) to surface non-canonical Domains via this query no longer can — read `Domain.canonical` directly or scope by `Account.domains` / `Registry.domains` instead.

- [#2077](https://github.com/namehash/ensnode/pull/2077) [`c2e1047`](https://github.com/namehash/ensnode/commit/c2e10471b95cae47ba02044dd03f550589da8db3) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph**: add an `ENSProtocolVersion` enum (`ENSv1` | `ENSv2`) and `where: { version }` filter on `Query.domains` and `Account.domains`.

- [#2061](https://github.com/namehash/ensnode/pull/2061) [`4fb7b33`](https://github.com/namehash/ensnode/commit/4fb7b332fd46ee9924dc9dfb55b5a21ff8b8554a) Thanks [@shrugs](https://github.com/shrugs)! - **Omnigraph (breaking)**: `Resolver.bridged` is no longer an `AccountId` scalar; it now returns the bridged target `Registry` interface. Consumers should change their selection from `bridged` (scalar) to `bridged { ... }` (Registry interface) — the new shape exposes the full `Registry` and allows navigation into the bridged sub-registry's canonical Domain etc.

### Patch Changes

- Updated dependencies [[`4fb7b33`](https://github.com/namehash/ensnode/commit/4fb7b332fd46ee9924dc9dfb55b5a21ff8b8554a)]:
  - @ensnode/ensnode-sdk@1.12.0
  - @namehash/ens-referrals@1.12.0
  - @ensnode/ensdb-sdk@1.12.0
  - enssdk@1.12.0
  - @ensnode/datasources@1.12.0
  - @ensnode/ponder-subgraph@1.12.0

## 1.11.1

### Patch Changes

- [#1998](https://github.com/namehash/ensnode/pull/1998) [`d2fdf05`](https://github.com/namehash/ensnode/commit/d2fdf05a2e306afd517b458ecb7e7a43c9120d4a) Thanks [@Goader](https://github.com/Goader)! - Add `GET /v1/ensanalytics/accounting?edition={slug}` for rev-share-cap editions: returns a CSV dump of the per-event accounting trace, ordered chronologically.

- Updated dependencies [[`d2fdf05`](https://github.com/namehash/ensnode/commit/d2fdf05a2e306afd517b458ecb7e7a43c9120d4a)]:
  - @namehash/ens-referrals@1.11.1
  - enssdk@1.11.1
  - @ensnode/datasources@1.11.1
  - @ensnode/ensdb-sdk@1.11.1
  - @ensnode/ensnode-sdk@1.11.1
  - @ensnode/ponder-subgraph@1.11.1

## 1.11.0

### Minor Changes

- [#2014](https://github.com/namehash/ensnode/pull/2014) [`6bd4154`](https://github.com/namehash/ensnode/commit/6bd4154b40fca1fb3968d57181cbe2404be9296a) Thanks [@shrugs](https://github.com/shrugs)! - Adds HCA-aware `Event.sender` to the Omnigraph API alongside the existing `Event.from`. For ENSv2 events that emit an explicit `sender`/`owner`/`account`/ERC1155 `operator` argument, `Event.sender` is set from that argument (the HCA Smart Account address, if used) and falls back to `tx.from` otherwise. Adds a `sender` filter to `EventsWhereInput`. `Account.events` now filters by `sender` (HCA-aware) instead of `tx.from`. Documents HCA-aware semantics on `Domain.owner`, `Registration.registrant`/`unregistrant`, and `*.PermissionsUser.user`.

- [#2056](https://github.com/namehash/ensnode/pull/2056) [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572) Thanks [@shrugs](https://github.com/shrugs)! - `indexing-status.cache` and `stack-info.cache` updated to consume the new `IndexingMetadataContext` record. Config schema updated to fetch `EnsIndexerPublicConfig` from `EnsNodeStackInfo`.

- [#2007](https://github.com/namehash/ensnode/pull/2007) [`e40ce8f`](https://github.com/namehash/ensnode/commit/e40ce8f1bc32ee7fe5e9511744f9dd2caaa2e96b) Thanks [@shrugs](https://github.com/shrugs)! - Adds `PermissionsUser.events` to the Omnigraph API, exposing the per-role-assignment event history (grants, revokes, role-bitmap mutations) for a specific `(contract, resource, user)` tuple.

- [#1983](https://github.com/namehash/ensnode/pull/1983) [`6173160`](https://github.com/namehash/ensnode/commit/61731608632f62139496656f6231210f63383f20) Thanks [@shrugs](https://github.com/shrugs)! - `Query.root` is now non-null and returns the namespace's Root Registry — preferring the ENSv2 Root Registry when defined, falling back to the ENSv1 Root Registry.

- [#2021](https://github.com/namehash/ensnode/pull/2021) [`6824f35`](https://github.com/namehash/ensnode/commit/6824f35046f3b9c181508c34de098f1221d10630) Thanks [@tk-o](https://github.com/tk-o)! - Integrated ENSDb health check and readiness check into ENSApi `/health` and `/ready` endpoints.

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

### Patch Changes

- [#2056](https://github.com/namehash/ensnode/pull/2056) [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572) Thanks [@shrugs](https://github.com/shrugs)! - Migrated to `@ensnode/ensnode-sdk`'s `replaceBigInts` / `toJson` helpers. Dropped the direct `@ponder/utils` dependency from `ensapi`.

- Updated dependencies [[`aa26180`](https://github.com/namehash/ensnode/commit/aa26180b2582a9f3da2b7e766a77779350baf426), [`43d8a9b`](https://github.com/namehash/ensnode/commit/43d8a9b838b15719f520cd3f3bbfd1b52a4ad1ce), [`824d819`](https://github.com/namehash/ensnode/commit/824d819d291b2b642d2664d09cb10d6de69a6ea7), [`5729ac1`](https://github.com/namehash/ensnode/commit/5729ac18ba029a476ffeca18c9b4bceee417ebdb), [`7e77c5c`](https://github.com/namehash/ensnode/commit/7e77c5c2bef96d1a2eb363871fb87379b5f6f7e9), [`6173160`](https://github.com/namehash/ensnode/commit/61731608632f62139496656f6231210f63383f20), [`92ca54f`](https://github.com/namehash/ensnode/commit/92ca54fa2efbef3f32e2dacd8fdc347ef260a2af), [`7e77c5c`](https://github.com/namehash/ensnode/commit/7e77c5c2bef96d1a2eb363871fb87379b5f6f7e9), [`0d8a4b4`](https://github.com/namehash/ensnode/commit/0d8a4b4b7c8c70be904652e2132e7c67fd9e39ef), [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572), [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572), [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572), [`aa26180`](https://github.com/namehash/ensnode/commit/aa26180b2582a9f3da2b7e766a77779350baf426), [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572), [`aa26180`](https://github.com/namehash/ensnode/commit/aa26180b2582a9f3da2b7e766a77779350baf426), [`43d8a9b`](https://github.com/namehash/ensnode/commit/43d8a9b838b15719f520cd3f3bbfd1b52a4ad1ce), [`c186ad8`](https://github.com/namehash/ensnode/commit/c186ad8c0d85c4db8619a436173d7e21f857f689), [`6173160`](https://github.com/namehash/ensnode/commit/61731608632f62139496656f6231210f63383f20)]:
  - @namehash/ens-referrals@1.11.0
  - @ensnode/ensnode-sdk@1.11.0
  - @ensnode/datasources@1.11.0
  - @ensnode/ensdb-sdk@1.11.0
  - enssdk@1.11.0
  - @ensnode/ponder-subgraph@1.11.0

## 1.10.1

### Patch Changes

- Updated dependencies [[`e92fa4d`](https://github.com/namehash/ensnode/commit/e92fa4d28f183b62fb6d9665db3332b43a46f279), [`9d50f64`](https://github.com/namehash/ensnode/commit/9d50f647802fde286dfef2dc23c884801d06b228), [`9d50f64`](https://github.com/namehash/ensnode/commit/9d50f647802fde286dfef2dc23c884801d06b228)]:
  - @ensnode/ensdb-sdk@1.10.1
  - @ensnode/ensnode-sdk@1.10.1
  - @namehash/ens-referrals@1.10.1
  - enssdk@1.10.1
  - @ensnode/datasources@1.10.1
  - @ensnode/ponder-subgraph@1.10.1

## 1.10.0

### Minor Changes

- [#1925](https://github.com/namehash/ensnode/pull/1925) [`b5da4a6`](https://github.com/namehash/ensnode/commit/b5da4a6d78d6c4d0de83ea7928f561757eb8d7f4) Thanks [@Goader](https://github.com/Goader)! - Remove v0 ENS Referrals API. The `/ensanalytics/*` routes are deleted — use `/v1/ensanalytics/*` instead.

- [#1857](https://github.com/namehash/ensnode/pull/1857) [`abc535f`](https://github.com/namehash/ensnode/commit/abc535f9bec8c5c7fb2443aa6ad4bbbc14fbcc7d) Thanks [@shrugs](https://github.com/shrugs)! - Omnigraph API (BREAKING): Removed `ENSv2Domain.canonicalId`.

- [#1967](https://github.com/namehash/ensnode/pull/1967) [`5f341e1`](https://github.com/namehash/ensnode/commit/5f341e14420146db772fc01b1b3c0f4e2d4a3cb7) Thanks [@shrugs](https://github.com/shrugs)! - Resolution API: support `contenthash`, `pubkey`, `abi`, `interfaces`, `dnszonehash`, and `version` selection. Protocol acceleration indexes `contenthash`, `pubkey`, `dnszonehash`, and handles `VersionChanged` (clears records for the node, bumps version). `ABI` (bitmask query, contract-equivalent) and `interface` records are selectable but always resolved via RPC. Adds `ContentType` / `InterfaceId` / `RecordVersion` semantic types to `enssdk`.

- [#1934](https://github.com/namehash/ensnode/pull/1934) [`b8f5be7`](https://github.com/namehash/ensnode/commit/b8f5be761748f75c06ba4da81dd6098eec6ebb9a) Thanks [@shrugs](https://github.com/shrugs)! - Omnigraph API (BREAKING): Renamed `Resolver.records_` argument from `for` to `by` for consistency with other id lookups.

- [#1857](https://github.com/namehash/ensnode/pull/1857) [`abc535f`](https://github.com/namehash/ensnode/commit/abc535f9bec8c5c7fb2443aa6ad4bbbc14fbcc7d) Thanks [@shrugs](https://github.com/shrugs)! - Omnigraph API (BREAKING): API route path changed from `/api/graphql` to `/api/omnigraph`.

- [#1912](https://github.com/namehash/ensnode/pull/1912) [`d5225c0`](https://github.com/namehash/ensnode/commit/d5225c00f4528b09826ca2a59f87271df6c7b330) Thanks [@Goader](https://github.com/Goader)! - Removed the hardcoded "default" referral program edition config set and renamed `CUSTOM_REFERRAL_PROGRAM_EDITIONS` to `REFERRAL_PROGRAM_EDITIONS`. An unset `REFERRAL_PROGRAM_EDITIONS` now means the referral program has zero configured editions, so ENSApi performs no referral-related work against ENSDb. The editions array may also now be empty.

- [#1907](https://github.com/namehash/ensnode/pull/1907) [`b2481d6`](https://github.com/namehash/ensnode/commit/b2481d6dae6f704493140aa63cd4ad1bfd3e3301) Thanks [@Goader](https://github.com/Goader)! - Made `accurateAsOf` a required field in the Registrar Actions API response (`RegistrarActionsResponseOk`).

- [#1828](https://github.com/namehash/ensnode/pull/1828) [`4c99177`](https://github.com/namehash/ensnode/commit/4c991777ac13ffd2cc1fb947e5a47bd7733b112b) Thanks [@tk-o](https://github.com/tk-o)! - Renamed environment variable: `DATABASE_URL` to `ENSDB_URL`.

- [#1671](https://github.com/namehash/ensnode/pull/1671) [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5) Thanks [@tk-o](https://github.com/tk-o)! - **Breaking**: Removed Config API endpoint at `GET /api/config`. To get the ENSApi Public Config, call the `GET /api/indexing-status` endpoint and reference the `stackInfo.ensApi` field in the OK response.

- [#1845](https://github.com/namehash/ensnode/pull/1845) [`a983e4d`](https://github.com/namehash/ensnode/commit/a983e4d0279942553826bec957d71cae1543398f) Thanks [@shrugs](https://github.com/shrugs)! - Omnigraph API (BREAKING): Removed `Resolver.dedicated` field in advance of PermissionedResolver integration.

- [#1867](https://github.com/namehash/ensnode/pull/1867) [`536149c`](https://github.com/namehash/ensnode/commit/536149c1c214eb01648e13354a57d6caea791499) Thanks [@shrugs](https://github.com/shrugs)! - Change `Query.permissions` to accept `by: { id, contract }` and `Query.account` to accept `by: { id, address }`, matching the `by` input pattern of `Query.registry` and `Query.resolver`.

### Patch Changes

- [#1872](https://github.com/namehash/ensnode/pull/1872) [`9abb302`](https://github.com/namehash/ensnode/commit/9abb30238374f0847a68615827dddafb6dc05dad) Thanks [@sevenzing](https://github.com/sevenzing)! - Add example responses to autogenerated openapi doc

- [#1873](https://github.com/namehash/ensnode/pull/1873) [`2804ec2`](https://github.com/namehash/ensnode/commit/2804ec28eb26caced069dadd38363e2b246c4b87) Thanks [@sevenzing](https://github.com/sevenzing)! - Add integration tests for resolution APIs in ensapi

- [#1919](https://github.com/namehash/ensnode/pull/1919) [`319d619`](https://github.com/namehash/ensnode/commit/319d619f6259f7bda5813c685a993074acb259ba) Thanks [@Goader](https://github.com/Goader)! - Rename `rev-share-limit` award model to `rev-share-cap`.

- [#1854](https://github.com/namehash/ensnode/pull/1854) [`90eeaea`](https://github.com/namehash/ensnode/commit/90eeaea559b073f031197026336636cc43d48550) Thanks [@tk-o](https://github.com/tk-o)! - Updated `ensIndexerSchema` value that is passed into `subgraphGraphQLMiddleware` function.

- Updated dependencies [[`b5da4a6`](https://github.com/namehash/ensnode/commit/b5da4a6d78d6c4d0de83ea7928f561757eb8d7f4), [`b781245`](https://github.com/namehash/ensnode/commit/b781245036e67479ded836df3916ab9675a38285), [`b5da4a6`](https://github.com/namehash/ensnode/commit/b5da4a6d78d6c4d0de83ea7928f561757eb8d7f4), [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`29afaa6`](https://github.com/namehash/ensnode/commit/29afaa6ad8a3f3c8133241cf1a9324980498ded4), [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`7fca45d`](https://github.com/namehash/ensnode/commit/7fca45d09dc6e3456fec2cae0827e9d2c54827a6), [`29fcfc7`](https://github.com/namehash/ensnode/commit/29fcfc7a1ab01c3214b5c16fc0e4a349010e9360), [`ab20d4d`](https://github.com/namehash/ensnode/commit/ab20d4ddf7233151bdf5ab78f4f04a5f77c72d87), [`5f341e1`](https://github.com/namehash/ensnode/commit/5f341e14420146db772fc01b1b3c0f4e2d4a3cb7), [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`b8f5be7`](https://github.com/namehash/ensnode/commit/b8f5be761748f75c06ba4da81dd6098eec6ebb9a), [`c336c79`](https://github.com/namehash/ensnode/commit/c336c79b08e46ce53caa536ebf6158eba9f3e017), [`fc88ee5`](https://github.com/namehash/ensnode/commit/fc88ee5f910de1a94ce2734776d4a5640f839641), [`5c2dc68`](https://github.com/namehash/ensnode/commit/5c2dc687a6b6e6dd31c1f1aeab08e89d3a9a5e36), [`4c99177`](https://github.com/namehash/ensnode/commit/4c991777ac13ffd2cc1fb947e5a47bd7733b112b), [`4c51c75`](https://github.com/namehash/ensnode/commit/4c51c75ec8b3807d0aa988618893b2da07e11a83), [`d5225c0`](https://github.com/namehash/ensnode/commit/d5225c00f4528b09826ca2a59f87271df6c7b330), [`49a0e75`](https://github.com/namehash/ensnode/commit/49a0e75e25d92c4e3ebb08e87abee3e33c0e8101), [`b2481d6`](https://github.com/namehash/ensnode/commit/b2481d6dae6f704493140aa63cd4ad1bfd3e3301), [`9abb302`](https://github.com/namehash/ensnode/commit/9abb30238374f0847a68615827dddafb6dc05dad), [`ed6ee96`](https://github.com/namehash/ensnode/commit/ed6ee9641bfa6f42ddc95955cf8b013c93bf2f4a), [`319d619`](https://github.com/namehash/ensnode/commit/319d619f6259f7bda5813c685a993074acb259ba), [`677db8b`](https://github.com/namehash/ensnode/commit/677db8b67effc6d530716c0a1902244dba56d787)]:
  - @namehash/ens-referrals@1.10.0
  - @ensnode/ensnode-sdk@1.10.0
  - enssdk@1.10.0
  - @ensnode/ensdb-sdk@1.10.0
  - @ensnode/datasources@1.10.0
  - @ensnode/ponder-subgraph@1.10.0

## 1.9.0

### Minor Changes

- [#1809](https://github.com/namehash/ensnode/pull/1809) [`aaa471f`](https://github.com/namehash/ensnode/commit/aaa471f0a33d0f96389e706dcaed2b704e2952ea) Thanks [@tk-o](https://github.com/tk-o)! - Updated custom queries for ENSDb to implement data model from ENSDb SDK.

- [#1809](https://github.com/namehash/ensnode/pull/1809) [`aaa471f`](https://github.com/namehash/ensnode/commit/aaa471f0a33d0f96389e706dcaed2b704e2952ea) Thanks [@tk-o](https://github.com/tk-o)! - Decoupled ENSApi from ENSIndexer by updating the data source for `EnsIndexerPublicConfig` from ENSIndexer to ENSDb.

- [#1809](https://github.com/namehash/ensnode/pull/1809) [`aaa471f`](https://github.com/namehash/ensnode/commit/aaa471f0a33d0f96389e706dcaed2b704e2952ea) Thanks [@tk-o](https://github.com/tk-o)! - Decoupled ENSApi from ENSIndexer by updating the data source for Indexing Status snapshots, from ENSIndexer's Indexing Status API route to ENSDb.

### Patch Changes

- Updated dependencies [[`70e6f24`](https://github.com/namehash/ensnode/commit/70e6f2475a566135602f4adbcf44df2a6f74e5fd), [`9f52a66`](https://github.com/namehash/ensnode/commit/9f52a662e5828e944210f35d47571661899fc30e), [`aaa471f`](https://github.com/namehash/ensnode/commit/aaa471f0a33d0f96389e706dcaed2b704e2952ea), [`387715e`](https://github.com/namehash/ensnode/commit/387715e1bc4c996c0ae7545bfc78b79149e04f58), [`113232b`](https://github.com/namehash/ensnode/commit/113232bd02a876a1dbf4607019e724d7cc577351)]:
  - @ensnode/ensnode-sdk@1.9.0
  - @ensnode/ensdb-sdk@1.9.0
  - @namehash/ens-referrals@1.9.0
  - @ensnode/datasources@1.9.0
  - @ensnode/ponder-subgraph@1.9.0

## 1.8.1

### Patch Changes

- Updated dependencies [[`12f279d`](https://github.com/namehash/ensnode/commit/12f279da603da358869a709cc8a7a8c0d56080e5)]:
  - @ensnode/ensdb-sdk@1.8.1
  - @ensnode/datasources@1.8.1
  - @ensnode/ensnode-sdk@1.8.1
  - @ensnode/ponder-subgraph@1.8.1
  - @namehash/ens-referrals@1.8.1

## 1.8.0

### Minor Changes

- [#1744](https://github.com/namehash/ensnode/pull/1744) [`9429530`](https://github.com/namehash/ensnode/commit/9429530dd7966735252e6216b2769ebb6941c987) Thanks [@shrugs](https://github.com/shrugs)! - ENSNode GraphQL API: `Registration.start` is now available, indicating the start timestamp of the Registration.

- [#1758](https://github.com/namehash/ensnode/pull/1758) [`f276efe`](https://github.com/namehash/ensnode/commit/f276efe9c48361a330bfcc4bc6f045c6ed9963d2) Thanks [@shrugs](https://github.com/shrugs)! - The ENSv2 Plugin can now be safely activated for ENSv1-only namespaces (ex: 'mainnet', 'sepolia').

- [#1730](https://github.com/namehash/ensnode/pull/1730) [`5c64d89`](https://github.com/namehash/ensnode/commit/5c64d8976fdaf93cd9f9256b93b5216b34d48a90) Thanks [@shrugs](https://github.com/shrugs)! - The `subgraph` and `ensv2` plugins can now be activated in parallel.

- [#1761](https://github.com/namehash/ensnode/pull/1761) [`337ef4b`](https://github.com/namehash/ensnode/commit/337ef4b54e62acd973df7120aa2b213399b1a42b) Thanks [@shrugs](https://github.com/shrugs)! - Introduces integration testing for the ENSv2 Plugin and GraphQL API against the ENSv2 devnet.

- [#1744](https://github.com/namehash/ensnode/pull/1744) [`9429530`](https://github.com/namehash/ensnode/commit/9429530dd7966735252e6216b2769ebb6941c987) Thanks [@shrugs](https://github.com/shrugs)! - ENSNode GraphQL API: Add `where` filters to all `*.events` connections (`Domain.events`, `Resolver.events`, `Permissions.events`, `Account.events`). Supports filtering by `selector_in`, `timestamp_gte`, `timestamp_lte`, and `from` (where applicable). Also adds `Account.events` field to find events by transaction sender.

- [#1733](https://github.com/namehash/ensnode/pull/1733) [`10b368a`](https://github.com/namehash/ensnode/commit/10b368a052e24d165327b8b0f97ef952699e924b) Thanks [@shrugs](https://github.com/shrugs)! - ENSNode GraphQL API: `ENSv1Domain.rootRegistryOwner` is now available, indicating the owner of the Domain's node within the ENSv1 Registry contract.

- [#1744](https://github.com/namehash/ensnode/pull/1744) [`9429530`](https://github.com/namehash/ensnode/commit/9429530dd7966735252e6216b2769ebb6941c987) Thanks [@shrugs](https://github.com/shrugs)! - ENSNode GraphQL API: `Account.events` now provides the set of Events for which this Account is the sender (i.e. `Transaction.from`).

### Patch Changes

- [#1787](https://github.com/namehash/ensnode/pull/1787) [`4838dc7`](https://github.com/namehash/ensnode/commit/4838dc7825d92e2e6e3d1fef3843f913c870ef60) Thanks [@sevenzing](https://github.com/sevenzing)! - API file handlers rearrange, making them grouped by open api tags. Moving /amirealtime to /api/realtime and keeping old endpoint for backward compatibility.

- [#1780](https://github.com/namehash/ensnode/pull/1780) [`0bb79fc`](https://github.com/namehash/ensnode/commit/0bb79fc601a43ea35dfdeed2afe91e24bbc6b5fd) Thanks [@Goader](https://github.com/Goader)! - Add `Exhausted` and `AwardsReview` referral program statuses; add `areAwardsDistributed` to base rules; enrich `/editions` with runtime `status` and `awardPoolRemaining` per edition.

- [#1742](https://github.com/namehash/ensnode/pull/1742) [`0bde568`](https://github.com/namehash/ensnode/commit/0bde56873f5cba6ee8bcfa18534a6026b8649bbd) Thanks [@Goader](https://github.com/Goader)! - Provide deterministic sorting of registrar actions by their execution order.

- Updated dependencies [[`5ce102e`](https://github.com/namehash/ensnode/commit/5ce102e11c7b891844b0762cffa45ade1a997e0f), [`0bde568`](https://github.com/namehash/ensnode/commit/0bde56873f5cba6ee8bcfa18534a6026b8649bbd), [`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772), [`d6dd425`](https://github.com/namehash/ensnode/commit/d6dd4252f690daba13bf02aa53a1ef3e868c823e), [`0bb79fc`](https://github.com/namehash/ensnode/commit/0bb79fc601a43ea35dfdeed2afe91e24bbc6b5fd), [`5ac81cb`](https://github.com/namehash/ensnode/commit/5ac81cb42ad3a4bf561d82c2dd628e85988240ef), [`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772), [`9ea8580`](https://github.com/namehash/ensnode/commit/9ea858055109eaf3a92d210f2b3d9170232a32e8)]:
  - @ensnode/ensdb-sdk@1.8.0
  - @namehash/ens-referrals@1.8.0
  - @ensnode/ensnode-sdk@1.8.0
  - @ensnode/datasources@1.8.0
  - @ensnode/ponder-subgraph@1.8.0

## 1.7.0

### Minor Changes

- [#1719](https://github.com/namehash/ensnode/pull/1719) [`4cb6dee`](https://github.com/namehash/ensnode/commit/4cb6dee2a0198b630b4efdd02eb71c36c7d38025) Thanks [@shrugs](https://github.com/shrugs)! - ENSNode GraphQL API: BREAKING: Removed `ENSv1Domain.children` in favor of `Domain.subdomains`.

- [#1719](https://github.com/namehash/ensnode/pull/1719) [`4cb6dee`](https://github.com/namehash/ensnode/commit/4cb6dee2a0198b630b4efdd02eb71c36c7d38025) Thanks [@shrugs](https://github.com/shrugs)! - ENSNode GraphQL API: Introduce `*Connection.totalCount` for all `*Connection` fields, following the Relay specification.

- [#1719](https://github.com/namehash/ensnode/pull/1719) [`4cb6dee`](https://github.com/namehash/ensnode/commit/4cb6dee2a0198b630b4efdd02eb71c36c7d38025) Thanks [@shrugs](https://github.com/shrugs)! - ENSNode GraphQL API: BREAKING: Removed `Domain.subdomainCount` in favor of `Domain.subdomains.totalCount`.

### Patch Changes

- Updated dependencies [[`9ef8ab7`](https://github.com/namehash/ensnode/commit/9ef8ab740f03cbc9abba189ff959e4f94b093cbb), [`2d03bcd`](https://github.com/namehash/ensnode/commit/2d03bcd94107168e24b9620721e023cfa17d0440)]:
  - @namehash/ens-referrals@1.7.0
  - @ensnode/ensnode-sdk@1.7.0
  - @ensnode/datasources@1.7.0
  - @ensnode/ensnode-schema@1.7.0
  - @ensnode/ponder-subgraph@1.7.0

## 1.6.0

### Minor Changes

- [#1663](https://github.com/namehash/ensnode/pull/1663) [`c6cc7c4`](https://github.com/namehash/ensnode/commit/c6cc7c4f6d910b196d1475f89e79097d569840cf) Thanks [@Goader](https://github.com/Goader)! - Introduces a pluggable award model architecture for referral program editions. The original Holiday Awards logic is now encapsulated as the `pie-split` model. A new `rev-share-limit` model is added to support the upcoming referral program edition. `ReferralProgramRules` is now a discriminated union over `awardModel`, with an `Unrecognized` variant for forward compatibility — older clients safely skip editions with unknown models rather than crashing.

- [#1621](https://github.com/namehash/ensnode/pull/1621) [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c) Thanks [@Goader](https://github.com/Goader)! - Added `status` field to referral program API responses (`ReferrerLeaderboardPage`, `ReferrerEditionMetricsRanked`, `ReferrerEditionMetricsUnranked`) indicating whether a program is "Scheduled", "Active", or "Closed" based on the program's timing relative to `accurateAsOf`.

- [#1603](https://github.com/namehash/ensnode/pull/1603) [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91) Thanks [@Goader](https://github.com/Goader)! - Introduces referral program editions support with pre-configured edition definitions (ENS Holiday Awards December 2025, March 2026 edition). Updated ENSAnalytics API v1 to support edition-based leaderboard queries and added edition configuration to environment schema.

- [#1654](https://github.com/namehash/ensnode/pull/1654) [`40b95fb`](https://github.com/namehash/ensnode/commit/40b95fb2cb5209546c0bd38145dbf7c231a968e7) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 GraphQL API: BREAKING: Removes Account.domains in favor of `Query.domains` with `owner` specified.

- [#1576](https://github.com/namehash/ensnode/pull/1576) [`6e98fb6`](https://github.com/namehash/ensnode/commit/6e98fb677d5021c4bc9d17b01289290d1c286003) Thanks [@shrugs](https://github.com/shrugs)! - The experimental ENSv2 API now supports the following Domain filters, namely matching indexed Domains by name prefix.
  - `Query.domains(where: { name?: "example.et", owner?: "0xdead...beef" })`

- [#1705](https://github.com/namehash/ensnode/pull/1705) [`a0be9a6`](https://github.com/namehash/ensnode/commit/a0be9a6fb188fb6dc982ba297896ee5b357c3072) Thanks [@tk-o](https://github.com/tk-o)! - Altered code references accordingly to the updated `EnsIndexerPublicConfig` data model.

- [#1670](https://github.com/namehash/ensnode/pull/1670) [`3ce245e`](https://github.com/namehash/ensnode/commit/3ce245e12c0f87e8439b7018921eed54574afa8c) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 GraphQL API: BREAKING — `Domain.label` is now a `Label` rather than a `String`, providing `Label.hash` and `Label.interpreted` (the previous value of `Domain.label`).

- [#1670](https://github.com/namehash/ensnode/pull/1670) [`3ce245e`](https://github.com/namehash/ensnode/commit/3ce245e12c0f87e8439b7018921eed54574afa8c) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2GraphQL API: Introduce `Domain.subdomainCount`.

- [#1659](https://github.com/namehash/ensnode/pull/1659) [`43b50cf`](https://github.com/namehash/ensnode/commit/43b50cf399e80ce0bae198eb520dbbb5318c336f) Thanks [@shrugs](https://github.com/shrugs)! - The `ens-test-env` namespace now functions against devnet commit `762de44`, which includes the major refactor of ENSv2 onto the ENS Root Chain, away from Namechain.

- [#1621](https://github.com/namehash/ensnode/pull/1621) [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c) Thanks [@Goader](https://github.com/Goader)! - Referral program edition leaderboard caches now check for immutability within the cache builder function. Closed editions past the safety window return cached data without re-fetching.

- [#1655](https://github.com/namehash/ensnode/pull/1655) [`41077b3`](https://github.com/namehash/ensnode/commit/41077b3fc105b349fa42aaef5312d5195ac43472) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 API: Breaking change, Registration.start is replaced by Registration.event.timestamp.

- [#1658](https://github.com/namehash/ensnode/pull/1658) [`08e893e`](https://github.com/namehash/ensnode/commit/08e893e137307f76303a6ff04707cbcc56ee4c26) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 GraphQL API: Introduces `Domain.subdomains` for traversal of the unified ENSv1/ENSv2 namegraph without needing to select a type-specific fragment.

- [#1554](https://github.com/namehash/ensnode/pull/1554) [`365c996`](https://github.com/namehash/ensnode/commit/365c9967e07680659746af352b8ba623839c7d6e) Thanks [@Goader](https://github.com/Goader)! - Implemented API versioning for ENSAnalytics referral endpoints. Introduced explicit `/ensanalytics/v1/*` routes while preserving existing `/ensanalytics/*` routes as implicit v0.

- [#1595](https://github.com/namehash/ensnode/pull/1595) [`229eaeb`](https://github.com/namehash/ensnode/commit/229eaeb37bd446bef05c28c1603503c3fd318c47) Thanks [@shrugs](https://github.com/shrugs)! - ENSv2 GraphQL API: Introduces order criteria for Domain methods, i.e. `Query.domains(order: { by: NAME, dir: ASC })`. The supported Order criteria are `NAME`, `REGISTRATION_TIMESTAMP`, and `REGISTRATION_EXPIRY` in either `ASC` or `DESC` orders, defaulting to `NAME` and `ASC`.

- [#1654](https://github.com/namehash/ensnode/pull/1654) [`40b95fb`](https://github.com/namehash/ensnode/commit/40b95fb2cb5209546c0bd38145dbf7c231a968e7) Thanks [@shrugs](https://github.com/shrugs)! - Adds a `canonical?: boolean` filter to the where filter in `Query.domains`. When specified, the resulting set of Domains is composed exclusively of Canonical Domains.

### Patch Changes

- [#1680](https://github.com/namehash/ensnode/pull/1680) [`a5f9178`](https://github.com/namehash/ensnode/commit/a5f9178bdd1d4e42440e4ad24daf5df6036f7737) Thanks [@shrugs](https://github.com/shrugs)! - add `Account.domains` and enhance `Domain.subdomains` and `Registry.domains` with filtering and ordering

  **`Account.domains`** (new) — paginated connection of domains owned by this account.
  - `where: { name?: String, canonical?: Boolean }` — optional partial Interpreted Name filter and canonical filter (defaults to false)
  - `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

  **`Domain.subdomains`** (enhanced) — paginated connection of subdomains of this domain, now with filtering and ordering.
  - `where: { name?: String }` — optional partial Interpreted Name filter
  - `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

  **`Registry.domains`** (enhanced) — paginated connection of domains in this registry, now with filtering and ordering.
  - `where: { name?: String }` — optional partial Interpreted Name filter
  - `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

  **`Query.domains`** (updated) — `where.name` is now required. Added optional `where.canonical` filter (defaults to false).
  - `where: { name: String!, canonical?: Boolean }` — required partial Interpreted Name, optional canonical filter
  - `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

- [#1542](https://github.com/namehash/ensnode/pull/1542) [`500388b`](https://github.com/namehash/ensnode/commit/500388b217ea420b79b85670891b99ade07f07f0) Thanks [@Goader](https://github.com/Goader)! - Flipped dependency relationship between `ensnode-sdk` and `ens-referrals`. Introduced new `ENSReferralsClient` for referral leaderboard APIs. Consolidated duplicate types (`ChainId`, `AccountId`, `UnixTimestamp`, `Duration`) by importing from `ensnode-sdk`.

- [#1562](https://github.com/namehash/ensnode/pull/1562) [`84a4c5e`](https://github.com/namehash/ensnode/commit/84a4c5e70df1e33ceed495888fc9b4436c577fc8) Thanks [@Goader](https://github.com/Goader)! - Migrated v1 referrer leaderboard API to use mature `PriceEth` and `PriceUsdc` types from `ensnode-sdk`, replacing temporary `RevenueContribution` and `USDQuantity` types. Added `/v1` subpath export to `ens-referrals`.

- Updated dependencies [[`c6cc7c4`](https://github.com/namehash/ensnode/commit/c6cc7c4f6d910b196d1475f89e79097d569840cf), [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c), [`220b71f`](https://github.com/namehash/ensnode/commit/220b71f1dfcf7d7d7ef6e5a2841dced2501ad3d7), [`75c8b01`](https://github.com/namehash/ensnode/commit/75c8b01644cae2c5ac96dcc253441c64e755a45c), [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`1f8a05b`](https://github.com/namehash/ensnode/commit/1f8a05b85ed264e2e54e90fbf8b8c0201a526512), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`91d7653`](https://github.com/namehash/ensnode/commit/91d7653b0447e0e767e41b275515fb8423af3c0a), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`a0be9a6`](https://github.com/namehash/ensnode/commit/a0be9a6fb188fb6dc982ba297896ee5b357c3072), [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2), [`6f4d39b`](https://github.com/namehash/ensnode/commit/6f4d39b026f42ecfeb0f9e21b4473f515dc31a23), [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c), [`4cf6f41`](https://github.com/namehash/ensnode/commit/4cf6f412a9fa9aa6c438b83acf090adb8365f497), [`8be113b`](https://github.com/namehash/ensnode/commit/8be113b445a5c475a6e69f6c6c99689d4b974d91), [`3ece8f0`](https://github.com/namehash/ensnode/commit/3ece8f02f5ad82344f73aa98d67cb83cf3da3c03), [`1bc599f`](https://github.com/namehash/ensnode/commit/1bc599f99804d1cf08dd0d23d5518b1b8e7928c5), [`500388b`](https://github.com/namehash/ensnode/commit/500388b217ea420b79b85670891b99ade07f07f0), [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842), [`a87b437`](https://github.com/namehash/ensnode/commit/a87b4370ff8b4da6a254dda39afac19e3a7f6e94), [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2), [`70b15a1`](https://github.com/namehash/ensnode/commit/70b15a18800921d3a28e1dcfe512a79287537d87), [`43d3e9c`](https://github.com/namehash/ensnode/commit/43d3e9cdc6456c8b32940a8860b92c523157ffea), [`84a4c5e`](https://github.com/namehash/ensnode/commit/84a4c5e70df1e33ceed495888fc9b4436c577fc8)]:
  - @namehash/ens-referrals@1.6.0
  - @ensnode/ensnode-sdk@1.6.0
  - @ensnode/ensnode-schema@1.6.0
  - @ensnode/datasources@1.6.0
  - @ensnode/ponder-subgraph@1.6.0

## 1.5.1

### Patch Changes

- [#1529](https://github.com/namehash/ensnode/pull/1529) [`b25605b`](https://github.com/namehash/ensnode/commit/b25605b49c09d57dae44ff53092303eb7330df85) Thanks [@notrab](https://github.com/notrab)! - Add production and testnet servers to OpenAPI spec

  The OpenAPI specification now includes the following servers:
  - https://api.alpha.ensnode.io (ENSNode Alpha - Mainnet)
  - https://api.alpha-sepolia.ensnode.io (ENSNode Alpha - Sepolia Testnet)
  - localhost (Local Development)

- [#1537](https://github.com/namehash/ensnode/pull/1537) [`63617fa`](https://github.com/namehash/ensnode/commit/63617fa827daa4bd7761f482812daf7b507da3d2) Thanks [@tk-o](https://github.com/tk-o)! - Updates Node.js runtime to the current LTS version (v24).

- Updated dependencies []:
  - @ensnode/datasources@1.5.1
  - @ensnode/ensnode-schema@1.5.1
  - @ensnode/ponder-subgraph@1.5.1
  - @ensnode/ensnode-sdk@1.5.1
  - @namehash/ens-referrals@1.5.1

## 1.5.0

### Patch Changes

- Updated dependencies [[`dc7e07f`](https://github.com/namehash/ensnode/commit/dc7e07f6e69e30d597a871b79bd2c6876de9f8cc)]:
  - @ensnode/ensnode-schema@1.5.0
  - @ensnode/datasources@1.5.0
  - @ensnode/ponder-subgraph@1.5.0
  - @ensnode/ensnode-sdk@1.5.0
  - @namehash/ens-referrals@1.5.0

## 1.4.0

### Minor Changes

- [#1412](https://github.com/namehash/ensnode/pull/1412) [`fae127e`](https://github.com/namehash/ensnode/commit/fae127ed94a62a212d406daed9e86a0c51eb4f37) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `GET /amirealtime` endpoint allowing for easy realtime indexing distance verification.

- [#1442](https://github.com/namehash/ensnode/pull/1442) [`05d7481`](https://github.com/namehash/ensnode/commit/05d7481d6fd3e1842262c72b930bbdbddd866715) Thanks [@shrugs](https://github.com/shrugs)! - Fixed issue regarding Protocol Accelerated Resolution API requests and legacy unmigrated names, which should now resolve correctly when accelerated.

- [#1280](https://github.com/namehash/ensnode/pull/1280) [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec) Thanks [@shrugs](https://github.com/shrugs)! - Introduces the ENSv2 Plugin ('ensv2') for indexing both ENSv1 and the future ENSv2 protocol.

- [#1411](https://github.com/namehash/ensnode/pull/1411) [`ec96ff9`](https://github.com/namehash/ensnode/commit/ec96ff912c010d4623e586dc2b60a22f122a128d) Thanks [@shrugs](https://github.com/shrugs)! - Disabled viem's built-in Transport Ranking feature in order to minimize net_listening RPC credit ussage.

- [#1444](https://github.com/namehash/ensnode/pull/1444) [`fcd96db`](https://github.com/namehash/ensnode/commit/fcd96db1aae297a445597e3867de811bc42ca31d) Thanks [@Goader](https://github.com/Goader)! - Added optional time range filtering to the Registrar Actions API.

- [#1484](https://github.com/namehash/ensnode/pull/1484) [`cf1b218`](https://github.com/namehash/ensnode/commit/cf1b218c27cb2253f37ef6b452c908d5c387aa0a) Thanks [@Goader](https://github.com/Goader)! - Added `accurateAsOf` response field to the Registrar Actions API.

- [#1418](https://github.com/namehash/ensnode/pull/1418) [`4e0579b`](https://github.com/namehash/ensnode/commit/4e0579b85c3b118450e7907242b60ca46bebebda) Thanks [@Goader](https://github.com/Goader)! - Added revenue contribution tracking to referrer metrics, calculating total revenue contributed to the ENS DAO from referrals. Added `totalRevenueContribution` to individual referrer metrics and `grandTotalRevenueContribution` to aggregated metrics.

### Patch Changes

- [#1485](https://github.com/namehash/ensnode/pull/1485) [`4f3abbe`](https://github.com/namehash/ensnode/commit/4f3abbe6c1447b7d5c5e7f2a39cf250067122877) Thanks [@notrab](https://github.com/notrab)! - Fix openapi validation errors by adding missing route descriptions
  - Add `describeRoute` with tags, summary, description, and responses to `/amirealtime`, `/ensanalytics/referrers`, `/ensanalytics/referrers/:referrer`, `/registrar-actions`, and `/registrar-actions/:parentNode` endpoints
  - Add `.describe()` to Zod schema fields for query and path parameters to improve OpenAPI documentation
  - Add OpenAPI tags (`Resolution`, `Meta`, `Explore`, `ENSAwards`) to organize endpoints in the spec
  - Split optional parent node path param in registrar-actions-api into dedicated handlers to fix OpenAPI validation

- [#1338](https://github.com/namehash/ensnode/pull/1338) [`bb1686a`](https://github.com/namehash/ensnode/commit/bb1686a34ce1bd36a44598f8de0a24c40a439bc3) Thanks [@stevedylandev](https://github.com/stevedylandev)! - Adds OpenAPI schema endpoint and route descriptions to ENSApi

- Updated dependencies [[`706f86b`](https://github.com/namehash/ensnode/commit/706f86b47caf5693153cd2fb7e009b331795d990), [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec), [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec), [`fcd96db`](https://github.com/namehash/ensnode/commit/fcd96db1aae297a445597e3867de811bc42ca31d), [`9862514`](https://github.com/namehash/ensnode/commit/9862514d320b2ed50e06410b57b28e3e30077ade), [`cf1b218`](https://github.com/namehash/ensnode/commit/cf1b218c27cb2253f37ef6b452c908d5c387aa0a), [`4e0579b`](https://github.com/namehash/ensnode/commit/4e0579b85c3b118450e7907242b60ca46bebebda), [`bb1686a`](https://github.com/namehash/ensnode/commit/bb1686a34ce1bd36a44598f8de0a24c40a439bc3)]:
  - @ensnode/ensnode-sdk@1.4.0
  - @ensnode/ensnode-schema@1.4.0
  - @ensnode/datasources@1.4.0
  - @namehash/ens-referrals@1.4.0
  - @ensnode/ponder-subgraph@1.4.0

## 1.3.1

### Patch Changes

- [#1400](https://github.com/namehash/ensnode/pull/1400) [`6388ee7`](https://github.com/namehash/ensnode/commit/6388ee772940a6190ab95d6dc4a78d355614ca0a) Thanks [@tk-o](https://github.com/tk-o)! - Optimizes pagination helper used with Registrar Actions API.

- [#1396](https://github.com/namehash/ensnode/pull/1396) [`5d3237d`](https://github.com/namehash/ensnode/commit/5d3237d89f075be7a42d5fddb07b71837993e07a) Thanks [@tk-o](https://github.com/tk-o)! - Fixes SWR Cache management by cleaning up resources on application shutdown.

- Updated dependencies [[`5d3237d`](https://github.com/namehash/ensnode/commit/5d3237d89f075be7a42d5fddb07b71837993e07a)]:
  - @ensnode/ensnode-sdk@1.3.1
  - @ensnode/datasources@1.3.1
  - @ensnode/ensnode-schema@1.3.1
  - @ensnode/ponder-subgraph@1.3.1
  - @namehash/ens-referrals@1.3.0

## 1.3.0

### Minor Changes

- [#1358](https://github.com/namehash/ensnode/pull/1358) [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173) Thanks [@tk-o](https://github.com/tk-o)! - Introduces Name Tokens API.

- [#1379](https://github.com/namehash/ensnode/pull/1379) [`4bc9e82`](https://github.com/namehash/ensnode/commit/4bc9e82c288157fe29d00157160ae01517255728) Thanks [@Goader](https://github.com/Goader)! - Extended the `registrar-actions` endpoint to support filtering by `decodedReferrer` and pagination.

- [#1382](https://github.com/namehash/ensnode/pull/1382) [`9558b9f`](https://github.com/namehash/ensnode/commit/9558b9f6dd4aa65c81be067b82003bb9404f7137) Thanks [@Goader](https://github.com/Goader)! - Renamed `itemsPerPage` to `recordsPerPage` and `paginationContext` to `pageContext` in referrer leaderboard APIs to align with registrar actions terminology.

### Patch Changes

- Updated dependencies [[`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173), [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173), [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173), [`4bc9e82`](https://github.com/namehash/ensnode/commit/4bc9e82c288157fe29d00157160ae01517255728), [`9558b9f`](https://github.com/namehash/ensnode/commit/9558b9f6dd4aa65c81be067b82003bb9404f7137), [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173), [`f64dad6`](https://github.com/namehash/ensnode/commit/f64dad6fe5c8180d1a4549f75ee61598d7c64173)]:
  - @ensnode/ensnode-sdk@1.3.0
  - @namehash/ens-referrals@1.3.0
  - @ensnode/datasources@1.3.0
  - @ensnode/ensnode-schema@1.3.0
  - @ensnode/ponder-subgraph@1.3.0

## 1.2.0

### Minor Changes

- [#1345](https://github.com/namehash/ensnode/pull/1345) [`4cee4ba`](https://github.com/namehash/ensnode/commit/4cee4ba538e5655ca1e8b75f4d72738f3413c9d3) Thanks [@tk-o](https://github.com/tk-o)! - Enable auto-generated QuickNode RPC provider support with `QUICKNODE_API_KEY` and `QUICKNODE_ENDPOINT_NAME` environment variables.

- [#1318](https://github.com/namehash/ensnode/pull/1318) [`e35600f`](https://github.com/namehash/ensnode/commit/e35600fe9808f3c72960429b2a56a7f22893bff6) Thanks [@Goader](https://github.com/Goader)! - Add referrer detail endpoint API. Supports querying individual referrers whether they are ranked on the leaderboard or not.

### Patch Changes

- Updated dependencies [[`97e4545`](https://github.com/namehash/ensnode/commit/97e4545c70d8c7469f4bd566b91277fdb0c3a699), [`ea06a3c`](https://github.com/namehash/ensnode/commit/ea06a3cf7d802c6dd338676d0f2439185934e0ab), [`976e284`](https://github.com/namehash/ensnode/commit/976e2842f2e25ff0844471de48a34659b136b5be), [`e35600f`](https://github.com/namehash/ensnode/commit/e35600fe9808f3c72960429b2a56a7f22893bff6), [`4cee4ba`](https://github.com/namehash/ensnode/commit/4cee4ba538e5655ca1e8b75f4d72738f3413c9d3)]:
  - @ensnode/ensnode-sdk@1.2.0
  - @namehash/ens-referrals@1.2.0
  - @ensnode/datasources@1.2.0
  - @ensnode/ensnode-schema@1.2.0
  - @ensnode/ponder-subgraph@1.2.0

## 1.1.0

### Minor Changes

- [#1307](https://github.com/namehash/ensnode/pull/1307) [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582) Thanks [@tk-o](https://github.com/tk-o)! - Updates `ReferrerLeaderboard` data model and related logic to match updated ENS Holiday Awards rules.

- [#1307](https://github.com/namehash/ensnode/pull/1307) [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582) Thanks [@tk-o](https://github.com/tk-o)! - Renamed /ensanalytics/aggregated-referrers to /ensanalytics/referrers

- [#1307](https://github.com/namehash/ensnode/pull/1307) [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582) Thanks [@tk-o](https://github.com/tk-o)! - Refined schema for /ensanalytics/referrers response

### Patch Changes

- Updated dependencies [[`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582), [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582), [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582)]:
  - @ensnode/ensnode-sdk@1.1.0
  - @namehash/ens-referrals@1.1.0
  - @ensnode/datasources@1.1.0
  - @ensnode/ensnode-schema@1.1.0
  - @ensnode/ponder-subgraph@1.1.0

## 1.0.3

### Patch Changes

- Updated dependencies [[`4faad0b`](https://github.com/namehash/ensnode/commit/4faad0b534c5bbdfdeca4227565fe24ff29c3dd4)]:
  - @namehash/ens-referrals@1.0.1
  - @ensnode/ensnode-sdk@1.0.3
  - @ensnode/datasources@1.0.3
  - @ensnode/ensnode-schema@1.0.3
  - @ensnode/ponder-subgraph@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [[`f6aeb17`](https://github.com/namehash/ensnode/commit/f6aeb17330da0f73ee337a2f94a02cabbab6613e)]:
  - @ensnode/ensnode-sdk@1.0.2
  - @ensnode/datasources@1.0.2
  - @ensnode/ensnode-schema@1.0.2
  - @ensnode/ponder-subgraph@1.0.2
  - @namehash/ens-referrals@1.0.0

## 1.0.1

### Patch Changes

- Updated dependencies []:
  - @ensnode/datasources@1.0.1
  - @ensnode/ensnode-schema@1.0.1
  - @ensnode/ponder-subgraph@1.0.1
  - @ensnode/ensnode-sdk@1.0.1
  - @namehash/ens-referrals@1.0.0

## 1.0.0

### Major Changes

- [#1194](https://github.com/namehash/ensnode/pull/1194) [`af52f0b`](https://github.com/namehash/ensnode/commit/af52f0befda8220d56ff26a30208c196acb0d3cb) Thanks [@shrugs](https://github.com/shrugs)! - Introduces the ENSApi application, a separate, horizontally scalable ENSNode API server to replace the legacy `ponder serve` experience.

  Connecting ENSApi to:
  - your Postgres Database (`DATABASE_URL`, `DATABASE_SCHEMA`),
  - ENSIndexer (`ENSINDEXER_URL`), and
  - an ENS Root Chain RPC (`ALCHEMY_API_KEY`, `RPC_URL_*`)

  provides the following APIs:
  - ENSIndexer Config API (`/api/config`)
  - ENSIndexer Indexing Status API (`/api/indexing-status`)
  - Legacy ENS Subgraph GraphQL API (`/subgraph`)
  - ENSNode's Protocol-Accelerated Resolution API (`/api/resolve/*`)
    - (note: only accelerated if the `protocol-acceleration` plugin is enabled on the connected ENSIndexer)

  This results in a breaking change — `ponder serve` is no longer explicitly supported, and future deployments of ENSNode require the use of ENSApi to serve APIs previously available via Ponder's built-in API server.

### Minor Changes

- [#1239](https://github.com/namehash/ensnode/pull/1239) [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893) Thanks [@Goader](https://github.com/Goader)! - Introduces ENS Analytics API for tracking and analyzing referral metrics. Adds `/ensanalytics/aggregated-referrers` endpoint with pagination support to retrieve aggregated referrer metrics and contribution percentages.

- [#1238](https://github.com/namehash/ensnode/pull/1238) [`ff2a9b9`](https://github.com/namehash/ensnode/commit/ff2a9b9a3c53d6abb85134b94661088ebbe9e088) Thanks [@shrugs](https://github.com/shrugs)! - Introduces THEGRAPH_API_KEY environment variable: if this value is set, on the condition that
  the connected ENSIndexer is not sufficiently "realtime", ENSApi's Subgraph API will fallback
  to proxying subgraph queries it receives to The Graph's hosted subgraphs using this API key.

- [#1279](https://github.com/namehash/ensnode/pull/1279) [`11b8372`](https://github.com/namehash/ensnode/commit/11b8372ccb2456f2e71d9195f6e50b2fbbeb405a) Thanks [@Goader](https://github.com/Goader)! - Add configurable ENS Holiday Awards date range environment variables (`ENS_HOLIDAY_AWARDS_START` and `ENS_HOLIDAY_AWARDS_END`) to ENSApi. If not set, defaults to hardcoded values from `@namehash/ens-referrals` package. Includes validation to ensure end date is after or equal to start date. Dates must be specified in ISO 8601 format (e.g., '2025-12-01T00:00:00Z').

- [#1301](https://github.com/namehash/ensnode/pull/1301) [`7baefbd`](https://github.com/namehash/ensnode/commit/7baefbda39fca03d1cc77ece974136d7330919a8) Thanks [@tk-o](https://github.com/tk-o)! - Indexing Status cache only stores responses with `responseCode: IndexingStatusResponseCodes.Ok`.

- [#1302](https://github.com/namehash/ensnode/pull/1302) [`6659c57`](https://github.com/namehash/ensnode/commit/6659c57e487938761d642a5f46ff0e86baeac286) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `withReferral` filter for Registrar Actions API.

- [#1265](https://github.com/namehash/ensnode/pull/1265) [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2) Thanks [@tk-o](https://github.com/tk-o)! - Implement a HTTP endpoint for the Registrar Actions API.

### Patch Changes

- Updated dependencies [[`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`bbf0d3b`](https://github.com/namehash/ensnode/commit/bbf0d3b6e328f5c18017bd7660b1ff93e7214ce2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5), [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`11b8372`](https://github.com/namehash/ensnode/commit/11b8372ccb2456f2e71d9195f6e50b2fbbeb405a), [`617ab00`](https://github.com/namehash/ensnode/commit/617ab00cc57c2dc9df5af90eeaf3896f8864145d), [`63376ad`](https://github.com/namehash/ensnode/commit/63376ad8a4f1fe72b7ad5a9368496d235411bc28), [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`6659c57`](https://github.com/namehash/ensnode/commit/6659c57e487938761d642a5f46ff0e86baeac286), [`40658a7`](https://github.com/namehash/ensnode/commit/40658a70d591d972150f69cb18fbd3dd390b4114), [`6be7a18`](https://github.com/namehash/ensnode/commit/6be7a189d0f9ac21d89c01941eb6b5a3cd13f88f)]:
  - @ensnode/ensnode-sdk@1.0.0
  - @ensnode/ensnode-schema@1.0.0
  - @ensnode/datasources@1.0.0
  - @ensnode/ponder-subgraph@1.0.0
  - @namehash/ens-referrals@1.0.0

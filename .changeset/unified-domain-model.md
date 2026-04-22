---
"enssdk": major
"@ensnode/ensdb-sdk": major
"@ensnode/ensnode-sdk": major
"ensindexer": major
"ensapi": major
---

Unify `v1Domain` + `v2Domain` into a single polymorphic `domain` table discriminated by a `type` enum (`"ENSv1Domain"` | `"ENSv2Domain"`), and make Registry polymorphic across concrete ENSv1 (mainnet Registry, Basenames Registry, Lineanames Registry), ENSv1 Virtual (per-parent-domain virtual Registry managed by each ENSv1 domain that has children), and ENSv2 Registries.

### Breaking schema + id format changes

- `ENSv1DomainId` is now CAIP-shaped: `${ENSv1RegistryId}/${node}` (was `Node`). Every ENSv1 Domain is addressable through a concrete Registry, so bare `node` values no longer identify a Domain by themselves.
- `RegistryId` is a union of `ENSv1RegistryId`, `ENSv1VirtualRegistryId`, and `ENSv2RegistryId`. New id constructors: `makeENSv1RegistryId`, `makeENSv2RegistryId`, `makeENSv1VirtualRegistryId`. `makeENSv1DomainId` now takes `(AccountId, Node)`. `makeRegistryId` is retained as a union-returning helper for callsites that can't narrow.
- `domains` table: replaces `v1_domains` + `v2_domains`. Adds `type`, nullable `tokenId` (non-null iff ENSv2), nullable `node` (non-null iff ENSv1), nullable `rootRegistryOwnerId` (v1 only). `parentId` removed; parent relationships flow through `registryCanonicalDomain` for both v1 and v2.
- `registries` table: adds `type` enum column and nullable `node` (non-null iff `ENSv1VirtualRegistry`). Unique `(chainId, address)` index becomes a plain index so virtual Registries can share their concrete parent's `(chainId, address)`.
- `registryCanonicalDomain.domainId` is typed as the unified `DomainId`.

### GraphQL

- `Registry` becomes a GraphQL interface with `ENSv1Registry`, `ENSv1VirtualRegistry`, and `ENSv2Registry` implementations. `ENSv1VirtualRegistry` exposes `node: Node!`.
- `Domain` interface gains `parent: Domain` (resolved via the canonical-path dataloader); `ENSv1Domain` exposes `node: Node!` and `rootRegistryOwner`; `ENSv2Domain` exposes `tokenId`, `registry`, `subregistry`, `permissions`.
- `Query.registry(by: { contract })` now DB-looks up the concrete Registry by `(chainId, address, type IN (ENSv1Registry, ENSv2Registry))`. Virtual Registries are not addressable via `AccountId` alone.

### Migration

- Full reindex required. No in-place data migration.
- Closes #205, #1511, #1877.

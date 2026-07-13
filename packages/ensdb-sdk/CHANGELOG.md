# @ensnode/ensdb-sdk

## 1.17.0

### Minor Changes

- [#2296](https://github.com/namehash/ensnode/pull/2296) [`6542c89`](https://github.com/namehash/ensnode/commit/6542c89569add9fd315bb1f10a9263f59d52da20) Thanks [@shrugs](https://github.com/shrugs)! - Introduces the `efp.schema.ts` EFP plugin tables to the Abstract ENSIndexer Schema.

- [#2329](https://github.com/namehash/ensnode/pull/2329) [`eb33f1d`](https://github.com/namehash/ensnode/commit/eb33f1df137c00d17840bb99ecb072ced49259a6) Thanks [@shrugs](https://github.com/shrugs)! - Add public schema and ENSNode metadata helpers. `EnsDbReader` now exposes `schemaExists(schemaName)` and a public, typed `getEnsNodeMetadata({ key })` that returns the full `{ key, value }` record. `EnsDbWriter` now exposes `dropSchema(schemaName)`, `renameSchema(from, to)`, and a public `writeEnsNodeMetadata(metadata)` that re-keys a `SerializedEnsNodeMetadata` record to the writer's ENSIndexer schema. `SerializedEnsNodeMetadata` is now re-exported from the package entrypoint.

- [#2346](https://github.com/namehash/ensnode/pull/2346) [`ac07f68`](https://github.com/namehash/ensnode/commit/ac07f6807030386b1a226c84d08523d41a0635e0) Thanks [@tk-o](https://github.com/tk-o)! - Updated `isReady()` method in `EnsDbReader` to check for relevant database schemas existence.

### Patch Changes

- Updated dependencies [[`6542c89`](https://github.com/namehash/ensnode/commit/6542c89569add9fd315bb1f10a9263f59d52da20), [`edf120e`](https://github.com/namehash/ensnode/commit/edf120e13980ceccf075dede9f8dbfd10c5353af), [`af444c3`](https://github.com/namehash/ensnode/commit/af444c32a9afa5ed741e8b6dbbeafdfadf90f2ba), [`af444c3`](https://github.com/namehash/ensnode/commit/af444c32a9afa5ed741e8b6dbbeafdfadf90f2ba), [`566cab2`](https://github.com/namehash/ensnode/commit/566cab2e064496c3f248c1f22056a7c7e89f5b14), [`6abf99b`](https://github.com/namehash/ensnode/commit/6abf99b9bca9a54cef209e2ef32433397efa31dc)]:
  - enssdk@1.17.0
  - @ensnode/ensnode-sdk@1.17.0

## 1.16.0

### Minor Changes

- [#2292](https://github.com/namehash/ensnode/pull/2292) [`09b4aa5`](https://github.com/namehash/ensnode/commit/09b4aa5281875c7c3472358fa2bbb7f4991d9429) Thanks [@shrugs](https://github.com/shrugs)! - Add a `(value, coinType)` index on `resolver_address_records` to support reverse lookups of the Names whose `addr()` record points at a given address. Powers `Account.nameReferences` in the Omnigraph API.

### Patch Changes

- Updated dependencies []:
  - @ensnode/ensnode-sdk@1.16.0
  - enssdk@1.16.0

## 1.15.2

### Patch Changes

- [#2259](https://github.com/namehash/ensnode/pull/2259) [`5f929d8`](https://github.com/namehash/ensnode/commit/5f929d858a21e935b4b62ce6f2cbccc273623f96) Thanks [@shrugs](https://github.com/shrugs)! - Index-accelerate `REGISTRATION_TIMESTAMP` / `REGISTRATION_EXPIRY`-ordered domain queries (e.g. `Domain.subdomains(order: { by: REGISTRATION_TIMESTAMP, dir: DESC })`). Previously these joined `domains → latest_registration_indexes → registrations` and sorted the full registry partition — ~55s for `.eth`'s subdomains. The latest registration's start/expiry is now mirrored onto the Domain row (`__latestRegistrationStart` / `__latestRegistrationExpiry`) with composite indexes `(registry_id, <col>, id)`, turning the query into an index-ordered scan. The sort columns are NOT NULL — an absent value (no registration, or a never-expiring registration) is materialized as a `+∞` sentinel — so a single plain composite per column serves both directions with a plain keyset tuple, and the sentinel sorts last for ASC and first for DESC.

- [#2271](https://github.com/namehash/ensnode/pull/2271) [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523) Thanks [@shrugs](https://github.com/shrugs)! - The `resolvers` table gains an `is_extended` column — whether the Resolver implements ENSIP-10 wildcard resolution (`IExtendedResolver`, interfaceId `0x9061b923`) — populated at index time via a single cached `supportsInterface` RPC. The Omnigraph API exposes it as a new `Resolver.extended: Boolean!` field.

- [#2255](https://github.com/namehash/ensnode/pull/2255) [`c8267e4`](https://github.com/namehash/ensnode/commit/c8267e45099efd62e5690f19437c8aa242f77601) Thanks [@shrugs](https://github.com/shrugs)! - Add a materialized `domains.__canonical_name_prefix` column — the first 64 code points of `canonical_name` — to back left-anchored / substring search and NAME ordering. Direct-SQL consumers can now `WHERE __canonical_name_prefix LIKE 'vit%' ORDER BY __canonical_name_prefix` instead of replicating the previous `left(canonical_name, 256)` expression index. `canonical_name` is unchanged and remains the column for exact (`=` / `IN`) matches and display; the Omnigraph `name.starts_with` filter now targets the prefix column while continuing to return `canonical_name`.

- Updated dependencies [[`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523), [`0eec193`](https://github.com/namehash/ensnode/commit/0eec19344e576db7021ab4f16c420477efe9cd54), [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523)]:
  - @ensnode/ensnode-sdk@1.15.2
  - enssdk@1.15.2

## 1.15.1

### Patch Changes

- Updated dependencies []:
  - enssdk@1.15.1
  - @ensnode/ensnode-sdk@1.15.1

## 1.15.0

### Minor Changes

- [#2174](https://github.com/namehash/ensnode/pull/2174) [`bb0b244`](https://github.com/namehash/ensnode/commit/bb0b244e01b0ef7bba88c5ac5f9052fdddac4000) Thanks [@tk-o](https://github.com/tk-o)! - Added `destroy()` method to `EnsDbReader` class that allows cleaning up database connection resources when the connection is no longer needed.

### Patch Changes

- [#2155](https://github.com/namehash/ensnode/pull/2155) [`addfba6`](https://github.com/namehash/ensnode/commit/addfba696d5135a5433c471d2c9ce4575d165f71) Thanks [@shrugs](https://github.com/shrugs)! - Add three btree indexes to the indexer schema to fix slow `Domain.subdomains`, `get-domain-by-interpreted-name`, and `Query.domains` paths:
  - `domain_resolver_relations(domain_id)` — secondary lookup off the PK so the namegraph-walk CTE can left-join by `domain_id` alone.
  - `domains(registry_id, label_hash)` — composite (replaces the standalone `registry_id` index, which it subsumes via leading-column prefix).
  - `domains(registry_id, left(canonical_name, 256), id)` — expression composite for registry-scoped `WHERE registry_id = X ORDER BY canonical_name LIMIT N` (the `Domain.subdomains` shape). The 256-char prefix bounds the index tuple under btree's per-tuple max; NAME-ordered queries must sort by the same `left(...)` expression for the planner to use this index for ordered scan.

- Updated dependencies [[`9c40ef1`](https://github.com/namehash/ensnode/commit/9c40ef12b5c5e8a08aa1659b0626c0b87486a7d1), [`335f072`](https://github.com/namehash/ensnode/commit/335f0721459a883f9304a8d23ebc08503916f429)]:
  - enssdk@1.15.0
  - @ensnode/ensnode-sdk@1.15.0

## 1.14.0

### Minor Changes

- [#2101](https://github.com/namehash/ensnode/pull/2101) [`7dd0d3f`](https://github.com/namehash/ensnode/commit/7dd0d3ff2905caf357a74470d5630a9ca8bd3369) Thanks [@shrugs](https://github.com/shrugs)! - **Materialize `Domain.canonicalName`, `canonicalLabelHashPath`, and `canonicalNode`** on every Canonical Domain. Indexes: hash on `canonicalName` (exact lookup), GIN trigram on `canonicalName` (substring), GIN on `canonicalLabelHashPath` (heal cascade), hash on `canonicalNode` (resolver-record joins).

- [#2125](https://github.com/namehash/ensnode/pull/2125) [`f6ef397`](https://github.com/namehash/ensnode/commit/f6ef3977931b68997a40fd47755e0fca8d262093) Thanks [@shrugs](https://github.com/shrugs)! - **Materialize `Domain.canonicalPath` and `canonicalDepth`** on every Canonical Domain, alongside the existing `canonicalName` / `canonicalLabelHashPath` / `canonicalNode`. `canonicalPath` is the head-first array of ancestor DomainIds (parallel to `canonicalLabelHashPath`); `canonicalDepth` is the label count. Adds a `byCanonicalDepth` btree index for `ORDER BY canonical_depth` (typeahead, depth-ordered browse).

### Patch Changes

- [#2096](https://github.com/namehash/ensnode/pull/2096) [`75e8aac`](https://github.com/namehash/ensnode/commit/75e8aac2abb044ce55119daab98d20ebcbda8304) Thanks [@shrugs](https://github.com/shrugs)! - Replace the default btree index on `label.interpreted` with a hash index (for exact-match lookups) and a GIN trigram index (for substring / prefix `LIKE` queries). Avoids the btree 8191-byte leaf-size hazard that surfaces when a single label exceeds the limit (e.g. spam names), which previously crashed `create_indexes` at the historical→realtime boundary.

- Updated dependencies [[`3132a77`](https://github.com/namehash/ensnode/commit/3132a77b809694a4677da69c8c546a4b41eaa583), [`1b6abb0`](https://github.com/namehash/ensnode/commit/1b6abb06ac364840770dfcc47526111fdf6fb2c9), [`65cf37c`](https://github.com/namehash/ensnode/commit/65cf37c24c1bd9a7f30ad758c945015ece9c8461)]:
  - @ensnode/ensnode-sdk@1.14.0
  - enssdk@1.14.0

## 1.13.1

### Patch Changes

- Updated dependencies []:
  - @ensnode/ensnode-sdk@1.13.1
  - enssdk@1.13.1

## 1.13.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ensnode-sdk@1.13.0
  - enssdk@1.13.0

## 1.12.0

### Patch Changes

- Updated dependencies [[`4fb7b33`](https://github.com/namehash/ensnode/commit/4fb7b332fd46ee9924dc9dfb55b5a21ff8b8554a)]:
  - @ensnode/ensnode-sdk@1.12.0
  - enssdk@1.12.0

## 1.11.1

### Patch Changes

- Updated dependencies []:
  - enssdk@1.11.1
  - @ensnode/ensnode-sdk@1.11.1

## 1.11.0

### Minor Changes

- [#2016](https://github.com/namehash/ensnode/pull/2016) [`7e77c5c`](https://github.com/namehash/ensnode/commit/7e77c5c2bef96d1a2eb363871fb87379b5f6f7e9) Thanks [@shrugs](https://github.com/shrugs)! - `migrated_nodes` renamed to `migrated_nodes_by_parent` and re-keyed by composite `(parentNode, labelHash)` to match the payload of `ENSv1Registry(Old)#NewOwner` events. New sibling `migrated_nodes_by_node` keyed solely by `node` for the three `ENSv1RegistryOld` handlers (`Transfer` / `NewTTL` / `NewResolver`) that emit only `node`. Both rows are written together by the migration helper so each read site addresses whichever key matches its event payload. Schema definitions live in a new `migrated-nodes.schema.ts`.

- [#2056](https://github.com/namehash/ensnode/pull/2056) [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572) Thanks [@shrugs](https://github.com/shrugs)! - Introduced `IndexingMetadataContext` as a single record type in the ENSNode Metadata table, replacing three separate record types (`ensdb_version`, `ensindexer_public_config`, `ensindexer_indexing_status`).
  - `EnsDbReader`: added `getIndexingMetadataContext()`, `isHealthy()`, `isReady()`.
  - `EnsDbWriter`: added `upsertIndexingMetadataContext()`.
  - Old per-record read/write methods removed.
  - `EnsNodeMetadataKeys` reduced to a single `IndexingMetadataContext` key.

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

- [#1996](https://github.com/namehash/ensnode/pull/1996) [`c186ad8`](https://github.com/namehash/ensnode/commit/c186ad8c0d85c4db8619a436173d7e21f857f689) Thanks [@tk-o](https://github.com/tk-o)! - Made `EnsDbWriter.migrateEnsNodeSchema` race-condition safe.

- Updated dependencies [[`43d8a9b`](https://github.com/namehash/ensnode/commit/43d8a9b838b15719f520cd3f3bbfd1b52a4ad1ce), [`824d819`](https://github.com/namehash/ensnode/commit/824d819d291b2b642d2664d09cb10d6de69a6ea7), [`6173160`](https://github.com/namehash/ensnode/commit/61731608632f62139496656f6231210f63383f20), [`92ca54f`](https://github.com/namehash/ensnode/commit/92ca54fa2efbef3f32e2dacd8fdc347ef260a2af), [`7e77c5c`](https://github.com/namehash/ensnode/commit/7e77c5c2bef96d1a2eb363871fb87379b5f6f7e9), [`0d8a4b4`](https://github.com/namehash/ensnode/commit/0d8a4b4b7c8c70be904652e2132e7c67fd9e39ef), [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572), [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572), [`0e7c601`](https://github.com/namehash/ensnode/commit/0e7c6011abbb2f49fbf6ee89168919f2d58fa572), [`6173160`](https://github.com/namehash/ensnode/commit/61731608632f62139496656f6231210f63383f20)]:
  - @ensnode/ensnode-sdk@1.11.0
  - enssdk@1.11.0

## 1.10.1

### Patch Changes

- [#1984](https://github.com/namehash/ensnode/pull/1984) [`e92fa4d`](https://github.com/namehash/ensnode/commit/e92fa4d28f183b62fb6d9665db3332b43a46f279) Thanks [@shrugs](https://github.com/shrugs)! - Hotfix: moved the pg_trgm extension into the ensnode schema to avoid implicit dependency on 'public' schema existing.

- Updated dependencies [[`9d50f64`](https://github.com/namehash/ensnode/commit/9d50f647802fde286dfef2dc23c884801d06b228)]:
  - @ensnode/ensnode-sdk@1.10.1
  - enssdk@1.10.1

## 1.10.0

### Minor Changes

- [#1967](https://github.com/namehash/ensnode/pull/1967) [`5f341e1`](https://github.com/namehash/ensnode/commit/5f341e14420146db772fc01b1b3c0f4e2d4a3cb7) Thanks [@shrugs](https://github.com/shrugs)! - Resolution API: support `contenthash`, `pubkey`, `abi`, `interfaces`, `dnszonehash`, and `version` selection. Protocol acceleration indexes `contenthash`, `pubkey`, `dnszonehash`, and handles `VersionChanged` (clears records for the node, bumps version). `ABI` (bitmask query, contract-equivalent) and `interface` records are selectable but always resolved via RPC. Adds `ContentType` / `InterfaceId` / `RecordVersion` semantic types to `enssdk`.

- [#1868](https://github.com/namehash/ensnode/pull/1868) [`c336c79`](https://github.com/namehash/ensnode/commit/c336c79b08e46ce53caa536ebf6158eba9f3e017) Thanks [@tk-o](https://github.com/tk-o)! - Added `validateEnsDbConfig` function to support validation for the `EnsDbConfig` data model.

- [#1856](https://github.com/namehash/ensnode/pull/1856) [`fc88ee5`](https://github.com/namehash/ensnode/commit/fc88ee5f910de1a94ce2734776d4a5640f839641) Thanks [@shrugs](https://github.com/shrugs)! - Re-enable `subgraph_domain.name` indexes (originally disabled in #1819) by pairing a hash index for exact-match lookups with a GIN trigram index (`gin_trgm_ops`) for partial-match filters (`_contains`, `_starts_with`, `_ends_with`). The hash index avoids the btree 8191-byte row size limit triggered by spam names. The trigram index requires the `pg_trgm` Postgres extension, which ENSIndexer now installs automatically via a Drizzle migration (`0001_enable_ext_pg_trgm.sql`) that runs before Ponder starts.

- [#1913](https://github.com/namehash/ensnode/pull/1913) [`4c51c75`](https://github.com/namehash/ensnode/commit/4c51c75ec8b3807d0aa988618893b2da07e11a83) Thanks [@tk-o](https://github.com/tk-o)! - Exported `ENSDB_SCHEMA_CHECKSUM` const which changes when ENSDb Schema definition changes.

### Patch Changes

- Updated dependencies [[`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`29afaa6`](https://github.com/namehash/ensnode/commit/29afaa6ad8a3f3c8133241cf1a9324980498ded4), [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`7fca45d`](https://github.com/namehash/ensnode/commit/7fca45d09dc6e3456fec2cae0827e9d2c54827a6), [`29fcfc7`](https://github.com/namehash/ensnode/commit/29fcfc7a1ab01c3214b5c16fc0e4a349010e9360), [`5f341e1`](https://github.com/namehash/ensnode/commit/5f341e14420146db772fc01b1b3c0f4e2d4a3cb7), [`d9ab6b0`](https://github.com/namehash/ensnode/commit/d9ab6b07c0e77bfdd3a49326e75caaa14d7ca2e5), [`b8f5be7`](https://github.com/namehash/ensnode/commit/b8f5be761748f75c06ba4da81dd6098eec6ebb9a), [`4c99177`](https://github.com/namehash/ensnode/commit/4c991777ac13ffd2cc1fb947e5a47bd7733b112b), [`b2481d6`](https://github.com/namehash/ensnode/commit/b2481d6dae6f704493140aa63cd4ad1bfd3e3301), [`9abb302`](https://github.com/namehash/ensnode/commit/9abb30238374f0847a68615827dddafb6dc05dad), [`ed6ee96`](https://github.com/namehash/ensnode/commit/ed6ee9641bfa6f42ddc95955cf8b013c93bf2f4a), [`677db8b`](https://github.com/namehash/ensnode/commit/677db8b67effc6d530716c0a1902244dba56d787)]:
  - @ensnode/ensnode-sdk@1.10.0
  - enssdk@1.10.0

## 1.9.0

### Minor Changes

- [#1832](https://github.com/namehash/ensnode/pull/1832) [`9f52a66`](https://github.com/namehash/ensnode/commit/9f52a662e5828e944210f35d47571661899fc30e) Thanks [@tk-o](https://github.com/tk-o)! - Hotfixed the `buildConcreteEnsIndexerSchema` function by replacing the cloning approach with working mutation approach.

- [#1809](https://github.com/namehash/ensnode/pull/1809) [`aaa471f`](https://github.com/namehash/ensnode/commit/aaa471f0a33d0f96389e706dcaed2b704e2952ea) Thanks [@tk-o](https://github.com/tk-o)! - Renamed the `client` getter on `EnsDbReader` class to `ensDb`.

### Patch Changes

- Updated dependencies [[`70e6f24`](https://github.com/namehash/ensnode/commit/70e6f2475a566135602f4adbcf44df2a6f74e5fd), [`387715e`](https://github.com/namehash/ensnode/commit/387715e1bc4c996c0ae7545bfc78b79149e04f58)]:
  - @ensnode/ensnode-sdk@1.9.0

## 1.8.1

### Patch Changes

- [#1820](https://github.com/namehash/ensnode/pull/1820) [`12f279d`](https://github.com/namehash/ensnode/commit/12f279da603da358869a709cc8a7a8c0d56080e5) Thanks [@tk-o](https://github.com/tk-o)! - Temporarily removed the `byName` index on `subgraph_domains` table in ENSDb.

- Updated dependencies []:
  - @ensnode/ensnode-sdk@1.8.1

## 1.8.0

### Minor Changes

- [#1772](https://github.com/namehash/ensnode/pull/1772) [`5ce102e`](https://github.com/namehash/ensnode/commit/5ce102e11c7b891844b0762cffa45ade1a997e0f) Thanks [@tk-o](https://github.com/tk-o)! - Renamed `@ensnode/ensnode-schema` to `@ensnode/ensdb-sdk`.

- [#1798](https://github.com/namehash/ensnode/pull/1798) [`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772) Thanks [@tk-o](https://github.com/tk-o)! - Moved `ensdb` module from ENSNode SDK into ENSDb SDK.

- [#1778](https://github.com/namehash/ensnode/pull/1778) [`d6dd425`](https://github.com/namehash/ensnode/commit/d6dd4252f690daba13bf02aa53a1ef3e868c823e) Thanks [@tk-o](https://github.com/tk-o)! - Created isolated database schema definitions: ENSIndexer Schema and ENSNode Schema.

- [#1779](https://github.com/namehash/ensnode/pull/1779) [`5ac81cb`](https://github.com/namehash/ensnode/commit/5ac81cb42ad3a4bf561d82c2dd628e85988240ef) Thanks [@tk-o](https://github.com/tk-o)! - Introduced toolkit for managing ENSDb migrations for ENSNode Schema.

- [#1798](https://github.com/namehash/ensnode/pull/1798) [`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772) Thanks [@tk-o](https://github.com/tk-o)! - Introduced two client implementations for ENSDb: `EnsDbReader` and `EnsDbWriter`.

### Patch Changes

- Updated dependencies [[`f0007b4`](https://github.com/namehash/ensnode/commit/f0007b43a11645efc7efc3c9563f36254352c772), [`9ea8580`](https://github.com/namehash/ensnode/commit/9ea858055109eaf3a92d210f2b3d9170232a32e8)]:
  - @ensnode/ensnode-sdk@1.8.0

## 1.7.0

## 1.6.0

### Minor Changes

- [#1660](https://github.com/namehash/ensnode/pull/1660) [`9bffd55`](https://github.com/namehash/ensnode/commit/9bffd55963a93921b196e94edf7dfd934a491842) Thanks [@tk-o](https://github.com/tk-o)! - Includes schema for `ENSNodeMetadata`.

## 1.5.1

## 1.5.0

### Minor Changes

- [#1527](https://github.com/namehash/ensnode/pull/1527) [`dc7e07f`](https://github.com/namehash/ensnode/commit/dc7e07f6e69e30d597a871b79bd2c6876de9f8cc) Thanks [@tk-o](https://github.com/tk-o)! - Update `registrars` schema to enable storing at most one metadata record.

## 1.4.0

### Minor Changes

- [#1280](https://github.com/namehash/ensnode/pull/1280) [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec) Thanks [@shrugs](https://github.com/shrugs)! - Introduces the ENSv2 Plugin ('ensv2') for indexing both ENSv1 and the future ENSv2 protocol.

## 1.3.1

## 1.3.0

## 1.2.0

## 1.1.0

## 1.0.3

## 1.0.2

## 1.0.1

## 1.0.0

### Minor Changes

- [#1257](https://github.com/namehash/ensnode/pull/1257) [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5) Thanks [@tk-o](https://github.com/tk-o)! - Replace `referrals` schema with new `registrarActions` schema.

- [#1249](https://github.com/namehash/ensnode/pull/1249) [`617ab00`](https://github.com/namehash/ensnode/commit/617ab00cc57c2dc9df5af90eeaf3896f8864145d) Thanks [@tk-o](https://github.com/tk-o)! - Introduces a new `registrars` plugin for tracking all registrations and renewals for direct subnames of `eth`, `base.eth`, and `linea.eth`.

- [#1265](https://github.com/namehash/ensnode/pull/1265) [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2) Thanks [@tk-o](https://github.com/tk-o)! - Update `registrant` field type on the `registrars` schema to store hex values.

## 0.36.0

## 0.35.0

### Minor Changes

- [#1001](https://github.com/namehash/ensnode/pull/1001) [`7ccaa65`](https://github.com/namehash/ensnode/commit/7ccaa65c5142f0491d7f1882cd84eed7e0d3c8ea) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Index mappings between ENS names and their ownership controlling tokens.

## 0.34.0

### Minor Changes

- [#970](https://github.com/namehash/ensnode/pull/970) [`373e934`](https://github.com/namehash/ensnode/commit/373e9343f7ac14010ae9a995cb812c42210c92e2) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Initial launch of ENS TokenScope with support for indexing Seaport sales.

## 0.33.0

## 0.32.0

### Minor Changes

- [#902](https://github.com/namehash/ensnode/pull/902) [`a769e90`](https://github.com/namehash/ensnode/commit/a769e9028a0dd55b88e62fe90669c5dc54e51485) Thanks [@shrugs](https://github.com/shrugs)! - include schema to index an account's primary name records as emitted by StandaloneReverseRegistrars

## 0.31.0

## 0.30.0

## 0.29.0

## 0.28.0

### Minor Changes

- [#746](https://github.com/namehash/ensnode/pull/746) [`9aeaccd`](https://github.com/namehash/ensnode/commit/9aeaccd1034b970dc3a770a349292e65ba53cd2d) Thanks [@shrugs](https://github.com/shrugs)! - addded resolver record value entities to schema

## 0.27.0

### Minor Changes

- [#706](https://github.com/namehash/ensnode/pull/706) [`fcea8c1`](https://github.com/namehash/ensnode/commit/fcea8c1fbcc19b3948ecf7d1bef61c38480e8e7d) Thanks [@shrugs](https://github.com/shrugs)! - renamed @ensnode/ponder-schema to @ensnode/ensnode-schema

## 0.26.0

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.1

## 0.22.0

## 0.21.0

## 0.20.0

## 0.19.4

## 0.19.3

## 0.19.2

## 0.19.1

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

## 0.6.0

## 0.1.0

### Minor Changes

- 6941f0b: Initial Release

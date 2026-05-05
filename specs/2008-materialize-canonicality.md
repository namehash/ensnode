# Materialize Canonicality (#2008)

Replaces TODO(canonical-names) heuristics + `registryCanonicalDomain` with materialized `Registry.canonical` and `Domain.canonical`. All canonicality logic lives in the `ensv2` plugin and uses PK-only ops (Ponder cache constraint).

Related: #1423 (Registry Canonical Domain). Builds on the indexed `ParentUpdated` signal added in ensdomains/contracts-v2#209.

## Goals

1. `Registry.canonical: boolean` and `Domain.canonical: boolean` materialized at index time.
2. Replace `registryCanonicalDomain` join table with `Registry.canonicalDomainId` (forward to parent Domain) and reciprocal `Domain.canonicalSubregistryId` (forward to canonical child Registry).
3. Replace runtime CTEs (`canonical-registries-cte.ts`, `get-canonical-path.ts`, `find-domains` upward CTE) with PK reads on the materialized columns.
4. Treat exactly one Root Registry as canonical: ENSv2 root if defined, else ENSv1 root. Drop `getRootRegistryIds()`; bridged shadow registries become canonical via the Bridged Resolver event chain instead of being hardcoded as roots.
5. Constraint: every operation on the indexer hot path must be a PK read or write — no secondary-index reads, no array columns that grow unbounded.

## Schema (`packages/ensdb-sdk/src/ensindexer-abstract/ensv2.schema.ts`)

### `registry`

Add:
- `canonical: t.boolean().notNull().default(false)`
- `canonicalDomainId: t.text().$type<DomainId>()` — parent Domain in the canonical nametree
- `firstDomainId: t.text().$type<DomainId>()` — head of doubly-linked list of child Domains

### `domain`

Add:
- `canonical: t.boolean().notNull().default(false)`
- `canonicalSubregistryId: t.text().$type<RegistryId>()` — reciprocal of `Registry.canonicalDomainId`. Required so reverse traversal (Domain → its canonical child Registry) is a PK read.
- `prevDomainInRegistryId: t.text().$type<DomainId>()`
- `nextDomainInRegistryId: t.text().$type<DomainId>()`

Drop:
- `registryCanonicalDomain` table and `TODO(canonical-names)` markers.
- `bySubregistry` index on `Domain.subregistryId` if no consumer needs it post-cleanup (verify via grep).

### Doubly-linked list rationale

Iteration of a Registry's child Domains is needed when canonicality flips. Options considered:

| Option | Insert | Iterate | Remove | Hot-path safe |
|---|---|---|---|---|
| `Registry.domainIds: text[]` | O(N) rewrite per insert | O(1) read | O(N) | No — `.eth` is millions |
| Doubly-linked list | O(1) PK | O(N) PK reads | O(1) PK | Yes |
| Secondary index on `registryId` | implicit | O(N) but forces flush | implicit | No — flushes Postgres |

Doubly-linked because Domains can be removed from a Registry (ENSv2 expiration/deletion paths). Insert at head: `prev=null`, `next=registry.firstDomainId`; old head's `prev=newId`; `registry.firstDomainId=newId`. Removal: `prev.next=next`; `next.prev=prev`; if removed was head, advance `firstDomainId`.

## Helpers

New module: `apps/ensindexer/src/lib/ensv2/canonicality-db-helpers.ts`.

```ts
appendDomainToRegistry(ctx, registryId, domainId)
removeDomainFromRegistry(ctx, registryId, domainId)

setRegistryCanonicalDomain(ctx, registryId, newCanonicalDomainId | null)
  // Maintains the bidirectional invariant:
  //   at most one canonicalDomain per Registry, at most one canonicalSubregistry per Domain.
  //
  // 1. prevD = registry.canonicalDomainId
  //    if prevD && prevD !== newD: clear prevD.canonicalSubregistryId
  // 2. if newD:
  //      prevR = newD.canonicalSubregistryId
  //      if prevR && prevR !== registryId:
  //        clear prevR.canonicalDomainId
  //        updateRegistryCanonicality(prevR, false)   // orphaned subtree
  // 3. registry.canonicalDomainId = newD
  //    if newD: newD.canonicalSubregistryId = registryId
  // 4. shouldBe = newD ? newD.canonical : false
  //    if registry.canonical !== shouldBe:
  //      updateRegistryCanonicality(registryId, shouldBe)

updateRegistryCanonicality(ctx, registryId, canonical, visited = new Set<RegistryId>())
  // Cycle guard required (ENSv2 graphs are not trees).
  // if visited.has(registryId) return; visited.add(registryId)
  // registry.canonical = canonical
  // walk firstDomainId → next… via PK reads:
  //   domain.canonical = canonical
  //   if domain.canonicalSubregistryId: recurse
```

Cost discipline: every step is a PK read/write. The walk is O(N) PK reads only when canonicality of a Registry actually flips. For `.eth`'s virtual registry (canonical at birth, never flips because root never moves), the walk is never executed despite N being large. Bridged Resolver hookups and ENSv2 re-parenting are bounded by the size of the affected subtree and run at most once per topology change.

## Initial canonicality (lazy, no seeding)

No setup hook. When a Registry row is ensured (any handler), check `id === getRootRegistryId(namespace)`:
- yes: insert with `canonical: true, canonicalDomainId: null`
- no: defaults (`canonical: false`)

`getRootRegistryId(namespace)` returns ENSv2 root if defined, else ENSv1 root. **Exactly one Registry is canonical at boot**; all others derive canonicality from `canonicalDomainId` ancestry or from a Bridged Resolver attach.

Drop `getRootRegistryIds()` from `packages/ensnode-sdk/src/shared/root-registry.ts`. Migrate every caller to `getRootRegistryId()` or remove. With v2 defined, ENSv1 names are non-canonical in the new model — see [Open Questions](#open-questions).

## Handlers (all in `apps/ensindexer/src/plugins/ensv2/`)

### `handlers/ensv1/ENSv1Registry.ts` — `handleNewOwner`

Drop the `registryCanonicalDomain` insert.

TLD branch:
- ensure ENSv1Registry with `canonical: id === getRootRegistryId(namespace)`.

Non-TLD branch:
- ensure ENSv1VirtualRegistry (default `canonical: false`).
- if newly created (use upsert + read-back, or returning): call `setRegistryCanonicalDomain(virtualRegistryId, parentDomainId)`. ENSv1 has no re-parenting; the first set sticks.

After upserting child Domain (newly inserted only — skip on re-owner):
- `appendDomainToRegistry(parentRegistryId, domainId)`
- read parent registry once; set `domain.canonical = parentRegistry.canonical` inline (avoids a recursion pass for the trivial single-child case).

### `handlers/ensv2/ENSv2Registry.ts`

`LabelRegistered` / `LabelReserved`:
- ensure registry with `canonical: id === getRootRegistryId(namespace)`.
- after Domain upsert (newly inserted only): `appendDomainToRegistry(registryId, domainId)`; inline `domain.canonical = registry.canonical`.

`SubregistryUpdated`:
- keep raw `Domain.subregistryId` set/clear (this is on-chain truth from the parent's perspective).
- drop `registryCanonicalDomain` ops.
- ensureRegistry for the new subregistry id (lazy creation; canonicality remains `false` until `ParentUpdated`).
- **Does not touch canonicality.** `ParentUpdated` is the canonical signal.

`ParentUpdated` (NEW handler) — args `(parent: address, label: string, sender)`:
- `interpretAddress(parent)` — `null` means unparenting.
- `parentRegistry = { chainId, address: parent }` (same chain).
- `parentDomainId = makeENSv2DomainId(parentRegistry, makeStorageId(hexToBigInt(labelhash(label))))`.
- ensureLabel(label); ensureRegistry(parentRegistry) onConflictDoNothing.
- `setRegistryCanonicalDomain(thisRegistryId, parentDomainId | null)`.

`LabelUnregistered`: row stays (expiry only); no list removal. Revisit if a true delete path is added.

`TokenRegenerated`: unchanged — no canonicality impact.

### Bridged Resolvers

Add handlers in the **`ensv2` plugin** (separate from `protocol-acceleration`'s `ensureDomainResolverRelation`; that helper continues handling its own concern):

`ENSv1Registry:NewResolver` and `ENSv2Registry:ResolverUpdated`:
1. Read prior `domainResolverRelation` to learn the previous resolver.
2. `prev = isBridgedResolver(namespace, prevResolver)`; `next = isBridgedResolver(namespace, newResolver)`.
3. If `prev && (!next || prev.registry !== next.registry)`: detach. Compute `prevBridgedRegId` (rules below); `setRegistryCanonicalDomain(prevBridgedRegId, null)`.
4. If `next`: attach. Compute `nextBridgedRegId`; ensureRegistry on cross-chain target; `setRegistryCanonicalDomain(nextBridgedRegId, originatingDomainId)`.

Bridged Registry id resolution:
- ENSv1 (`shadow: true`, e.g. Basenames/Lineanames): the effective root of the shadow tree is the ENSv1VirtualRegistry within the shadow contract whose `node` matches the originating Domain's namehash. `bridgedRegId = makeENSv1VirtualRegistryId(target.registry, originatingNode)`. Cross-chain insert allowed; the originating Domain lives on ENSRoot, the virtual registry lives on the shadow chain.
- ENSv2 (`shadow: false`): `bridgedRegId = makeENSv2RegistryId(target.registry)`. Direct mapping.

Outcome: Basenames and Lineanames shadow trees are canonical only after the L1Resolver hookup, instead of being hardcoded as roots.

## ENSapi cleanup (in this PR)

- Delete `apps/ensapi/src/omnigraph-api/lib/find-domains/canonical-registries-cte.ts`. Replace consumers with `where(eq(domain.canonical, true))` or `where(eq(registry.canonical, true))`.
- Rewrite `apps/ensapi/src/omnigraph-api/lib/get-canonical-path.ts` as a PK ascent: short-circuit return null if `domain.canonical === false`; otherwise walk `domain → registry → registry.canonicalDomainId → domain → …` until `registry.canonicalDomainId IS NULL`. Recursive CTE only if perf measurement says so; per-row PK loop is likely fine.
- Rewrite `apps/ensapi/src/omnigraph-api/lib/find-domains/layers/base-domain-set.ts`: `parentId` derived via single LEFT JOIN `domain.registryId → registry.canonicalDomainId`. No edge auth needed — materialization guarantees consistency.
- Rewrite `apps/ensapi/src/omnigraph-api/lib/find-domains/layers/filter-by-name.ts`: drop the upward recursive CTE; either build the upward path with depth-bounded joins on `registry.canonicalDomainId`, or keep a recursive CTE rooted in `registry` directly (no `registryCanonicalDomain` table).
- Update all `getRootRegistryIds` callers to `getRootRegistryId` or remove.

## Tests

- ENSv1 cold register `vitalik.eth`: `eth` virtual reg born, `canonical=true`; `vitalik.eth` Domain `canonical=true`. Subsequent `domain.eth` registration → inline `canonical=true` via parent registry read.
- ENSv2 `ParentUpdated`: R fires `ParentUpdated(P, "foo")` → `R.canonicalDomainId = foo-in-P`; `foo-domain.canonicalSubregistryId = R`; canonicality propagates from `foo-domain`.
- ENSv2 re-parent: R was parent of D1, `ParentUpdated` to D2 → `D1.canonicalSubregistryId` cleared; `D2.canonicalSubregistryId = R`; full subtree canonicality recomputed.
- ENSv2 unparent: `ParentUpdated(parent=zero)` → R detached; `R.canonical=false` propagates.
- Bridged Resolver attach: `base.eth.resolver = BasenamesL1Resolver` on ENSRoot → Basenames `base.eth`-virtual-registry on Base (cross-chain) gets `canonicalDomainId = base.eth-on-mainnet`; `canonical=true` cascades over already-indexed children.
- Bridged Resolver attach (no children yet): hookup before any basenames registered → empty cascade; virtual registry pre-created with `canonical=true`; later registrations inline-inherit.
- Bridged Resolver detach: resolver flipped to non-bridged → shadow virtual reg + subtree flip to `canonical=false`.
- Cycle: A → B → A via `SubregistryUpdated`/`ParentUpdated` → recursion bounded by `visited` set; both non-canonical (no path to root).
- Domain removal (when added): `removeDomainFromRegistry` correctly relinks neighbors and head pointer.

## Open questions

1. **`ENSv2Domain.v1Domain` forward pointer.** A reserved/canonical v2 Domain often has its records sourced from a v1 name at resolution time. Computing the v1 Domain id requires the canonical labelhash path, derivable from `namehash(labelHashPath)` and `makeENSv1DomainId(getENSv1Registry, node)`. Path materialization is itself a follow-on. Include here as a derived column updated alongside canonicality recursion (each `updateRegistryCanonicality` recomputes child v1Domain ids), or defer entirely?
2. **`Domain.subregistryId` raw vs `canonicalSubregistryId`.** Confirmed both retained. For Bridged Resolver case, raw points at whatever `SubregistryUpdated` set (possibly nothing); canonical points at the bridged target. They diverge intentionally. Confirm consumers don't conflate.
3. **ENSv1 NewResolver cross-chain ordering.** Mainnet ENSv1Registry NewResolver fires on a different chain than the shadow Basenames Registry; the handler running on ENSRoot writes to a Base-chain Registry row. Confirm Ponder's cross-chain write semantics + ordering match what's needed (the shadow virtual reg must exist or be ensure'd at the moment of hookup).
4. **`bySubregistry` index drop.** With `canonicalSubregistryId` materialized, do any code paths still need a secondary index on raw `Domain.subregistryId`? Grep before dropping.
5. **ENSv1 root non-canonical when v2 exists.** Every `find-domains` query previously returning v1 names now excludes them unless explicitly opted-in. Is a separate query path or flag needed for "all indexed names regardless of canonical"?
6. **Bridged Resolver detach fallback.** If Domain D had `subregistryId = R` via `SubregistryUpdated` AND a Bridged Resolver attached to `R_bridged`, on detach the canonicalSubregistryId should presumably fall back to R if R still considers D its canonical parent. Re-derivation: read R.canonicalDomainId, if it === D restore the link, else null. Confirm desired behavior.
7. **`ParentUpdated` ordering relative to Registry creation.** Does the child Registry contract necessarily exist (have indexed events) before its `ParentUpdated` fires? If not, `ensureRegistry(thisRegistryId)` upsert at handler entry. Should already be no-op-safe.

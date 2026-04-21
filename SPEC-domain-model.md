# SPEC: Unified polymorphic `domain` + `registry`

Tracking: closes [#205](https://github.com/namehash/ensnode/issues/205), [#1511](https://github.com/namehash/ensnode/issues/1511), [#1877](https://github.com/namehash/ensnode/issues/1877).

## Goal

Merge `v1Domain` + `v2Domain` into a single polymorphic `domain` table. Make Registry polymorphic (ENSv1 / ENSv1Virtual / ENSv2) with a GraphQL interface mirroring Domain/Registration. ENSv1 `DomainId` becomes CAIP-shaped: `${ENSv1RegistryId}/${node}`.

After this refactor, `find-domains`, protocol acceleration logic, and `get-domain-by-interpreted-name` operate over single unified tables.

## Conceptual model

- **Concrete ENSv1Registry** — an actual ENSv1 Registry contract (main ENS Registry on mainnet, Basenames Registry on Base, Lineanames Registry on Linea — the latter two are "shadow" ENSv1 registries).
- **ENSv1VirtualRegistry** — a virtual registry managed by each ENSv1 domain that has children. Lazily upserted when a subname is created. Keyed by `(chainId, address, node)` where `(chainId, address)` is the concrete Registry that housed the parent domain, and `node` is the parent's namehash.
- **ENSv2Registry** — existing ENSv2 Registry contracts (unchanged behavior).

Every ENSv1 domain has `registryId` pointing at either:
- the concrete Registry, if the domain's parent is the Registry's Managed Name (e.g. `foo.eth` → concrete eth Registry); or
- the parent's virtual registry, otherwise (e.g. `sub.foo.eth` → virtual registry for `foo.eth`).

The virtual registry for a parent domain is upserted only when the parent's first child is indexed. Upon upsert, `registryCanonicalDomain(virtualRegistryId → parentDomainId)` is also upserted (self-link) so reverse traversal works uniformly with ENSv2.

The two nametrees (ENSv1 and ENSv2) are disjoint by design. Cross-chain bridging (mainnet ↔ Basenames/Lineanames) is handled by protocol-acceleration's bridged resolver, not by wiring `subregistryId` across chains.

## Resolved decisions

- `registryType` and `domainType` are `onchainEnum`s in the schema; TypeScript types are inferred (follow the `registrationType` pattern).
- `registry` table adds `type`. Replaces `uniqueIndex(chainId, address)` with a plain `index(chainId, address)`.
- `registry` table adds `node` (nullable, no index). Invariant: `node IS NOT NULL` iff `type === "ENSv1VirtualRegistry"`. Exposed on `ENSv1VirtualRegistryRef` only.
- ID shapes:
  - `ENSv1RegistryId` = branded CAIP-10 string
  - `ENSv2RegistryId` = branded CAIP-10 string
  - `ENSv1VirtualRegistryId = ${ENSv1RegistryId}/${node}`
  - `ENSv1DomainId = ${ENSv1RegistryId}/${node}` (same shape as virtual; distinct tables)
- ENSv1 `handleNewOwner` parent-registry selection:
  ```ts
  const { node: managedNode } = getManagedName(registry);
  const parentRegistryId =
    parentNode === managedNode
      ? registryId
      : makeENSv1VirtualRegistryId(registry, parentNode);
  ```
  If `parentRegistryId !== registryId`, upsert the virtual registry row and upsert `registryCanonicalDomain(parentVirtualRegistryId → parentDomainId)`.
- Handler variable pattern: `registry = getThisAccountId(context, event)`, `registryId = makeENSv1RegistryId(registry)`, and `virtualRegistryId` when needed.
- Concrete `ENSv1Registry` row upserted with `onConflictDoNothing` on first event.
- `ENSv2Domain.tokenId` column is nullable in the schema; derived `ENSv2Domain` TS type asserts non-null via `RequiredAndNotNull`. Invariant assumed, no runtime check. Same pattern for `ENSv1VirtualRegistry.node`.
- `get-domain-by-interpreted-name.ts` keeps `Promise.all([v1, v2])` parallel fetching. Each traversal queries the unified `domain` table but is rooted at its respective ENSv1 or ENSv2 root registry.
- `parent` field moves from `ENSv1Domain` to the `Domain` interface; resolved via the canonical-path dataloader (`results[1]`).
- `Registry` becomes a GraphQL interface with `ENSv1Registry`, `ENSv1VirtualRegistry`, and `ENSv2Registry` implementations, following the `RegistrationInterfaceRef` pattern.
- `RegistryIdInput` AccountId path filters `type IN ('ENSv1Registry', 'ENSv2Registry')` (excludes virtual).
- `filter-by-parent.ts` needs no changes — works automatically once `domainsBase` is unified.
- Full reindex (no migrations). Single PR, multiple green commits. Single cross-package breaking changeset.
- Add `getENSv1RootRegistryId(namespace)` helper in `packages/ensnode-sdk/src/shared/root-registry.ts`.

---

## Commit 1 — types + ID makers (`packages/enssdk`)

**`src/lib/types/ensv2.ts`**

```ts
export type ENSv1RegistryId = AccountIdString & { __brand: "ENSv1RegistryId" };
export type ENSv2RegistryId = AccountIdString & { __brand: "ENSv2RegistryId" };
export type ENSv1VirtualRegistryId = string & { __brand: "ENSv1VirtualRegistryId" };
// shape: ${ENSv1RegistryId}/${node}

export type RegistryId = ENSv1RegistryId | ENSv1VirtualRegistryId | ENSv2RegistryId;

export type ENSv1DomainId = string & { __brand: "ENSv1DomainId" };
// shape: ${ENSv1RegistryId}/${node} (no longer Node-derived)

export type DomainId = ENSv1DomainId | ENSv2DomainId; // unchanged union
```

**`src/lib/ids.ts`**

```ts
export const makeENSv1RegistryId = (acc: AccountId) =>
  stringifyAccountId(acc) as ENSv1RegistryId;
export const makeENSv2RegistryId = (acc: AccountId) =>
  stringifyAccountId(acc) as ENSv2RegistryId;

export const makeENSv1VirtualRegistryId = (acc: AccountId, node: Node) =>
  `${makeENSv1RegistryId(acc)}/${node}` as ENSv1VirtualRegistryId;

export const makeENSv1DomainId = (acc: AccountId, node: Node) =>
  `${makeENSv1RegistryId(acc)}/${node}` as ENSv1DomainId; // BREAKING: now takes acc + node

// makeENSv2DomainId unchanged
// keep makeRegistryId if still used by union callsites
```

**Validate:** `pnpm -F enssdk typecheck`.

---

## Commit 2 — root helper + unified schema

**`packages/ensnode-sdk/src/shared/root-registry.ts`**

Add `getENSv1RootRegistryId(namespace)` and `maybeGetENSv1RootRegistryId(namespace)` mirroring the v2 helpers. Resolves the concrete ENSv1 root Registry (ENSRoot datasource) per namespace.

**`packages/ensdb-sdk/src/ensindexer-abstract/ensv2.schema.ts`**

Add enums:

```ts
export const registryType = onchainEnum("RegistryType", [
  "ENSv1Registry",
  "ENSv1VirtualRegistry",
  "ENSv2Registry",
]);

export const domainType = onchainEnum("DomainType", [
  "ENSv1Domain",
  "ENSv2Domain",
]);
```

`registry` table:

```ts
export const registry = onchainTable(
  "registries",
  (t) => ({
    id: t.text().primaryKey().$type<RegistryId>(),
    type: registryType().notNull(),
    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
    // non-null iff type === "ENSv1VirtualRegistry"
    node: t.hex().$type<Node>(),
  }),
  (t) => ({
    byChainAddress: index().on(t.chainId, t.address), // plain, not unique
  }),
);
```

Drop `v1Domain` + `v2Domain`. Single `domain` table:

```ts
export const domain = onchainTable(
  "domains",
  (t) => ({
    id: t.text().primaryKey().$type<DomainId>(),
    type: domainType().notNull(),
    registryId: t.text().notNull().$type<RegistryId>(),
    subregistryId: t.text().$type<RegistryId>(), // nullable
    // non-null iff type === "ENSv2Domain"
    tokenId: t.bigint(),
    labelHash: t.hex().notNull().$type<LabelHash>(),
    ownerId: t.hex().$type<Address>(),
    // v1-only
    rootRegistryOwnerId: t.hex().$type<Address>(),
    // parentId removed; canonical path via registryCanonicalDomain
  }),
  (t) => ({
    byType: index().on(t.type),
    byRegistry: index().on(t.registryId),
    bySubregistry: index().on(t.subregistryId).where(sql`${t.subregistryId} IS NOT NULL`),
    byOwner: index().on(t.ownerId),
    byLabelHash: index().on(t.labelHash),
  }),
);
```

Relations:

- `domain.registry` → `registry` (via `registryId`)
- `domain.subregistry` → `registry` (via `subregistryId`)
- `domain.owner` → `account`
- `domain.rootRegistryOwner` → `account`
- `domain.label` → `label`
- `domain.registrations` → `registration` (many)
- `registry` → `many(domain)` in both registry and subregistry roles

`registrationType`, `registration`, and `registryCanonicalDomain` unchanged. `registration.domainId.$type<DomainId>()` already a union — confirm.

**Validate:** `pnpm -F @ensnode/ensdb-sdk typecheck`, `pnpm -F @ensnode/ensnode-sdk typecheck`.

---

## Commit 3 — indexer handlers (`apps/ensindexer`)

Pattern for all v1 handlers:

```ts
const registry = getThisAccountId(context, event);
const registryId = makeENSv1RegistryId(registry);

await context.ensDb
  .insert(ensIndexerSchema.registry)
  .values({
    id: registryId,
    type: "ENSv1Registry",
    ...registry,
    node: null,
  })
  .onConflictDoNothing();
```

### `src/plugins/ensv2/handlers/ensv1/ENSv1Registry.ts`

**`handleNewOwner`:**

```ts
const node = makeSubdomainNode(labelHash, parentNode);
const domainId = makeENSv1DomainId(registry, node);
const parentDomainId = makeENSv1DomainId(registry, parentNode);

const { node: managedNode } = getManagedName(registry);
const parentRegistryId =
  parentNode === managedNode
    ? registryId
    : makeENSv1VirtualRegistryId(registry, parentNode);

if (parentRegistryId !== registryId) {
  // upsert parent's virtual registry
  await context.ensDb
    .insert(ensIndexerSchema.registry)
    .values({
      id: parentRegistryId,
      type: "ENSv1VirtualRegistry",
      chainId: registry.chainId,
      address: registry.address,
      node: parentNode,
    })
    .onConflictDoNothing();

  // self-link canonical domain for reverse traversal
  await context.ensDb
    .insert(ensIndexerSchema.registryCanonicalDomain)
    .values({ registryId: parentRegistryId, domainId: parentDomainId })
    .onConflictDoUpdate({ domainId: parentDomainId });
}

await context.ensDb
  .insert(ensIndexerSchema.domain)
  .values({
    id: domainId,
    type: "ENSv1Domain",
    registryId: parentRegistryId,
    labelHash,
  })
  .onConflictDoNothing();

// keep existing rootRegistryOwnerId update + materializeENSv1DomainEffectiveOwner + ensureDomainEvent
```

**`handleTransfer` / `handleNewTTL` / `handleNewResolver`:**
- `const registry = getThisAccountId(...)`;
- `const domainId = makeENSv1DomainId(registry, node);`

### `src/plugins/ensv2/handlers/ensv2/ENSv2Registry.ts`

- `registry` insert: `type: "ENSv2Registry"`, `node: null`.
- Writes to `ensIndexerSchema.domain` with `type: "ENSv2Domain"`, `tokenId` set.
- `SubregistryUpdated` canonicalDomain logic unchanged.

### Other handlers (retarget `domain`, add `type`, update id signatures)

- `src/plugins/ensv2/handlers/ensv2/ETHRegistrar.ts`
- `src/plugins/ensv2/handlers/ensv1/{BaseRegistrar,NameWrapper,RegistrarController}.ts`
- `src/plugins/subgraph/shared-handlers/NameWrapper.ts`
- `src/plugins/protocol-acceleration/handlers/{ENSv1Registry,ENSv2Registry,ThreeDNSToken}.ts`
- `src/lib/ensv2/domain-db-helpers.ts` — `materializeENSv1DomainEffectiveOwner` updates `ensIndexerSchema.domain`.

**Validate:** `pnpm -F @ensnode/ensindexer typecheck`, `pnpm lint`, ensindexer unit tests.

---

## Commit 4 — omnigraph / API (`apps/ensapi/src/omnigraph-api`)

### `context.ts`

Drop `v1CanonicalPath` + `v2CanonicalPath`; add single `canonicalPath` loader.

### `lib/get-canonical-path.ts`

Replace with a single `getCanonicalPath(domainId)`. Recursive CTE over `domain` + `registryCanonicalDomain`:

- Base: `domain.id = $domainId`.
- Step: `JOIN registryCanonicalDomain rcd ON rcd.registryId = cur.registryId JOIN domain parent ON parent.id = rcd.domainId`.
- Terminates when `registryId` equals the namespace's v1 root or v2 root.

The virtual-registry self-link rows written in Commit 3 make v1 reverse traversal uniform with v2.

### `lib/get-domain-by-interpreted-name.ts`

Keep `Promise.all([v1, v2])` structure. Each branch does a forward recursive CTE over the unified `domain` table:

- `v1_` rooted at `getENSv1RootRegistryId(namespace)` (concrete ENSv1Registry id).
- `v2_` rooted at `maybeGetENSv2RootRegistryId(namespace)`.

CTE shape identical to the current v2 traversal; domain-to-next-domain hops go via `domain.registryId`, so ENSv1 traversal moves transparently through virtual registries.

"Prefer v2" ordering preserved. The old direct `v1Domain.findFirst` path is removed in favor of the traversal.

### `lib/find-domains/layers/`

- `base-domain-set.ts` — single `domain` source (no union).
- `filter-by-registry.ts` — `eq(base.registryId, id)`; delete the v2-only comment.
- `filter-by-parent.ts` — **no changes needed**; works automatically.
- `filter-by-canonical.ts` — uses unified `canonicalRegistriesCte`.
- `filter-by-name.ts` — retarget `domain`.
- `canonical-registries-cte.ts` — unified forward traversal over `domain` + `registryCanonicalDomain`, rooted at v1 or v2 root.

### `schema/domain.ts` (follow `schema/registration.ts` pattern)

```ts
export type Domain = Exclude<typeof DomainInterfaceRef.$inferType, DomainId>;
export type DomainInterface = Pick<
  Domain,
  | "id" | "type" | "registryId" | "subregistryId" | "labelHash"
  | "ownerId" | "rootRegistryOwnerId" | "tokenId"
>;
export type ENSv1Domain = Domain & { type: "ENSv1Domain" };
export type ENSv2Domain = RequiredAndNotNull<Domain, "tokenId"> & { type: "ENSv2Domain" };
```

- `DomainInterfaceRef.load` → single `ensDb.query.domain.findMany({ where: inArray(id, ids), with: { label: true } })`.
- `isENSv1Domain = (d) => (d as DomainInterface).type === "ENSv1Domain"`.
- Move `parent` onto `DomainInterfaceRef`:
  ```ts
  parent: t.field({
    type: DomainInterfaceRef,
    nullable: true,
    resolve: async (d, _, ctx) => {
      const path = await ctx.loaders.canonicalPath.load(d.id);
      return path?.[1] ?? null;
    },
  });
  ```
- `ENSv1DomainRef`: keep `rootRegistryOwner`; `isTypeOf: (v) => (v as DomainInterface).type === "ENSv1Domain"`.
- `ENSv2DomainRef`: keep `tokenId` / `registry` / `subregistry` / `permissions`; `isTypeOf: (v) => (v as DomainInterface).type === "ENSv2Domain"`.

### `schema/registry.ts` (new interface pattern)

```ts
export const RegistryInterfaceRef = builder.loadableInterfaceRef("Registry", {
  load: (ids: RegistryId[]) =>
    ensDb.query.registry.findMany({ where: (t, { inArray }) => inArray(t.id, ids) }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Registry = Exclude<typeof RegistryInterfaceRef.$inferType, RegistryId>;
export type RegistryInterface = Pick<Registry, "id" | "type" | "chainId" | "address" | "node">;
export type ENSv1Registry = Registry & { type: "ENSv1Registry" };
export type ENSv1VirtualRegistry = RequiredAndNotNull<Registry, "node"> & {
  type: "ENSv1VirtualRegistry";
};
export type ENSv2Registry = Registry & { type: "ENSv2Registry" };
```

- `RegistryInterfaceRef.implement` — shared fields: `id`, `type`, `contract` (AccountId), `parents`, `domains`, `permissions`.
- `parents` is defined on the interface and returns `DomainInterfaceRef`. For `ENSv1VirtualRegistry` the sole parent is the canonical v1 domain (self-linked via `registryCanonicalDomain`); for concrete `ENSv1Registry` the parents are the TLDs under it; for `ENSv2Registry` the parents are the v2 domains declaring it as subregistry.
- `ENSv1RegistryRef` / `ENSv2RegistryRef`: `isTypeOf` checks on `.type`; minimal (or no) extra fields.
- `ENSv1VirtualRegistryRef`: exposes `node: Node` non-null; `isTypeOf: (v) => v.type === "ENSv1VirtualRegistry"`.
- Replace callsite usage of `RegistryRef` with `RegistryInterfaceRef` across the API layer.
- `RegistryIdInput` AccountId path resolver:
  ```ts
  where: and(
    eq(registry.chainId, chainId),
    eq(registry.address, address),
    inArray(registry.type, ["ENSv1Registry", "ENSv2Registry"]),
  );
  ```

### `schema/registration.ts`, `schema/query.ts`, `schema/account.ts`, `schema/permissions.ts`

- Retarget `v1Domain` / `v2Domain` → `domain`.
- Swap `RegistryRef` imports to `RegistryInterfaceRef`.
- Permissions join by `(chainId, address)` + `registry.id = parent.registryId` remains correct (id narrows even with non-unique chainId/address).

### Generated files

Regenerate `packages/enssdk/src/omnigraph/generated/{introspection.ts,schema.graphql}` from pothos.

**Validate:** `pnpm -F ensapi typecheck`, `pnpm lint`, ensapi unit tests.

---

## Commit 5 — tests + changeset

**Tests to update:**

- `packages/ensdb-sdk/src/lib/drizzle.test.ts` — new schema shape.
- `apps/ensapi/src/omnigraph-api/schema/query.integration.test.ts` — v1 id format, `Domain.parent`, unified loader, Registry interface queries.
- `apps/ensapi/src/omnigraph-api/schema/permissions.integration.test.ts` — id churn.
- Fixture builders that produce v1 ids from bare nodes.

**Run:** `pnpm test:integration` from the monorepo root.

**Changeset:** single breaking changeset in `.changeset/`; major bumps for:

- `enssdk`
- `@ensnode/ensdb-sdk`
- `@ensnode/ensnode-sdk`
- `@ensnode/ensindexer`
- `@ensnode/ensapi`

Body notes: schema + id format breaking; requires full reindex; introduces polymorphic Registry GraphQL interface; closes #205, #1877, #1511.

---

## Callsite audit

### Domain writes (retarget `domain`, add `type`, update ids)

- `apps/ensindexer/src/plugins/ensv2/handlers/ensv2/{ENSv2Registry,ETHRegistrar}.ts`
- `apps/ensindexer/src/plugins/ensv2/handlers/ensv1/{ENSv1Registry,BaseRegistrar,NameWrapper,RegistrarController}.ts`
- `apps/ensindexer/src/plugins/protocol-acceleration/handlers/{ENSv1Registry,ENSv2Registry,ThreeDNSToken}.ts`
- `apps/ensindexer/src/plugins/subgraph/shared-handlers/NameWrapper.ts`
- `apps/ensindexer/src/lib/ensv2/domain-db-helpers.ts`

### Domain reads / API (retarget `domain`)

- `apps/ensapi/src/omnigraph-api/schema/{domain,registry,registration,query,account,permissions}.ts`
- `apps/ensapi/src/omnigraph-api/context.ts`, `yoga.ts`
- `apps/ensapi/src/omnigraph-api/lib/get-canonical-path.ts`
- `apps/ensapi/src/omnigraph-api/lib/get-domain-by-interpreted-name.ts`
- `apps/ensapi/src/omnigraph-api/lib/find-domains/layers/{base-domain-set,filter-by-name,filter-by-registry,filter-by-canonical}.ts` (skip `filter-by-parent`)
- `apps/ensapi/src/omnigraph-api/lib/find-domains/canonical-registries-cte.ts`

### `ensIndexerSchema.registry` reads (all OK via id narrowing except `RegistryIdInput`)

- `apps/ensindexer/src/plugins/ensv2/handlers/ensv2/ENSv2Registry.ts:347` — by id, OK
- `apps/ensindexer/src/lib/indexing-engines/ponder.ts` — re-export, OK
- `apps/ensapi/src/omnigraph-api/lib/get-canonical-path.ts` — by id, OK
- `apps/ensapi/src/omnigraph-api/lib/get-domain-by-interpreted-name.ts:128` — by id, OK
- `apps/ensapi/src/omnigraph-api/lib/find-domains/layers/base-domain-set.ts` — id join, OK
- `apps/ensapi/src/omnigraph-api/lib/find-domains/canonical-registries-cte.ts` — id join, OK
- `apps/ensapi/src/omnigraph-api/schema/domain.ts:387` — permissions join, id-narrowed, OK
- `apps/ensapi/src/omnigraph-api/schema/{account,registry}.ts` — by id/registryId, OK
- **`RegistryIdInput` AccountId resolver** — add `type IN ('ENSv1Registry', 'ENSv2Registry)` filter.

### `makeENSv1DomainId` signature change (acc + node)

- `apps/ensindexer/src/plugins/ensv2/handlers/ensv1/{ENSv1Registry,BaseRegistrar,NameWrapper,RegistrarController}.ts`
- `apps/ensindexer/src/plugins/subgraph/shared-handlers/NameWrapper.ts`
- `apps/ensindexer/src/plugins/protocol-acceleration/handlers/{ENSv1Registry,ThreeDNSToken}.ts`
- `apps/ensindexer/src/lib/ensv2/domain-db-helpers.ts`
- `apps/ensapi/src/omnigraph-api/lib/get-domain-by-interpreted-name.ts:96`

### Generated (regenerate, don't hand-edit)

- `packages/enssdk/src/omnigraph/generated/{introspection.ts,schema.graphql}`

---

## Task dependency graph

```
#1 (types+ids)  ─┐
                 ├─► #3 (schema) ─► #4 (indexer) ─► #5 (omnigraph) ─► #6 (tests+changeset)
#2 (v1 root)    ─┘
```

---

## Key file references

- Schema: `packages/ensdb-sdk/src/ensindexer-abstract/ensv2.schema.ts`
- IDs: `packages/enssdk/src/lib/ids.ts`, `packages/enssdk/src/lib/types/ensv2.ts`
- ENSv1 handler: `apps/ensindexer/src/plugins/ensv2/handlers/ensv1/ENSv1Registry.ts`
- ENSv2 handler: `apps/ensindexer/src/plugins/ensv2/handlers/ensv2/ENSv2Registry.ts`
- Managed names: `apps/ensindexer/src/lib/managed-names.ts`
- Registration schema pattern (reference for polymorphism): `apps/ensapi/src/omnigraph-api/schema/registration.ts`
- Domain schema: `apps/ensapi/src/omnigraph-api/schema/domain.ts`
- Registry schema: `apps/ensapi/src/omnigraph-api/schema/registry.ts`
- Canonical path: `apps/ensapi/src/omnigraph-api/lib/get-canonical-path.ts`
- Interpreted-name lookup: `apps/ensapi/src/omnigraph-api/lib/get-domain-by-interpreted-name.ts`
- Canonical CTE: `apps/ensapi/src/omnigraph-api/lib/find-domains/canonical-registries-cte.ts`
- Root registry helpers: `packages/ensnode-sdk/src/shared/root-registry.ts`

---

## Branch

`refactor/ensv1-domain-model`

# Spec: Extend IResolver Record Types in Protocol Acceleration & Resolution API

## Scope

**Indexed and accelerated:** `contenthash`, `pubkey`, `dnszonehash`, `version`
**Selectable but always RPC'd:** `abi`, `interfaces`
**Special:** `VersionChanged` invalidates all indexed child records for the node

**Constraint:** Changes limited to protocol-acceleration plugin handlers, Resolution API, SDK types, and ensdb-sdk schema. Subgraph shared-handlers are NOT touched.

## Design decisions

- **Versioning (Option A):** on `VersionChanged`, delete all child records for the node and reset scalar columns. Bulk delete via raw drizzle forces a Ponder cache flush — accepted because `VersionChanged` is rare. If ENSv2 emits it frequently, revisit (migrate to version-keyed child PKs).
- **Hybrid acceleration:** `resolveCallByIndex(call, indexed)` returns `{ accelerated: true, result } | { accelerated: false }`. Accelerated results flow through; unaccelerated calls batch-RPC'd in one round trip. `makeRecordsResponseFromResolveResults` shapes the merged result.
- **ABI / interfaces not indexed.** ABI event omits data (would require follow-up readContract), interface getter has ERC-165 fallback that can't be replicated offline. Selection-level support preserved via the RPC tail of the hybrid path.
- **Pubkey:** flat `pubkeyX` / `pubkeyY` columns in DB, invariant both-null-or-both-set, `{ x, y } | null` shape in API.
- **`makeRecordsResponseFromIndexedRecords` deleted** this PR — hybrid path routes everything through `makeRecordsResponseFromResolveResults`.

---

## 1. Semantic types (`packages/enssdk/src/lib/types/`)

Create `content-type.ts`:
```ts
/** Power-of-2 ABI content type per ENSIP-4 (1=JSON, 2=zlib-JSON, 4=CBOR, 8=URI). */
export type ContentType = bigint;
```

Create `interface-id.ts`:
```ts
import type { Hex } from "viem";
/** ERC-165 4-byte interface selector. */
export type InterfaceId = Hex;
```

Re-export both from `types/index.ts`.

---

## 2. Schema (`packages/ensdb-sdk/src/ensindexer-abstract/protocol-acceleration.schema.ts`)

Extend `resolverRecords`. No new tables. No migrations.

```ts
export const resolverRecords = onchainTable(
  "resolver_records",
  (t) => ({
    id: t.text().primaryKey().$type<ResolverRecordsId>(),
    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
    node: t.hex().notNull().$type<Node>(),

    /** ENSIP-3 name() record, InterpretedName. */
    name: t.text().$type<InterpretedName>(),

    /** ENSIP-7 contenthash raw bytes. Null iff unset (empty bytes sentinel normalized). */
    contenthash: t.hex(),

    /**
     * PubkeyResolver (x, y) pair.
     * INVARIANT: both null together, or both set together.
     * (0x00…, 0x00…) sentinel stored as (null, null). Exposed to API as { x, y } | null.
     */
    pubkeyX: t.hex(),
    pubkeyY: t.hex(),

    /** IDNSZoneResolver zonehash. Null iff unset. */
    dnszonehash: t.hex(),

    /**
     * IVersionableResolver version. Default 0.
     * Strategy: on VersionChanged, delete all child records for (chainId, address, node)
     * and reset scalars. Future: may migrate to version-keyed child PKs if ENSv2 emits
     * VersionChanged frequently.
     */
    version: t.bigint().notNull().default(0n),
  }),
  (t) => ({ byId: uniqueIndex().on(t.chainId, t.address, t.node) }),
);
```

`resolverRecords_relations` unchanged. No abi/interface tables.

---

## 3. Interpreters (`@ensnode/ensnode-sdk/internal`)

Add to existing interpretation module:

```ts
export function interpretContenthashValue(raw: Hex): Hex | null {
  return raw === "0x" ? null : raw;
}

export function interpretPubkeyValue(x: Hex, y: Hex): { x: Hex; y: Hex } | null {
  const ZERO = "0x" + "00".repeat(32);
  if (x === ZERO && y === ZERO) return null;
  return { x, y };
}

export function interpretDnszonehashValue(raw: Hex): Hex | null {
  return raw === "0x" ? null : raw;
}
```

---

## 4. Indexer DB helpers (`apps/ensindexer/src/lib/protocol-acceleration/resolver-db-helpers.ts`)

```ts
export async function handleResolverContenthashUpdate(
  context: IndexingEngineContext,
  key: ResolverRecordsCompositeKey,
  rawHash: Hex,
) {
  const id = makeResolverRecordsId({ chainId: key.chainId, address: key.address }, key.node);
  await context.ensDb
    .update(ensIndexerSchema.resolverRecords, { id })
    .set({ contenthash: interpretContenthashValue(rawHash) });
}

export async function handleResolverPubkeyUpdate(
  context: IndexingEngineContext,
  key: ResolverRecordsCompositeKey,
  x: Hex,
  y: Hex,
) {
  const id = makeResolverRecordsId({ chainId: key.chainId, address: key.address }, key.node);
  const pubkey = interpretPubkeyValue(x, y);
  await context.ensDb
    .update(ensIndexerSchema.resolverRecords, { id })
    .set({ pubkeyX: pubkey?.x ?? null, pubkeyY: pubkey?.y ?? null });
}

export async function handleResolverDnszonehashUpdate(
  context: IndexingEngineContext,
  key: ResolverRecordsCompositeKey,
  rawHash: Hex,
) {
  const id = makeResolverRecordsId({ chainId: key.chainId, address: key.address }, key.node);
  await context.ensDb
    .update(ensIndexerSchema.resolverRecords, { id })
    .set({ dnszonehash: interpretDnszonehashValue(rawHash) });
}

/**
 * IVersionableResolver VersionChanged: deletes all child records for (chainId, address, node)
 * and resets scalar columns. Uses raw drizzle via `context.db.sql` — this flushes Ponder's
 * local cache to Postgres, accepted because VersionChanged is rare.
 */
export async function handleResolverVersionChange(
  context: IndexingEngineContext,
  key: ResolverRecordsCompositeKey,
  newVersion: bigint,
) {
  const { chainId, address, node } = key;

  await context.db.sql
    .delete(ensIndexerSchema.resolverAddressRecord)
    .where(and(
      eq(ensIndexerSchema.resolverAddressRecord.chainId, chainId),
      eq(ensIndexerSchema.resolverAddressRecord.address, address),
      eq(ensIndexerSchema.resolverAddressRecord.node, node),
    ));

  await context.db.sql
    .delete(ensIndexerSchema.resolverTextRecord)
    .where(and(
      eq(ensIndexerSchema.resolverTextRecord.chainId, chainId),
      eq(ensIndexerSchema.resolverTextRecord.address, address),
      eq(ensIndexerSchema.resolverTextRecord.node, node),
    ));

  const id = makeResolverRecordsId({ chainId, address }, node);
  await context.ensDb
    .update(ensIndexerSchema.resolverRecords, { id })
    .set({
      name: null,
      contenthash: null,
      pubkeyX: null,
      pubkeyY: null,
      dnszonehash: null,
      version: newVersion,
    });
}
```

---

## 5. Handler registrations (`apps/ensindexer/src/plugins/protocol-acceleration/handlers/Resolver.ts`)

Append four new listeners. `ABIChanged` and `InterfaceChanged` are intentionally NOT registered.

```ts
addOnchainEventListener(
  namespaceContract(pluginName, "Resolver:ContenthashChanged"),
  async ({ context, event }) => {
    const resolver = getThisAccountId(context, event);
    await ensureResolver(context, resolver);
    const key = makeResolverRecordsCompositeKey(resolver, event);
    await ensureResolverRecords(context, key);
    await handleResolverContenthashUpdate(context, key, event.args.hash);
  },
);

addOnchainEventListener(
  namespaceContract(pluginName, "Resolver:PubkeyChanged"),
  async ({ context, event }) => {
    const { x, y } = event.args;
    const resolver = getThisAccountId(context, event);
    await ensureResolver(context, resolver);
    const key = makeResolverRecordsCompositeKey(resolver, event);
    await ensureResolverRecords(context, key);
    await handleResolverPubkeyUpdate(context, key, x, y);
  },
);

addOnchainEventListener(
  namespaceContract(pluginName, "Resolver:DNSZonehashChanged"),
  async ({ context, event }) => {
    const resolver = getThisAccountId(context, event);
    await ensureResolver(context, resolver);
    const key = makeResolverRecordsCompositeKey(resolver, event);
    await ensureResolverRecords(context, key);
    await handleResolverDnszonehashUpdate(context, key, event.args.zonehash);
  },
);

addOnchainEventListener(
  namespaceContract(pluginName, "Resolver:VersionChanged"),
  async ({ context, event }) => {
    const resolver = getThisAccountId(context, event);
    await ensureResolver(context, resolver);
    const key = makeResolverRecordsCompositeKey(resolver, event);
    await ensureResolverRecords(context, key);
    await handleResolverVersionChange(context, key, event.args.newVersion);
  },
);
```

---

## 6. SDK selection & response (`packages/ensnode-sdk/src/resolution/`)

### `resolver-records-selection.ts`

```ts
import type { CoinType, ContentType, InterfaceId } from "enssdk";

export interface ResolverRecordsSelection {
  name?: boolean;
  addresses?: CoinType[];
  texts?: string[];
  contenthash?: boolean;
  pubkey?: boolean;
  /** Always resolved via RPC (never accelerated). */
  abis?: ContentType[];
  /** Always resolved via RPC (never accelerated). */
  interfaces?: InterfaceId[];
  dnszonehash?: boolean;
  version?: boolean;
}

export const isSelectionEmpty = (s: ResolverRecordsSelection) =>
  !s.name
  && !s.addresses?.length
  && !s.texts?.length
  && !s.contenthash
  && !s.pubkey
  && !s.dnszonehash
  && !s.abis?.length
  && !s.interfaces?.length
  && !s.version;
```

### `resolver-records-response.ts`

Extend `ResolverRecordsResponseBase`:
```ts
contenthash: Hex | null;
pubkey: { x: Hex; y: Hex } | null;
/** Keyed by stringified bigint ContentType at the API surface (Record<string, ...>). */
abis: Record<string, Hex | null>;
interfaces: Record<InterfaceId, Address | null>;
dnszonehash: Hex | null;
version: bigint;
```

Extend `ResolverRecordsResponse<T>` mapped type with branches:
- `K extends "abis"` → `Record<\`${T["abis"][number]}\`, Hex | null>`
- `K extends "interfaces"` → `Record<T["interfaces"][number], Address | null>`
- `contenthash` / `pubkey` / `dnszonehash` / `version` pass through from base.

Internal module types may use `Record<ContentType, ...>` where convenient, but the API response type uses `Record<string, ...>` for bigint keys.

---

## 7. Resolution API: calls & interpretation (`apps/ensapi/src/lib/resolution/resolve-calls-and-results.ts`)

Extend `makeResolveCalls`:
```ts
return [
  selection.name         && ({ functionName: "name",           args: [node] } as const),
  selection.contenthash  && ({ functionName: "contenthash",    args: [node] } as const),
  selection.pubkey       && ({ functionName: "pubkey",         args: [node] } as const),
  selection.dnszonehash  && ({ functionName: "zonehash",       args: [node] } as const),
  selection.version      && ({ functionName: "recordVersions", args: [node] } as const),
  ...(selection.addresses  ?? []).map(ct => ({ functionName: "addr",                 args: [node, BigInt(ct)] } as const)),
  ...(selection.texts      ?? []).map(k  => ({ functionName: "text",                 args: [node, k]          } as const)),
  ...(selection.abis       ?? []).map(ct => ({ functionName: "ABI",                  args: [node, ct]         } as const)),
  ...(selection.interfaces ?? []).map(id => ({ functionName: "interfaceImplementer", args: [node, id]         } as const)),
].filter((c): c is Exclude<typeof c, undefined | null | false> => !!c);
```

Extend `interpretRawCallsAndResults` switch:
```ts
case "contenthash":  return { call, result: interpretContenthashValue(result as Hex) };
case "pubkey": {
  const [x, y] = result as [Hex, Hex];
  return { call, result: interpretPubkeyValue(x, y) };
}
case "zonehash":     return { call, result: interpretDnszonehashValue(result as Hex) };
case "recordVersions": return { call, result: result as bigint };
case "ABI": {
  const [contentType, data] = result as [bigint, Hex];
  return { call, result: data === "0x" ? null : { contentType, data } };
}
case "interfaceImplementer": {
  return { call, result: result === "0x0000000000000000000000000000000000000000" ? null : result };
}
```

Update `ResolveCallsAndRawResults<SELECTION>` / `ResolveCallsAndResults<SELECTION>` conditional type tables to include every new function-name → result-shape mapping.

### ABI semantics

On-chain `ABI(node, contentTypes)` takes a bitmask and returns the first matching ABI. Our API treats each selected `ContentType` as a single-bit mask, producing one call per selection entry. Predictable, wire-compatible for the common "query single content type" case. Document in selection JSDoc.

---

## 8. New: `apps/ensapi/src/lib/resolution/resolve-call-by-index.ts`

```ts
import { bigintToCoinType } from "enssdk";
import type { IndexedResolverRecords } from "./make-records-response";
import type { ResolveCall } from "./resolve-calls-and-results";

type ResolveByIndex<C extends ResolveCall> =
  | { call: C; accelerated: true; result: unknown }
  | { call: C; accelerated: false };

export function resolveCallByIndex<C extends ResolveCall>(
  call: C,
  indexed: IndexedResolverRecords | null,
): ResolveByIndex<C> {
  switch (call.functionName) {
    case "name":
      return { call, accelerated: true, result: indexed?.name ?? null };
    case "addr": {
      const ct = bigintToCoinType(call.args[1] as bigint);
      const found = indexed?.addressRecords.find(r => bigintToCoinType(r.coinType) === ct);
      return { call, accelerated: true, result: found?.value ?? null };
    }
    case "text": {
      const key = call.args[1] as string;
      const found = indexed?.textRecords.find(r => r.key === key);
      return { call, accelerated: true, result: found?.value ?? null };
    }
    case "contenthash":    return { call, accelerated: true, result: indexed?.contenthash ?? null };
    case "pubkey":         return { call, accelerated: true, result: indexed?.pubkey ?? null };
    case "zonehash":       return { call, accelerated: true, result: indexed?.dnszonehash ?? null };
    case "recordVersions": return { call, accelerated: true, result: indexed?.version ?? 0n };
    case "ABI":
    case "interfaceImplementer":
      return { call, accelerated: false };
  }
}
```

---

## 9. Index read (`apps/ensapi/src/lib/protocol-acceleration/get-records-from-index.ts`)

Shape-only change. Existing address-record defaulting logic preserved.

```ts
const row = await ensDb.query.resolverRecords.findFirst({
  where: (t, { and, eq }) => and(
    eq(t.chainId, resolver.chainId),
    eq(t.address, resolver.address),
    eq(t.node, node),
  ),
  columns: {
    name: true,
    contenthash: true,
    pubkeyX: true,
    pubkeyY: true,
    dnszonehash: true,
    version: true,
  },
  with: { addressRecords: true, textRecords: true },
});
if (!row) return null;

const records: IndexedResolverRecords = {
  name: row.name,
  addressRecords: row.addressRecords,
  textRecords: row.textRecords,
  contenthash: row.contenthash,
  pubkey: row.pubkeyX && row.pubkeyY ? { x: row.pubkeyX, y: row.pubkeyY } : null,
  dnszonehash: row.dnszonehash,
  version: row.version,
};

// existing address-record defaulting block unchanged

return records;
```

---

## 10. Response shaping (`apps/ensapi/src/lib/resolution/make-records-response.ts`)

Extend `IndexedResolverRecords`:
```ts
export interface IndexedResolverRecords {
  name: string | null;
  addressRecords: { coinType: bigint; value: string }[];
  textRecords: { key: string; value: string }[];
  contenthash: Hex | null;
  pubkey: { x: Hex; y: Hex } | null;
  dnszonehash: Hex | null;
  version: bigint;
}
```

**Delete** `makeRecordsResponseFromIndexedRecords`.

Rewrite `makeEmptyResolverRecordsResponse`:
```ts
export function makeEmptyResolverRecordsResponse<S extends ResolverRecordsSelection>(selection: S) {
  return makeRecordsResponseFromResolveResults(selection, []);
}
```

Extend `makeRecordsResponseFromResolveResults` with branches per new selection field:
- `selection.contenthash` → find `functionName === "contenthash"`; null if absent.
- `selection.pubkey` → find `functionName === "pubkey"`; null if absent.
- `selection.dnszonehash` → find `functionName === "zonehash"`; null if absent.
- `selection.version` → find `functionName === "recordVersions"`; default `0n` if absent.
- `selection.abis` → for each selected `ContentType`, find `ABI` result where `args[1] === ct`. Key response by `String(ct)`.
- `selection.interfaces` → for each selected `InterfaceId`, find `interfaceImplementer` result where `args[1] === id`. Key by `id`.

---

## 11. Hybrid acceleration (`apps/ensapi/src/lib/resolution/forward-resolution.ts`)

Rework the accelerated branch (current lines 257–375):

- ENSIP-19 reverse acceleration: unchanged.
- Bridged resolver acceleration: unchanged.
- **Hoist `isExtendedResolver` check** above the static-resolver acceleration block so `extended` is available to both the hybrid-RPC tail and the downstream pure-RPC path. Remove the duplicated block below.
- Static-resolver accelerated branch → hybrid flow:

```ts
if (resolverRecordsAreIndexed && isStaticResolver(config.namespace, resolver)) {
  return withEnsProtocolStep(
    TraceableENSProtocol.ForwardResolution,
    ForwardResolutionProtocolStep.AccelerateKnownOnchainStaticResolver,
    {},
    async () => {
      const indexed = await getRecordsFromIndex({ resolver, node, selection });
      const resolved = calls.map(c => resolveCallByIndex(c, indexed));

      const acceleratedResults = resolved
        .filter((r): r is Extract<typeof r, { accelerated: true }> => r.accelerated)
        .map(({ call, result }) => ({ call, result }));

      const rpcCalls = resolved.filter(r => !r.accelerated).map(r => r.call);
      const rpcResults = rpcCalls.length
        ? interpretRawCallsAndResults(
            await executeResolveCalls({
              name, resolverAddress: activeResolver, useENSIP10Resolve: extended,
              calls: rpcCalls, publicClient,
            }),
          )
        : [];

      return makeRecordsResponseFromResolveResults(
        selection,
        [...acceleratedResults, ...rpcResults],
      );
    },
  );
}
```

Tracing events: preserve the existing `AccelerateKnownOnchainStaticResolver` step around the hybrid block (success when we enter it, false when we fall through).

---

## 12. Changeset

Add one changeset:

```md
---
"@ensnode/ensdb-sdk": minor
"@ensnode/ensnode-sdk": minor
"@ensnode/ensindexer": minor
"@ensnode/ensapi": minor
"enssdk": minor
---

Resolution API: support contenthash, pubkey, abis, interfaces, dnszonehash, and version
selection. Protocol acceleration indexes contenthash, pubkey, dnszonehash, and handles
VersionChanged (clears records for the node, bumps version). ABI and interface records
are selectable but always resolved via RPC.
```

---

## 13. Tests

### Unit
- `packages/ensnode-sdk/src/internal/interpret-*.test.ts` — sentinel → null for contenthash, pubkey, dnszonehash.
- `apps/ensapi/src/lib/resolution/resolve-call-by-index.test.ts` — every `functionName` returns correct `accelerated` tagging, correct result shape from indexed data, correct null fallbacks when `indexed === null` or fields missing.
- `apps/ensapi/src/lib/resolution/resolve-calls-and-results.test.ts` — `makeResolveCalls` emits correct calls for every new selection field; `interpretRawCallsAndResults` covers every new case.
- `apps/ensapi/src/lib/resolution/make-records-response.test.ts` — `makeRecordsResponseFromResolveResults` shapes match every selection combination; `makeEmptyResolverRecordsResponse` returns correct nulls.

### Integration
- Indexer: fixture resolver emitting `ContenthashChanged` / `PubkeyChanged` / `DNSZonehashChanged` / `AddressChanged` / `TextChanged` / `VersionChanged` in order. Assert final DB state including reset scalars, cleared child rows, bumped version.
- Resolution API: real static resolver with records set for each type. Run with `{ accelerate: true }` and `{ accelerate: false }`. Assert identical responses (parity).
- Resolution API: mixed selection `{ name, addresses, texts, contenthash, abis, interfaces }` exercises both legs of hybrid path in one request.

### Commands
```
pnpm -F @ensnode/ensindexer -F @ensnode/ensapi -F @ensnode/ensnode-sdk -F @ensnode/ensdb-sdk -F enssdk typecheck
pnpm lint
pnpm test --project ensindexer --project ensapi --project ensnode-sdk --project ensdb-sdk --project enssdk
pnpm test:integration
```

---

## 14. PR ordering

1. Semantic types in `enssdk` (§1).
2. Interpreters in `@ensnode/ensnode-sdk/internal` (§3).
3. SDK selection + response types (§6).
4. Schema update (§2) + indexer DB helpers (§4) + handler registrations (§5).
5. Resolution API plumbing: `resolve-calls-and-results` (§7), `resolve-call-by-index` (§8), `get-records-from-index` (§9), `make-records-response` (§10), `forward-resolution` (§11).
6. Delete `makeRecordsResponseFromIndexedRecords` once no callers remain.
7. Tests (§13), changeset (§12).

Single PR. Branch from current `fix/name-index` parent or `main` per dependency.

---

## Unresolved questions

_(none — all prior questions resolved)_

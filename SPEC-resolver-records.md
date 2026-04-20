# Spec: Extend IResolver Record Types in Protocol Acceleration & Resolution API

## Scope

**Indexed and accelerated:** `contenthash`, `pubkey`, `dnszonehash`, `version`
**Selectable but always RPC'd:** `abi`, `interfaces`
**Special:** `VersionChanged` invalidates all indexed child records for the node

**Constraint:** Changes limited to protocol-acceleration plugin handlers, Resolution API, SDK types, and ensdb-sdk schema. Subgraph shared-handlers and assocaited subgraph.schema.ts are NOT touched.

## Design decisions

- **Versioning (Option A):** on `VersionChanged`, delete all child records for the node and reset scalar columns. Bulk delete via raw drizzle forces a Ponder cache flush — accepted because `VersionChanged` is rare.
- **Hybrid acceleration:** `resolveCallByIndex(call, indexed)` returns `{ accelerated: true, result } | { accelerated: false }`. Accelerated results flow through; unaccelerated calls batch-RPC'd in one round trip. `makeRecordsResponseFromResolveResults` shapes the merged result.
- **ABI / interfaces not indexed.** ABI event omits data (would require follow-up readContract), interface getter has ERC-165 fallback that can't be replicated offline. Selection-level support preserved via the RPC tail of the hybrid path.
- **Pubkey:** flat `pubkeyX` / `pubkeyY` columns in DB, invariant both-null-or-both-set, `{ x, y } | null` shape in API.
- **`makeRecordsResponseFromIndexedRecords` deleted** this PR — hybrid path routes everything through `makeRecordsResponseFromResolveResults`.

---

## 1. Semantic types (`packages/enssdk/src/lib/types/`)

Create `resolver.ts`:
```ts
import type { Hex } from "viem";

/**
 * ABI content type per ENSIP-4.
 *
 * Single-bit values (1=JSON, 2=zlib-JSON, 4=CBOR, 8=URI) identify a stored ABI encoding.
 * `setABI` requires a power-of-2 value.
 *
 * Bitmask unions of those bits are used when reading via `ABI(node, contentTypes)`; the
 * resolver returns the first stored ABI whose bit is present in the mask (lowest bit first).
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/91c966febd7b55494269df830fc6775f040b927b/contracts/resolvers/profiles/ABIResolver.sol
 */
export type ContentType = bigint;

/**
 * ERC-165 4-byte interface selector.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/91c966febd7b55494269df830fc6775f040b927b/contracts/resolvers/profiles/InterfaceResolver.sol
 */
export type InterfaceId = Hex;
```

Re-export from `types/index.ts`.

Update `packages/ensnode-sdk/src/rpc/eip-165.ts` and `apps/ensindexer/src/plugins/subgraph/shared-handlers/Resolver.ts` (`handleInterfaceChanged`) to use the new `InterfaceId` type.

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

    /**
     * ENSIP-3 name() record, guaranteed to be an InterpretedName or null if not set.
     */
    name: t.text().$type<InterpretedName>(),

    /**
     * ENSIP-7 contenthash raw bytes or null if not set.
     */
    contenthash: t.hex(),

    /**
     * PubkeyResolver (x, y) pair, or null if not set.
     * Invariant: both null together, or both set together.
     */
    pubkeyX: t.hex(),
    pubkeyY: t.hex(),

    /**
     * IDNSZoneResolver zonehash or null if not set.
     */
    dnszonehash: t.hex(),

    /**
     * IVersionableResolver version, defaulting to 0.
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
export function interpretContenthashValue(value: Hex): Hex | null {
  return value === "0x" ? null : value;
}

export function interpretPubkeyValue(x: Hex, y: Hex): { x: Hex; y: Hex } | null {
  if (x === zeroHash && y === zeroHash) return null;
  return { x, y };
}

export function interpretDnszonehashValue(value: Hex): Hex | null {
  return value === "0x" ? null : value;
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
  abi?: ContentType;
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
  && !s.abi
  && !s.interfaces?.length
  && !s.version;
```

### `resolver-records-response.ts`

Extend `ResolverRecordsResponseBase`:
```ts
contenthash: Hex | null;
pubkey: { x: Hex; y: Hex } | null;
abi: { contentType: ContentType; data: Hex } | null;
interfaces: Record<InterfaceId, Address | null>;
dnszonehash: Hex | null;
version: bigint;
```

Extend `ResolverRecordsResponse<T>` mapped type with branches:
- `K extends "interfaces"` → `Record<T["interfaces"][number], Address | null>`
- `contenthash` / `pubkey` / `abi` / `dnszonehash` / `version` pass through from base.

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
  selection.abi          && ({ functionName: "ABI",            args: [node, selection.abi] } as const),
  ...(selection.addresses  ?? []).map(ct => ({ functionName: "addr",                 args: [node, BigInt(ct)] } as const)),
  ...(selection.texts      ?? []).map(k  => ({ functionName: "text",                 args: [node, k]          } as const)),
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
  const [contentType, data] = result as [ContentType, Hex];
  return { call, result: data === "0x" ? null : { contentType, data } };
}
case "interfaceImplementer": {
  return { call, result: interpretAddress(result) };
}
```

Update `ResolveCallsAndRawResults<SELECTION>` / `ResolveCallsAndResults<SELECTION>` conditional type tables to include every new function-name → result-shape mapping.

---

## 8. New: `apps/ensapi/src/lib/resolution/resolve-call-by-index.ts`

```ts
import { bigintToCoinType } from "enssdk";
import type { IndexedResolverRecords } from "./make-records-response";
import type { ResolveCall } from "./resolve-calls-and-results";

/**
 * (undefined means not accelerated)
 */
export function resolveCallByIndex<C extends ResolveCall>(
  call: C,
  records: IndexedResolverRecords | null,
): unknown | null | undefined {
  switch (call.functionName) {
    case "name":
      return records?.name ?? null;
    case "addr": {
      const ct = bigintToCoinType(call.args[1] as bigint);
      const found = records?.addressRecords.find(r => bigintToCoinType(r.coinType) === ct);
      return found?.value ?? null;
    }
    case "text": {
      const key = call.args[1] as string;
      const found = records?.textRecords.find(r => r.key === key);
      return found?.value ?? null
    }
    case "contenthash":    return records?.contenthash ?? null;
    case "pubkey":         return (records?.pubkeyX && records?.pubkeyY) ? {x: records.pubkeyX, y: records.pubkeyY} : null;
    case "zonehash":       return records?.dnszonehash ?? null;
    case "recordVersions": return records?.version ?? 0n;
    case "ABI":
    case "interfaceImplementer":
      return undefined;
  }
}
```

---

## 9. Index read (`apps/ensapi/src/lib/protocol-acceleration/get-records-from-index.ts`)

Shape-only change. Existing address-record defaulting logic preserved.

```ts
const row = (await ensDb.query.resolverRecords.findFirst({
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
})) as IndexedResolverRecords | undefined;

if (!row) return null;

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
  pubkeyX: Hex;
  pubkeyY: Hex;
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
- `selection.abi` → find `functionName === "ABI"`; the interpreted result is already `{ contentType, data } | null`. Pass through.
- `selection.interfaces` → for each selected `InterfaceId`, find `interfaceImplementer` result where `args[1] === id`. Key by `id`.

---

## 11. Linear flow with a single RPC callsite (`apps/ensapi/src/lib/resolution/forward-resolution.ts`)

Restructure `_resolveForward` into a linear pipeline of **passes over an `operations` array**. Each entry is either unresolved (`{ call }`) or resolved (`{ call, result }`). Each pass takes `operations`, touches only unresolved entries, and returns the new `operations`. The terminal RPC pass resolves anything still unresolved.

1. **Identify resolver** (findResolver).
2. **Accelerate** — one pass per strategy, each layering onto `operations`.
3. **RPC anything left** — single `executeResolveCalls` callsite resolves unresolved entries.

Early returns (kept — distinct resolution models, not per-call passes):
- ENSv2 UniversalResolver bailout (unchanged; uses `executeResolveCallsWithUniversalResolver`; TODO to re-integrate once acceleration supports ENSv2).
- Empty selection → `makeEmptyResolverRecordsResponse`.
- No active resolver → `makeEmptyResolverRecordsResponse`.
- Bridged resolver → recursive `_resolveForward` with redirected registry (still one RPC per outer frame).

### Operation type

Shared across passes. Lives next to `ResolveCall` (e.g. `resolve-calls-and-results.ts`):

```ts
export type Operation = { call: ResolveCall; result?: unknown };
// `result === undefined` (or absent) = unresolved; any other value (including null) = resolved.
```

### Skeleton

```ts
// (validation, empty-selection short-circuit, ENSv2 bailout — unchanged)

// 1. Identify resolver
const { activeName, activeResolver, requiresWildcardSupport } = await findResolver(...);
if (!activeResolver) return makeEmptyResolverRecordsResponse(selection);

// Bridged resolver → redirect
if (accelerate && canAccelerate) {
  const bridgesTo = isBridgedResolver(config.namespace, { chainId, address: activeResolver });
  if (bridgesTo) {
    return withEnsProtocolStep(
      TraceableENSProtocol.ForwardResolution,
      ForwardResolutionProtocolStep.AccelerateKnownOffchainLookupResolver,
      {},
      () => _resolveForward(name, selection, { ...options, registry: bridgesTo }),
    );
  }
}

// Initialize operations as unresolved
let operations: Operation[] = calls.map(call => ({ call }));

// 2. Accelerate if possible — each strategy is its own pass
if (accelerate && canAccelerate) {
  const resolver = { chainId, address: activeResolver };

  // Pass: ENSIP-19 Reverse Resolver
  if (isKnownENSIP19ReverseResolver(config.namespace, resolver)) {
    operations = await withEnsProtocolStep(
      TraceableENSProtocol.ForwardResolution,
      ForwardResolutionProtocolStep.AccelerateENSIP19ReverseResolver,
      {},
      () => accelerateENSIP19ReverseResolver({ operations, name, selection }),
    );
  }

  // Pass: Known On-Chain Static Resolver with indexed records
  const resolverRecordsAreIndexed =
    areResolverRecordsIndexedByProtocolAccelerationPluginOnChainId(config.namespace, chainId);
  if (resolverRecordsAreIndexed && isStaticResolver(config.namespace, resolver)) {
    operations = await withEnsProtocolStep(
      TraceableENSProtocol.ForwardResolution,
      ForwardResolutionProtocolStep.AccelerateKnownOnchainStaticResolver,
      {},
      () => accelerateKnownOnchainStaticResolver({ operations, resolver, node, selection }),
    );
  }
}

// Early return if every operation is resolved — no RPC needed
if (operations.every(op => op.result !== undefined)) {
  return makeRecordsResponseFromResolveResults(selection, operations);
}

// 3. Determine Resolver ENSIP-10 support + requirement
const extended = await withEnsProtocolStep(
  TraceableENSProtocol.ForwardResolution,
  ForwardResolutionProtocolStep.RequireResolver,
  { chainId, activeResolver, requiresWildcardSupport },
  () => isExtendedResolver({ address: activeResolver, publicClient }),
);
if (requiresWildcardSupport && !extended) return makeEmptyResolverRecordsResponse(selection);

// 4. Resolve remaining unresolved operations via RPC
operations = await withEnsProtocolStep(
  TraceableENSProtocol.ForwardResolution,
  ForwardResolutionProtocolStep.ExecuteResolveCalls,
  {},
  () => executeResolveCalls({
    name,
    resolverAddress: activeResolver,
    useENSIP10Resolve: extended,
    operations,
    publicClient,
  }),
);

return makeRecordsResponseFromResolveResults(selection, operations);
```

### `executeResolveCalls` (updated signature)

Now a pass over `operations` — only RPCs entries that remain unresolved.

```ts
return Promise.all(operations.map(async (op) => {
  if (op.result !== undefined) return op;

  // existing rpc logic for op.call, producing raw result
  const rawResult = await /* ... */;

  return interpretRawRpcCallAndResult(op.call, rawResult);
}));
```

`interpretRawRpcCallAndResult(call, raw): Operation` is a per-call interpreter — split from the existing batch `interpretRawCallsAndResults` so it fits naturally inside the per-operation `Promise.all`.

### New helper: `apps/ensapi/src/lib/resolution/accelerate-ensip19-reverse-resolver.ts`

```ts
export async function accelerateENSIP19ReverseResolver({
  operations, name, selection,
}: {
  operations: Operation[];
  name: InterpretedName;
  selection: ResolverRecordsSelection;
}): Promise<Operation[]> {
  // Invariant: ENSIP-19 reverse resolvers only answer `name`.
  if (selection.name !== true) {
    throw new Error(
      `Invariant(ENSIP-19 Reverse Resolver): expected 'name: true', got ${JSON.stringify(selection)}.`,
    );
  }

  // Sanity: any non-`name` selection would fail on a reverse resolver anyway.
  const { name: _n, ...extras } = selection;
  if (!isSelectionEmpty(extras)) {
    logger.warn(
      `Sanity Check(ENSIP-19 Reverse Resolver): expected '{ name: true }' only, got ${JSON.stringify(selection)}.`,
    );
  }

  return Promise.all(operations.map(async (op) => {
    // Passthrough resolved entries and non-`name` calls.
    if (op.result !== undefined) return op;
    if (op.call.functionName !== "name") return op;

    // Parse + index lookup happen only for the `name` call.
    const parsed = parseReverseName(name);
    if (!parsed) {
      throw new Error(
        `Invariant(ENSIP-19 Reverse Resolver): expected a valid reverse name, got '${name}'.`,
      );
    }

    const result = await getENSIP19ReverseNameRecordFromIndex(parsed.address, parsed.coinType);
    return { call: op.call, result };
  }));
}
```

### New helper: `apps/ensapi/src/lib/resolution/accelerate-known-onchain-static-resolver.ts`

```ts
export async function accelerateKnownOnchainStaticResolver({
  operations, resolver, node, selection,
}: {
  operations: Operation[];
  resolver: AccountId;
  node: Node;
  selection: ResolverRecordsSelection;
}): Promise<Operation[]> {
  const records = await getRecordsFromIndex({ resolver, node, selection });

  return operations.map(op => {
    // Passthrough resolved entries.
    if (op.result !== undefined) return op;

    const result = resolveCallByIndex(op.call, records);
    // `undefined` means this call type isn't accelerable (e.g. ABI, interfaceImplementer).
    return result === undefined ? op : { call: op.call, result };
  });
}
```

### Properties

- **One RPC callsite** in `_resolveForward` (excluding the ENSv2 bailout).
- **Composable passes**: adding a new acceleration strategy = one more `operations = await <strategy>(operations, ...)` line. No partitioning bookkeeping.
- **Tracing preserved**: `AccelerateENSIP19ReverseResolver`, `AccelerateKnownOnchainStaticResolver`, `AccelerateKnownOffchainLookupResolver`, `RequireResolver`, `ExecuteResolveCalls` steps fire in positions equivalent to today.
- **No acceleration possible**: every operation stays unresolved through the accel passes and flows to the single RPC callsite — same behavior as today's pure-fallback branch.

### Future (out of scope)

The ENSv2 `executeResolveCallsWithUniversalResolver` bailout can be collapsed into the same linear flow as another terminal `Operation[]`-shaped pass (UniversalResolverV2 vs direct resolver calls). Follow-up once ENSv2 acceleration re-lands.

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

Resolution API: support contenthash, pubkey, abi, interfaces, dnszonehash, and version
selection. Protocol acceleration indexes contenthash, pubkey, dnszonehash, and handles
VersionChanged (clears records for the node, bumps version). ABI (bitmask query,
contract-equivalent) and interface records are selectable but always resolved via RPC.
```

---

## 13. Tests

### Unit
- `packages/ensnode-sdk/src/internal/interpret-*.test.ts` — sentinel → null for contenthash, pubkey, dnszonehash.
- `apps/ensapi/src/lib/resolution/make-records-response.test.ts` — `makeRecordsResponseFromResolveResults` shapes match every selection combination; `makeEmptyResolverRecordsResponse` returns correct nulls.

### Integration
- Indexer: fixture resolver emitting `ContenthashChanged` / `PubkeyChanged` / `DNSZonehashChanged` / `AddressChanged` / `TextChanged` / `VersionChanged` in order. Assert final DB state including reset scalars, cleared child rows, bumped version.
- Resolution API: real static resolver with records set for each type. Run with `{ accelerate: true }` and `{ accelerate: false }`. Assert identical responses (parity).
- Resolution API: mixed selection `{ name, addresses, texts, contenthash, abi, interfaces }` exercises both legs of hybrid path in one request. ABI-specific case: set JSON + CBOR for a node, query with `abi: 1n | 4n`, assert the returned `contentType` is `1n` (lowest matching bit wins).

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
5. Resolution API plumbing: `resolve-calls-and-results` (§7, includes new `Operation` type + split `interpretRawRpcCallAndResult`), `resolve-call-by-index` (§8), `get-records-from-index` (§9), `make-records-response` (§10), new `accelerate-ensip19-reverse-resolver.ts` + `accelerate-known-onchain-static-resolver.ts` + restructured `forward-resolution.ts` with `let operations` passes (§11).
6. Delete `makeRecordsResponseFromIndexedRecords` once no callers remain.
7. Tests (§13), changeset (§12).

Single PR. Branch from current `fix/name-index` parent or `main` per dependency.

---

## Unresolved questions

_(none — all prior questions resolved)_

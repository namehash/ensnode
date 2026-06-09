import {
  type AccountId,
  type Address,
  type CoinType,
  type Hex,
  type LiteralName,
  makeResolverId,
  makeResolverRecordsId,
  type Node,
} from "enssdk";

import {
  interpretAddressRecordValue,
  interpretContenthashValue,
  interpretDnszonehashValue,
  interpretNameRecordValue,
  interpretPubkeyValue,
  interpretTextRecordKey,
  interpretTextRecordValue,
  isExtendedResolver,
} from "@ensnode/ensnode-sdk/internal";

import { getThisAccountId } from "@/lib/get-this-account-id";
import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import type { EventWithArgs } from "@/lib/ponder-helpers";

/**
 * Infer the type of the ResolverRecord entity's composite key.
 */
type ResolverRecordsCompositeKey = Pick<
  typeof ensIndexerSchema.resolverRecords.$inferInsert,
  "chainId" | "address" | "node"
>;

/**
 * Ensures a Resolver entity exists for `resolver`, capturing additional metadata.
 *
 * @dev performs a single `supportsInterface` RPC (via Ponder's cached `context.client`) to determine
 * `isExtended` support.
 */
export async function upsertResolver(
  context: IndexingEngineContext,
  resolver: AccountId,
): Promise<typeof ensIndexerSchema.resolver.$inferSelect> {
  const id = makeResolverId(resolver);

  const existing = await context.ensDb.find(ensIndexerSchema.resolver, { id });
  if (existing) return existing;

  const isExtended = await isExtendedResolver({
    publicClient: context.client,
    address: resolver.address,
  });

  const row = { id, ...resolver, isExtended };
  await context.ensDb.insert(ensIndexerSchema.resolver).values(row).onConflictDoNothing();
  return row;
}

/**
 * Re-classifies a Resolver's `supportsInterface`-derived metadata (currently `isExtended`) by
 * re-running the eip-165 probe and overwriting the stored row.
 *
 * The initial `isExtended` classification in {@link upsertResolver} is computed once, at the block
 * the Resolver is first seen. For EIP-1967 proxy Resolvers that activate `IExtendedResolver` via an
 * `Upgraded` _after_ assignment (e.g. the 3DNS Resolver behind `.box`), that snapshot is stale
 * `false` forever. Call this from the proxy's `Upgraded` handler so the probe re-runs against the
 * new implementation (at the upgrade block) and `Resolver.extended` reflects current support.
 *
 * @dev performs a single `supportsInterface` RPC (via Ponder's cached `context.client`). Upserts so
 * an `Upgraded` observed before the Resolver has emitted any other event still creates the row.
 */
export async function reclassifyResolverExtendedSupport(
  context: IndexingEngineContext,
  resolver: AccountId,
): Promise<void> {
  const id = makeResolverId(resolver);

  const isExtended = await isExtendedResolver({
    publicClient: context.client,
    address: resolver.address,
  });

  await context.ensDb
    .insert(ensIndexerSchema.resolver)
    .values({ id, ...resolver, isExtended })
    .onConflictDoUpdate({ isExtended });
}

/**
 * Ensures the Resolver + ResolverRecords entities exist for the given Resolver event, and returns
 * the ResolverRecords key for further per-record updates.
 */
export async function ensureResolverAndRecords(
  context: IndexingEngineContext,
  event: EventWithArgs<{ node: Node }>,
): Promise<ResolverRecordsCompositeKey> {
  const resolver = getThisAccountId(context, event);
  const key: ResolverRecordsCompositeKey = { ...resolver, node: event.args.node };

  await upsertResolver(context, resolver);

  await context.ensDb
    .insert(ensIndexerSchema.resolverRecords)
    .values({ id: makeResolverRecordsId(resolver, event.args.node), ...key })
    .onConflictDoNothing();

  return key;
}

/**
 * Updates the `name` record value for the ResolverRecords described by `id`.
 */
export async function handleResolverNameUpdate(
  context: IndexingEngineContext,
  resolverRecordsKey: ResolverRecordsCompositeKey,
  name: LiteralName,
) {
  const resolverRecordsId = makeResolverRecordsId(
    { chainId: resolverRecordsKey.chainId, address: resolverRecordsKey.address },
    resolverRecordsKey.node,
  );

  await context.ensDb
    .update(ensIndexerSchema.resolverRecords, { id: resolverRecordsId })
    .set({ name: interpretNameRecordValue(name) });
}

/**
 * Updates the `address` record value by `coinType` for the ResolverRecords described by `id`.
 */
export async function handleResolverAddressRecordUpdate(
  context: IndexingEngineContext,
  resolverRecordsKey: ResolverRecordsCompositeKey,
  coinType: CoinType,
  address: Address,
) {
  // construct the ResolverAddressRecord's Composite Key
  const id = { ...resolverRecordsKey, coinType: BigInt(coinType) };

  // interpret the incoming address record value
  const interpretedValue = interpretAddressRecordValue(address);

  // consider this a deletion iff the interpreted value is null
  const isDeletion = interpretedValue === null;
  if (isDeletion) {
    // delete
    await context.ensDb.delete(ensIndexerSchema.resolverAddressRecord, id);
  } else {
    // upsert
    await context.ensDb
      .insert(ensIndexerSchema.resolverAddressRecord)
      .values({ ...id, value: interpretedValue })
      .onConflictDoUpdate({ value: interpretedValue });
  }
}

/**
 * Updates the `text` record value by `key` for the ResolverRecords described by `id`.
 *
 * If `value` is null, it will be interpreted as a deletion of the associated record.
 */
export async function handleResolverTextRecordUpdate(
  context: IndexingEngineContext,
  resolverRecordsId: ResolverRecordsCompositeKey,
  key: string,
  value: string | null,
) {
  const interpretedKey = interpretTextRecordKey(key);

  // ignore updates involving keys that should be ignored as per `interpretTextRecordKey`
  if (interpretedKey === null) return;

  // construct the ResolverTextRecord's Composite Key
  const id = { ...resolverRecordsId, key: interpretedKey };

  // interpret the incoming text record value
  const interpretedValue = value == null ? null : interpretTextRecordValue(value);

  // consider this a deletion iff the interpreted value is null
  const isDeletion = interpretedValue === null;
  if (isDeletion) {
    // delete
    await context.ensDb.delete(ensIndexerSchema.resolverTextRecord, id);
  } else {
    // upsert
    await context.ensDb
      .insert(ensIndexerSchema.resolverTextRecord)
      .values({ ...id, value: interpretedValue })
      .onConflictDoUpdate({ value: interpretedValue });
  }
}

/**
 * Updates the `contenthash` record value for the ResolverRecords described by `resolverRecordsKey`.
 */
export async function handleResolverContenthashUpdate(
  context: IndexingEngineContext,
  resolverRecordsKey: ResolverRecordsCompositeKey,
  rawHash: Hex,
) {
  const id = makeResolverRecordsId(
    { chainId: resolverRecordsKey.chainId, address: resolverRecordsKey.address },
    resolverRecordsKey.node,
  );

  await context.ensDb
    .update(ensIndexerSchema.resolverRecords, { id })
    .set({ contenthash: interpretContenthashValue(rawHash) });
}

/**
 * Updates the PubkeyResolver (x, y) pair for the ResolverRecords described by `resolverRecordsKey`.
 */
export async function handleResolverPubkeyUpdate(
  context: IndexingEngineContext,
  resolverRecordsKey: ResolverRecordsCompositeKey,
  x: Hex,
  y: Hex,
) {
  const id = makeResolverRecordsId(
    { chainId: resolverRecordsKey.chainId, address: resolverRecordsKey.address },
    resolverRecordsKey.node,
  );

  const pubkey = interpretPubkeyValue(x, y);

  await context.ensDb
    .update(ensIndexerSchema.resolverRecords, { id })
    .set({ pubkeyX: pubkey?.x ?? null, pubkeyY: pubkey?.y ?? null });
}

/**
 * Updates the IDNSZoneResolver `zonehash` record value for the ResolverRecords described
 * by `resolverRecordsKey`.
 */
export async function handleResolverDnszonehashUpdate(
  context: IndexingEngineContext,
  resolverRecordsKey: ResolverRecordsCompositeKey,
  rawHash: Hex,
) {
  const id = makeResolverRecordsId(
    { chainId: resolverRecordsKey.chainId, address: resolverRecordsKey.address },
    resolverRecordsKey.node,
  );

  await context.ensDb
    .update(ensIndexerSchema.resolverRecords, { id })
    .set({ dnszonehash: interpretDnszonehashValue(rawHash) });
}

import {
  type AccountId,
  type Address,
  type CoinType,
  type LiteralName,
  makeResolverId,
  makeResolverRecordsId,
  type Node,
} from "enssdk";

import {
  interpretAddressRecordValue,
  interpretNameRecordValue,
  interpretTextRecordKey,
  interpretTextRecordValue,
} from "@ensnode/ensnode-sdk/internal";

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
 * Constructs a ResolverRecordsCompositeKey from a provided Resolver event.
 *
 * @returns ResolverRecordsCompositeKey
 */
export function makeResolverRecordsCompositeKey(
  resolver: AccountId,
  event: EventWithArgs<{ node: Node }>,
): ResolverRecordsCompositeKey {
  return {
    ...resolver,
    node: event.args.node,
  };
}

/**
 * Ensures that the Resolver contract described by `resolver` exists.
 */
export async function ensureResolver(context: IndexingEngineContext, resolver: AccountId) {
  await context.ensDb
    .insert(ensIndexerSchema.resolver)
    .values({
      id: makeResolverId(resolver),
      ...resolver,
    })
    .onConflictDoNothing();
}

/**
 * Ensures that the ResolverRecords entity described by `resolverRecordsKey` exists.
 */
export async function ensureResolverRecords(
  context: IndexingEngineContext,
  resolverRecordsKey: ResolverRecordsCompositeKey,
) {
  const resolver: AccountId = {
    chainId: resolverRecordsKey.chainId,
    address: resolverRecordsKey.address,
  };
  const resolverRecordsId = makeResolverRecordsId(resolver, resolverRecordsKey.node);

  // ensure ResolverRecords
  await context.ensDb
    .insert(ensIndexerSchema.resolverRecords)
    .values({
      id: resolverRecordsId,
      ...resolverRecordsKey,
    })
    .onConflictDoNothing();
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

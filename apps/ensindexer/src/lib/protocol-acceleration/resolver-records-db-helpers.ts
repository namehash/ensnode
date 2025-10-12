import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { type Address } from "viem";

import { Node } from "@ensnode/ensnode-sdk";

import {
  interpretAddressRecordValue,
  interpretNameRecordValue,
  interpretTextRecordKey,
  interpretTextRecordValue,
} from "@/lib/interpret-record-values";
import { EventWithArgs } from "@/lib/ponder-helpers";

/**
 * Infer the type of the ResolverRecord entity's composite primary key.
 */
type ResolverRecordsId = Pick<
  typeof schema.resolverRecords.$inferInsert,
  "chainId" | "resolver" | "node"
>;

/**
 * Constructs a ResolverRecordsId from a provided Resolver event.
 *
 * @returns ResolverRecordsId
 */
export function makeResolverRecordsId(
  context: Context,
  event: EventWithArgs<{ node: Node }>,
): ResolverRecordsId {
  return {
    chainId: context.chain.id,
    resolver: event.log.address,
    node: event.args.node,
  };
}

/**
 * Ensures that the ResolverRecords entity described by `id` exists.
 */
export async function ensureResolverRecords(context: Context, id: ResolverRecordsId) {
  await context.db.insert(schema.resolverRecords).values(id).onConflictDoNothing();
}

/**
 * Updates the `name` record value for the ResolverRecords described by `id`.
 */
export async function handleResolverNameUpdate(
  context: Context,
  id: ResolverRecordsId,
  name: string,
) {
  await context.db.update(schema.resolverRecords, id).set({ name: interpretNameRecordValue(name) });
}

/**
 * Updates the `address` record value by `coinType` for the ResolverRecords described by `id`.
 */
export async function handleResolverAddressRecordUpdate(
  context: Context,
  resolverRecordsId: ResolverRecordsId,
  coinType: bigint,
  address: Address,
) {
  // construct the ResolverAddressRecord's Composite Key
  const id = { ...resolverRecordsId, coinType };

  // interpret the incoming address record value
  const interpretedValue = interpretAddressRecordValue(address);

  // consider this a deletion iff the interpreted value is null
  const isDeletion = interpretedValue === null;
  if (isDeletion) {
    // delete
    await context.db.delete(schema.resolverAddressRecord, id);
  } else {
    // upsert
    await context.db
      .insert(schema.resolverAddressRecord)
      .values({ ...id, address: interpretedValue })
      .onConflictDoUpdate({ address: interpretedValue });
  }
}

/**
 * Updates the `text` record value by `key` for the ResolverRecords described by `id`.
 *
 * If `value` is null, it will be interpreted as a deletion of the associated record.
 */
export async function handleResolverTextRecordUpdate(
  context: Context,
  resolverRecordsId: ResolverRecordsId,
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
    await context.db.delete(schema.resolverTextRecord, id);
  } else {
    // upsert
    await context.db
      .insert(schema.resolverTextRecord)
      .values({ ...id, value: interpretedValue })
      .onConflictDoUpdate({ value: interpretedValue });
  }
}

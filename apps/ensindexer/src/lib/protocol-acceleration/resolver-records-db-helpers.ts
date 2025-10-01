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
  typeof schema.ext_resolverRecords.$inferInsert,
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
  await context.db.insert(schema.ext_resolverRecords).values(id).onConflictDoNothing();
}

/**
 * Updates the `name` record value for the ResolverRecords described by `id`.
 */
export async function handleResolverNameUpdate(
  context: Context,
  id: ResolverRecordsId,
  name: string,
) {
  await context.db
    .update(schema.ext_resolverRecords, id)
    .set({ name: interpretNameRecordValue(name) });
}

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
    await context.db.delete(schema.ext_resolverAddressRecord, id);
  } else {
    // upsert
    await context.db
      .insert(schema.ext_resolverAddressRecord)
      .values({ ...id, address: interpretedValue })
      .onConflictDoUpdate({ address: interpretedValue });
  }
}

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
    await context.db.delete(schema.ext_resolverTextRecord, id);
  } else {
    // upsert
    await context.db
      .insert(schema.ext_resolverTextRecord)
      .values({ ...id, value: interpretedValue })
      .onConflictDoUpdate({ value: interpretedValue });
  }
}

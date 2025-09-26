import { Context } from "ponder:registry";
import schema from "ponder:schema";

import { makeKeyedResolverRecordId, makeResolverRecordsId } from "@/lib/ids";
import {
  interpretAddressRecordValue,
  interpretNameRecordValue,
  interpretTextRecordKey,
  interpretTextRecordValue,
} from "@/lib/interpret-record-values";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { Node } from "@ensnode/ensnode-sdk";
import { type Address } from "viem";

export async function ensureResolverRecords(
  context: Context,
  event: EventWithArgs<{ node: Node }>,
) {
  const chainId = context.chain.id;
  const address = event.log.address;
  const { node } = event.args;

  const id = makeResolverRecordsId(chainId, address, node);

  await context.db
    .insert(schema.ext_resolverRecords)
    .values({
      id,
      chainId,
      address,
      node,
    })
    .onConflictDoNothing();

  return id;
}

export async function handleResolverNameUpdate(
  context: Context,
  resolverRecordsId: string,
  name: string,
) {
  await context.db
    .update(schema.ext_resolverRecords, { id: resolverRecordsId })
    .set({ name: interpretNameRecordValue(name) });
}

export async function handleResolverAddressRecordUpdate(
  context: Context,
  resolverRecordsId: string,
  coinType: bigint,
  address: Address,
) {
  const recordId = makeKeyedResolverRecordId(resolverRecordsId, coinType.toString());
  const interpretedValue = interpretAddressRecordValue(address);

  const isDeletion = interpretedValue === null;
  if (isDeletion) {
    // delete
    await context.db.delete(schema.ext_resolverAddressRecords, { id: recordId });
  } else {
    // upsert
    await context.db
      .insert(schema.ext_resolverAddressRecords)
      // create a new address record entity
      .values({
        id: recordId,
        resolverRecordsId,
        coinType,
        address: interpretedValue,
      })
      // or update the existing one
      .onConflictDoUpdate({ address: interpretedValue });
  }
}

export async function handleResolverTextRecordUpdate(
  context: Context,
  resolverRecordsId: string,
  key: string,
  value: string | null,
) {
  const interpretedKey = interpretTextRecordKey(key);

  // ignore updates involving keys that should be ignored as per `interpretTextRecordKey`
  if (interpretedKey === null) return;

  const recordId = makeKeyedResolverRecordId(resolverRecordsId, interpretedKey);

  // interpret the incoming text record value
  const interpretedValue = value == null ? null : interpretTextRecordValue(value);

  // consider this a deletion iff the interpreted value is null
  const isDeletion = interpretedValue === null;
  if (isDeletion) {
    // delete
    await context.db.delete(schema.ext_resolverTextRecords, { id: recordId });
  } else {
    // upsert
    await context.db
      .insert(schema.ext_resolverTextRecords)
      // create a new text record entity
      .values({
        id: recordId,
        resolverRecordsId,
        key: interpretedKey,
        value: interpretedValue,
      })
      // or update the existing one
      .onConflictDoUpdate({ value: interpretedValue });
  }
}

import { Context } from "ponder:registry";
import schema from "ponder:schema";

import { makeKeyedResolverRecordId } from "@/lib/ids";
import {
  interpretAddressRecordValue,
  interpretNameRecordValue,
  interpretTextRecordKey,
  interpretTextRecordValue,
} from "@/lib/interpret-record-values";
import { type Address } from "viem";

export async function handleResolverNameUpdate(context: Context, resolverId: string, name: string) {
  await context.db
    .update(schema.resolver, { id: resolverId })
    .set({ name: interpretNameRecordValue(name) });
}

export async function handleResolverAddressRecordUpdate(
  context: Context,
  resolverId: string,
  coinType: bigint,
  address: Address,
) {
  const recordId = makeKeyedResolverRecordId(resolverId, coinType.toString());
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
        resolverId,
        coinType,
        address: interpretedValue,
      })
      // or update the existing one
      .onConflictDoUpdate({ address: interpretedValue });
  }
}

export async function handleResolverTextRecordUpdate(
  context: Context,
  resolverId: string,
  key: string,
  value: string | null,
) {
  const interpretedKey = interpretTextRecordKey(key);

  // ignore updates involving keys that should be ignored as per `interpretTextRecordKey`
  if (interpretedKey === null) return;

  const recordId = makeKeyedResolverRecordId(resolverId, interpretedKey);

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
        resolverId,
        key: interpretedKey,
        value: interpretedValue,
      })
      // or update the existing one
      .onConflictDoUpdate({ value: interpretedValue });
  }
}

import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { getAddress, isAddress, isAddressEqual, zeroAddress } from "viem";

import { makeKeyedResolverRecordId } from "@/lib/ids";
import { stripNullBytes } from "@/lib/lib-helpers";
import { Name, isNormalizedName } from "@ensnode/ensnode-sdk";

/**
 * Interprets the provided name() record value, ensuring that it is either:
 * a) a normalized, non-empty-string Name, or
 * b) null, representing the non-existence (deletion) of the record value.
 *
 * @param value - The name record value string to validate
 * @returns A normalized Name for use as a name record, or null if value was interpreted as a deletion
 */
export function interpretNameRecordValue(value: string): Name | null {
  // empty string is technically a normalized name, representing the ens root node, but in the
  // context of a name record value, we want to coerce empty string to null, to represent the
  // non-existence of a record value. this is because the abi of this event is only capable of
  // expressing string values, so empty string canonically represents the non-existence of the
  // record value.
  if (value === "") return null;

  // if not normalized, is not valid `name` record value
  if (!isNormalizedName(value)) return null;

  // otherwise, this is a non-empty-string normalized Name that can be used as a name() record value
  return value as Name;
}

export async function handleResolverNameUpdate(context: Context, resolverId: string, name: string) {
  await context.db
    .update(schema.resolver, { id: resolverId })
    .set({ name: interpretNameRecordValue(name) });
}

export async function handleResolverAddressRecordUpdate(
  context: Context,
  resolverId: string,
  coinType: bigint,
  address: string,
) {
  const recordId = makeKeyedResolverRecordId(resolverId, coinType.toString());
  const isDeletion = address === "" || (isAddress(address) && isAddressEqual(address, zeroAddress));
  if (isDeletion) {
    // delete
    await context.db.delete(schema.ext_resolverAddressRecords, { id: recordId });
  } else {
    // checksum the stored value if it is an EVM address
    const addressRecordValue = isAddress(address) ? getAddress(address) : address;

    // upsert
    await context.db
      .insert(schema.ext_resolverAddressRecords)
      // create a new address record entity
      .values({
        id: recordId,
        resolverId,
        coinType,
        address: addressRecordValue,
      })
      // or update the existing one
      .onConflictDoUpdate({ address: addressRecordValue });
  }
}

export async function handleResolverTextRecordUpdate(
  context: Context,
  resolverId: string,
  key: string,
  value: string | undefined | null,
) {
  // if value is undefined, this is a LegacyPublicResolver (DefaultPublicResolver1) event, nothing to do
  // TODO: fetch the resolver value using ponder's cached publicClient
  if (value === undefined) return;

  // TODO(null-bytes): store null bytes correctly
  const sanitizedKey = stripNullBytes(key);

  const recordId = makeKeyedResolverRecordId(resolverId, sanitizedKey);

  // sanitize the incoming text record value by stripping null bytes
  const sanitizedValue = value ? stripNullBytes(value) : value;

  // consider this a deletion iff value is null or is empty string
  const isDeletion = sanitizedValue === null || sanitizedValue === "";
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
        key: sanitizedKey,
        value: sanitizedValue,
      })
      // or update the existing one
      .onConflictDoUpdate({ value: sanitizedValue });
  }
}

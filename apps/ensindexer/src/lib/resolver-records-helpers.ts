import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { makeKeyedResolverRecordId } from "@/lib/ids";
import { stripNullBytes } from "@/lib/lib-helpers";
import { Address, isAddress, zeroAddress } from "viem";

export async function handleResolverNameUpdate(
  context: Context,
  resolverId: string,
  name: string | null,
) {
  // TODO(null-bytes): represent null bytes correctly
  const sanitizedName = name !== null ? stripNullBytes(name) : null;

  await context.db.update(schema.resolver, { id: resolverId }).set({
    name: sanitizedName || null, // additionally coalesce falsy values (empty string) into null
  });
}

export async function handleResolverAddressRecordUpdate(
  context: Context,
  resolverId: string,
  coinType: bigint,
  address: Address,
) {
  const recordId = makeKeyedResolverRecordId(resolverId, coinType.toString());
  const isDeletion = !isAddress(address) || address === zeroAddress;
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
        address,
      })
      // or update the existing one
      .onConflictDoUpdate({ address });
  }
}

export async function handleResolverTextRecordUpdate(
  context: Context,
  resolverId: string,
  key: string,
  value: string | undefined | null,
) {
  // if value is undefined, this is a LegacyPublicResolver event, nothing to do
  if (value === undefined) return;

  // TODO(null-bytes): store null bytes correctly
  const sanitizedKey = stripNullBytes(key);

  const recordId = makeKeyedResolverRecordId(resolverId, sanitizedKey);

  // consider this a deletion iff value is null or is empty string
  const isDeletion = value === null || value === "";
  if (isDeletion) {
    // delete
    await context.db.delete(schema.ext_resolverTextRecords, { id: recordId });
  } else {
    // upsert
    // if no sanitized value to index, don't create a record
    // TODO(null-bytes): represent null bytes correctly or stripNullBytes and store them anyway
    //  but that's not technically correct, so idk
    const sanitizedValue = stripNullBytes(value);
    if (!sanitizedValue) return;

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

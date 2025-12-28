import config from "@/config";

import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import {
  type AccountId,
  type CoinType,
  makeResolverId,
  makeResolverRecordsId,
  type Node,
} from "@ensnode/ensnode-sdk";
import {
  interpretAddressRecordValue,
  interpretNameRecordValue,
  interpretTextRecordKey,
  interpretTextRecordValue,
  isBridgedResolver,
  isDedicatedResolver,
  isExtendedResolver,
  isKnownENSIP19ReverseResolver,
  isStaticResolver,
  staticResolverImplementsAddressRecordDefaulting,
} from "@ensnode/ensnode-sdk/internal";

import type { EventWithArgs } from "@/lib/ponder-helpers";

/**
 * Infer the type of the ResolverRecord entity's composite key.
 */
type ResolverRecordsCompositeKey = Pick<
  typeof schema.resolverRecords.$inferInsert,
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
 * Ensures that the Resolver contract described by `resolver` exists, including behavioral metadata
 * on initial insert.
 */
export async function ensureResolver(context: Context, resolver: AccountId) {
  const resolverId = makeResolverId(resolver);
  const existing = await context.db.find(schema.resolver, { id: resolverId });
  if (existing) return;

  const isExtended = await isExtendedResolver({
    address: resolver.address,
    publicClient: context.client,
  });

  const isDedicated = await isDedicatedResolver({
    address: resolver.address,
    publicClient: context.client,
  });

  const isENSIP19ReverseResolver = isKnownENSIP19ReverseResolver(config.namespace, resolver);
  const bridgesToRegistry = isBridgedResolver(config.namespace, resolver);
  const isStatic = isStaticResolver(config.namespace, resolver);

  const implementsAddressRecordDefaulting = isStatic
    ? staticResolverImplementsAddressRecordDefaulting(config.namespace, resolver)
    : null;

  // ensure Resolver
  await context.db.insert(schema.resolver).values({
    id: resolverId,
    ...resolver,
    isExtended,
    isDedicated,
    isStatic,
    isENSIP19ReverseResolver,
    implementsAddressRecordDefaulting,
    bridgesToRegistryChainId: bridgesToRegistry?.chainId ?? null,
    bridgesToRegistryAddress: bridgesToRegistry?.address ?? null,
  });
}

/**
 * Ensures that the ResolverRecords entity described by `resolverRecordsKey` exists.
 */
export async function ensureResolverRecords(
  context: Context,
  resolverRecordsKey: ResolverRecordsCompositeKey,
) {
  const resolver: AccountId = {
    chainId: resolverRecordsKey.chainId,
    address: resolverRecordsKey.address,
  };
  const resolverRecordsId = makeResolverRecordsId(resolver, resolverRecordsKey.node);

  // ensure ResolverRecords
  await context.db
    .insert(schema.resolverRecords)
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
  context: Context,
  resolverRecordsKey: ResolverRecordsCompositeKey,
  name: string,
) {
  const resolverRecordsId = makeResolverRecordsId(
    { chainId: resolverRecordsKey.chainId, address: resolverRecordsKey.address },
    resolverRecordsKey.node,
  );

  await context.db
    .update(schema.resolverRecords, { id: resolverRecordsId })
    .set({ name: interpretNameRecordValue(name) });
}

/**
 * Updates the `address` record value by `coinType` for the ResolverRecords described by `id`.
 */
export async function handleResolverAddressRecordUpdate(
  context: Context,
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
    await context.db.delete(schema.resolverAddressRecord, id);
  } else {
    // upsert
    await context.db
      .insert(schema.resolverAddressRecord)
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
  context: Context,
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
    await context.db.delete(schema.resolverTextRecord, id);
  } else {
    // upsert
    await context.db
      .insert(schema.resolverTextRecord)
      .values({ ...id, value: interpretedValue })
      .onConflictDoUpdate({ value: interpretedValue });
  }
}

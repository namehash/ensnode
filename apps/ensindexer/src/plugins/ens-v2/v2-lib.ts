/**
 * This file temporarily located here for prototyping—should be moved to ensnode-utils.
 */

import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { LabelHash, Node } from "@ensnode/utils/types";
import { AccountId } from "caip";
import { Address, getAddress, hexToBigInt, namehash } from "viem";

const LABEL_HASH_MASK = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000n;

///
/// UPSERTS
///

export async function upsertRegistry(
  context: Context,
  values: typeof schema.v2_registry.$inferInsert,
) {
  return await context.db.insert(schema.v2_registry).values(values).onConflictDoUpdate(values);
}

export async function upsertResolverRecords(
  context: Context,
  values: typeof schema.v2_resolverRecords.$inferInsert,
) {
  // ensure Resolver entity
  await context.db
    .insert(schema.v2_resolver)
    .values({ id: values.resolverId })
    .onConflictDoNothing();

  // ensure ResolverRecords entity
  return context.db //
    .insert(schema.v2_resolverRecords)
    .values(values)
    .onConflictDoUpdate(values);
}

///
/// IDS
///

/**
 * Encodes a contract's cross-chain unique address using a CAIP-10 AccountId.
 *
 * @param chainId source chain id
 * @param address contract address
 * @returns
 */
export const makeContractId = (chainId: number, address: Address) => {
  // ensure checksummed
  if (address !== getAddress(address)) {
    throw new Error(`makeContractId: "${address}" is not checksummed`);
  }

  return new AccountId({
    chainId: {
      namespace: "eip155", // ENSIndexer only ever indexes EVM chains namespaced by eip155
      reference: chainId.toString(),
    },
    address,
  }).toString();
};

export const makeResolverRecordsId = (resolverId: string, node: Node) =>
  [resolverId, node].join("-");

export const makeLabelId = (registryId: string, tokenId: bigint) => [registryId, tokenId].join("-");

export const makeResolverRecordsAddressId = (resolverRecordsId: string, coinType: bigint) =>
  [resolverRecordsId, coinType].join("-");

///
/// UTILS
///

/**
 * masks a given tokenId
 */

export const maskTokenId = (tokenId: bigint) => tokenId & LABEL_HASH_MASK;

/**
 * encodes a hex labelHash as bigint, masking the lower 32 bits
 */
export const labelHashToTokenId = (labelHash: LabelHash) =>
  maskTokenId(hexToBigInt(labelHash, { size: 32 }));

///
/// Helpers
///

export async function materializeLabelName(context: Context, labelId: string) {
  // TODO: implement Label name materialization by traversing tree
}

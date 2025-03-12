/**
 * This file temporarily located here for prototyping—should be moved to ensnode-utils.
 */

import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { encodeLabelhash } from "@ensdomains/ensjs/utils";
import { LabelHash, Node } from "@ensnode/utils/types";
import { AccountId } from "caip";
import { Address, getAddress, hexToBigInt, namehash, toHex } from "viem";

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

export const makeDomainId = (registryId: string, tokenId: bigint) =>
  [registryId, tokenId].join("-");

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

/**
 * decodes a bigint tokenId into a hex labelHash
 */
export const tokenIdToLabelHash = (tokenId: bigint): LabelHash => toHex(tokenId, { size: 32 });

///
/// Helpers
///

/**
 * constructs a Domain's name by traversing the hierarchical namespace upwards.
 * NOTE: likely more efficient than custom sql due to in-memory cache-ability
 */
async function constructDomainName(context: Context, domainId: string): Promise<string> {
  const domain = await context.db.find(schema.v2_domain, { id: domainId });
  if (!domain) {
    throw new Error(`constructDomainName: expected domainId "${domainId}" to exist, it does not`);
  }

  const parentRegistry = await context.db.find(schema.v2_registry, { id: domain.registryId });
  if (!parentRegistry) {
    throw new Error(
      `constructDomainName: expected registryId "${domain.registryId}" to exist, it does not`,
    );
  }

  // human-readable label or encoded labelHash
  const label = domain.label ?? encodeLabelhash(tokenIdToLabelHash(domain.tokenId));

  console.log("constructDomainName", { segment: label, parentId: parentRegistry.domainId });

  // this is the root Registry, which does not have an associated Domain
  if (!parentRegistry.domainId) return label;

  // otherwise, recurse
  return [label, await constructDomainName(context, parentRegistry.domainId)].join(".");
}

// updates a Domain's `name` and `node` by materializing its location in the hierarchical name tree
export async function materializeDomainName(context: Context, domainId: string) {
  const name = await constructDomainName(context, domainId);
  const node = namehash(name);

  await context.db.update(schema.v2_domain, { id: domainId }).set({ name, node });
}

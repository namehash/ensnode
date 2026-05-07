import { AccountId as CaipAccountId, AssetId as CaipAssetId } from "caip";

import type { AccountId, AccountIdString, AssetId, AssetIdString } from "./types";

/**
 * Stringify an {@link AccountId} as a fully lowercase CAIP-10 AccountId string.
 *
 * @see https://chainagnostic.org/CAIPs/caip-10
 */
export function stringifyAccountId({ chainId, address }: AccountId): AccountIdString {
  return CaipAccountId.format({
    chainId: { namespace: "eip155", reference: chainId.toString() },
    address,
  }).toLowerCase();
}

/**
 * Stringify an {@link AssetId} as a fully lowercase CAIP-19 AssetId string.
 *
 * @see https://chainagnostic.org/CAIPs/caip-19
 */
export function stringifyAssetId({
  assetNamespace,
  contract: { chainId, address },
  tokenId,
}: AssetId): AssetIdString {
  return CaipAssetId.format({
    chainId: { namespace: "eip155", reference: chainId.toString() },
    assetName: { namespace: assetNamespace, reference: address },
    tokenId: tokenId.toString(),
  }).toLowerCase();
}

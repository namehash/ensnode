import type { Address } from "viem";

import {
  type DomainAssetId,
  type NFTMintStatus,
  type SerializedDomainAssetId,
  serializeDomainAssetId,
} from "./assets";

export interface NameToken {
  /**
   * Domain Asset
   *
   * References NFT that tokenizes the ownership of a domain.
   */
  domainAsset: DomainAssetId;

  /**
   * Owner
   *
   * Identifies the address that acquired the name token.
   *
   * The "chainId" of this address is the same as is referenced in
   * `domainAsset.contract.chainId`.
   */
  owner: Address;

  /**
   * The mint status of the token.
   *
   * After an NFT was indexed it can never be deleted. Instead, when an
   * indexed NFT is burned onchain its record is retained and its mint
   * status is updated as `burned`. If the NFT is minted again after
   * it was burned, its mint status is updated to `minted`.
   */
  mintStatus: NFTMintStatus;
}

/**
 * Serialized representation of {@link NameToken}.
 */
export interface SerializedNameToken extends Omit<NameToken, "domainAsset"> {
  domainAsset: SerializedDomainAssetId;
}

export function serializeNameToken(nameToken: NameToken): SerializedNameToken {
  return {
    domainAsset: serializeDomainAssetId(nameToken.domainAsset),
    owner: nameToken.owner,
    mintStatus: nameToken.mintStatus,
  };
}

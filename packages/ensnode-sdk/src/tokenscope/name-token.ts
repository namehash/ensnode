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
   * Identifies the address that owns the name token.
   *
   * The "chainId" of this address is the same as is referenced in
   * `domainAsset.contract.chainId`.
   */
  owner: Address;

  /**
   * The mint status of the token.
   *
   * After ENSNode indexes the token for a name, even if that token is burned,
   * ENSNode will never forget how the token once represented the name.
   * When the token for a name is burned, ENSNode remembers this token but
   * updates its mint status to `burned`. If this token becomes minted again
   * after it was burned, its mint status is updated to `minted` again.
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

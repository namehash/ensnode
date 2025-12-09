import { type Address, zeroAddress } from "viem";

import type { AccountId } from "../shared";
import {
  type DomainAssetId,
  type NFTMintStatus,
  type SerializedDomainAssetId,
  serializeDomainAssetId,
} from "./assets";

/**
 * An enum representing the possible Name Token Ownership types.
 */
export const NameTokenOwnershipTypes = {
  Proxy: "proxy",
  Effective: "effective",
  Burned: "burned",
} as const;

export type NameTokenOwnershipType =
  (typeof NameTokenOwnershipTypes)[keyof typeof NameTokenOwnershipTypes];

export interface NameTokenOwnershipProxy {
  ownershipType: typeof NameTokenOwnershipTypes.Proxy;

  /**
   * Owner
   *
   * Guarantees:
   * - `owner.address` is not the zero address.
   */
  owner: AccountId;
}

export interface NameTokenOwnershipEffective {
  ownershipType: typeof NameTokenOwnershipTypes.Effective;

  /**
   * Owner
   *
   * Guarantees:
   * - `owner.address` is not the zero address.
   */
  owner: AccountId;
}

export interface NameTokenOwnershipBurned {
  ownershipType: typeof NameTokenOwnershipTypes.Burned;

  /**
   * Owner
   *
   * Guarantees:
   * - `owner.address` is the zero address.
   */
  owner: AccountId;
}

export type NameTokenOwnership =
  | NameTokenOwnershipProxy
  | NameTokenOwnershipEffective
  | NameTokenOwnershipBurned;

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
   * The `ownership.owner.chainId` of this address is the same as is referenced
   * in `domainAsset.contract.chainId`.
   */
  ownership: NameTokenOwnership;

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
    ownership: nameToken.ownership,
    mintStatus: nameToken.mintStatus,
  };
}

/**
 * Get ownership type for provided owner address.
 */
export function getOwnershipType(
  ownerAddress: Address,
  nameWrapperAddresses: Address[],
): NameTokenOwnershipType {
  const nameWrapperAddressIsOwnerAddress = nameWrapperAddresses.some(
    (address) => address === ownerAddress,
  );

  if (nameWrapperAddressIsOwnerAddress) {
    return NameTokenOwnershipTypes.Proxy;
  }

  if (ownerAddress === zeroAddress) {
    return NameTokenOwnershipTypes.Burned;
  }

  return NameTokenOwnershipTypes.Effective;
}

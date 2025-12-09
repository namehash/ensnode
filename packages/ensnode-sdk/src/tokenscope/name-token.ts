import { isAddressEqual, zeroAddress } from "viem";

import { DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";

import { getParentNameFQDN, type InterpretedName } from "../ens";
import { type AccountId, accountIdEqual } from "../shared";
import { getDatasourceContract, maybeGetDatasourceContract } from "../shared/datasource-contract";
import {
  type AssetId,
  type NFTMintStatus,
  type SerializedAssetId,
  serializeAssetId,
} from "./assets";

/**
 * An enum representing the possible Name Token Ownership types.
 */
export const NameTokenOwnershipTypes = {
  NameWrapper: "namewrapper",
  FullyOnchain: "fully-onchain",
  Burned: "burned",
  Unknown: "unknown",
} as const;

export type NameTokenOwnershipType =
  (typeof NameTokenOwnershipTypes)[keyof typeof NameTokenOwnershipTypes];

export interface NameTokenOwnershipNameWrapper {
  ownershipType: typeof NameTokenOwnershipTypes.NameWrapper;

  /**
   * Owner
   *
   * Guarantees:
   * - `owner.address` is not the zero address.
   * - `owner.chainId` is same as to the chainId of the associated NFT,
   *    even if that NFT has been burned.
   */
  owner: AccountId;
}

export interface NameTokenOwnershipFullyOnchain {
  ownershipType: typeof NameTokenOwnershipTypes.FullyOnchain;

  /**
   * Owner
   *
   * Guarantees:
   * - `owner.address` is not the zero address.
   * - `owner.chainId` is same as to the chainId of the associated NFT,
   *    even if that NFT has been burned.
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
   * - `owner.chainId` is same as to the chainId of the associated NFT,
   *    even if that NFT has been burned.
   */
  owner: AccountId;
}

export interface NameTokenOwnershipUnknown {
  ownershipType: typeof NameTokenOwnershipTypes.Unknown;

  /**
   * Owner
   *
   * Guarantees:
   * - `owner.address` is the zero address.
   * - `owner.chainId` is same as to the chainId of the associated NFT,
   *    even if that NFT has been burned.
   */
  owner: AccountId;
}

export type NameTokenOwnership =
  | NameTokenOwnershipNameWrapper
  | NameTokenOwnershipFullyOnchain
  | NameTokenOwnershipBurned
  | NameTokenOwnershipUnknown;

export interface NameToken {
  /**
   * Token
   *
   * References NFT that tokenizes the ownership of a domain.
   */
  token: AssetId;

  /**
   * Owner
   *
   * Identifies the ownership state of the token.
   *
   * Guarantees:
   * - The `ownership.owner.chainId` of this address is the same as is referenced
   *   in `domainAsset.contract.chainId`.
   */
  ownership: NameTokenOwnership;

  /**
   * The mint status of the token.
   *
   * After ENSNode indexes the token for a name, even if that token is burned,
   * ENSNode will never forget how the token once represented the name.
   * When the token for a name is burned, ENSNode remembers this token but
   * updates its `mintStatus` to `burned`. If this token becomes minted again
   * after it was burned, its `mintStatus` is updated to `minted` again.
   *
   * Guarantees:
   * - The `mintStatus` will be burned if and only
   *   if `ownership.ownershipType` is `NameTokenOwnershipTypes.Burned`.
   */
  mintStatus: NFTMintStatus;
}

/**
 * Serialized representation of {@link NameToken}.
 */
export interface SerializedNameToken extends Omit<NameToken, "token"> {
  token: SerializedAssetId;
}

export function serializeNameToken(nameToken: NameToken): SerializedNameToken {
  return {
    token: serializeAssetId(nameToken.token),
    ownership: nameToken.ownership,
    mintStatus: nameToken.mintStatus,
  };
}

/**
 * Get all NameWrapper accounts within provided ENS Namespace.
 *
 * Guaranteed to return at least one account for ENSRoot Datasource.
 */
export function getNameWrapperAccounts(namespaceId: ENSNamespaceId): [AccountId, ...AccountId[]] {
  const ethnamesNameWrapperAccount = getDatasourceContract(
    namespaceId,
    DatasourceNames.ENSRoot,
    "NameWrapper",
  );

  const lineanamesNameWrapperAccount = maybeGetDatasourceContract(
    namespaceId,
    DatasourceNames.Lineanames,
    "NameWrapper",
  );

  const nameWrapperAccounts: [AccountId, ...AccountId[]] = [
    // NameWrapper for direct subnames of .eth is always defined
    ethnamesNameWrapperAccount,
  ];

  if (lineanamesNameWrapperAccount) {
    // NameWrapper for Lineanames may be optionally defined
    nameWrapperAccounts.push(lineanamesNameWrapperAccount);
  }

  return nameWrapperAccounts;
}

/**
 * Get name token ownership for provided owner account within selected ENS Namespace.
 */
export function getNameTokenOwnership(
  namespaceId: ENSNamespaceId,
  name: InterpretedName,
  owner: AccountId,
): NameTokenOwnership {
  const nameWrapperAccounts = getNameWrapperAccounts(namespaceId);
  const hasNameWrapperOwnership = nameWrapperAccounts.some((nameWrapperAccount) =>
    accountIdEqual(owner, nameWrapperAccount),
  );

  if (hasNameWrapperOwnership) {
    return {
      ownershipType: NameTokenOwnershipTypes.NameWrapper,
      owner,
    } satisfies NameTokenOwnershipNameWrapper;
  }

  if (isAddressEqual(owner.address, zeroAddress)) {
    return {
      ownershipType: NameTokenOwnershipTypes.Burned,
      owner,
    } satisfies NameTokenOwnershipBurned;
  }

  const parentName = getParentNameFQDN(name);

  // set ownershipType as 'fully-onchain' if `name` is a direct subname of .eth
  if (parentName === "eth") {
    return {
      ownershipType: NameTokenOwnershipTypes.FullyOnchain,
      owner,
    } satisfies NameTokenOwnershipFullyOnchain;
  }

  return {
    ownershipType: NameTokenOwnershipTypes.Unknown,
    owner,
  } satisfies NameTokenOwnershipUnknown;
}

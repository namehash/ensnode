import type { ENSNamespaceId } from "@ensnode/datasources";
import {
  getLineanamesSubregistryManagedName,
  type LabelHash,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";

import type { RegistrarManagedName } from "@/lib/types";

/**
 * When direct subnames of Lineanames are registered through
 * the Lineanames ETHRegistrarController contract,
 * an ERC721 NFT is minted that tokenizes ownership of the registration.
 * The minted NFT will be assigned a unique tokenId represented as
 * uint256(labelhash(label)) where label is the direct subname of
 * Lineanames that was registered.
 * https://github.com/Consensys/linea-ens/blob/3a4f02f/packages/linea-ens-contracts/contracts/ethregistrar/ETHRegistrarController.sol#L447
 */
export function tokenIdToLabelHash(tokenId: bigint): LabelHash {
  return uint256ToHex32(tokenId);
}

/**
 * Get registrar managed name for `lineanames` subregistry for selected ENS namespace.
 *
 * @param namespaceId
 * @returns registrar managed name
 * @throws an error when no registrar managed name could be returned
 */
export function getRegistrarManagedName(namespaceId: ENSNamespaceId): RegistrarManagedName {
  return getLineanamesSubregistryManagedName(namespaceId);
}

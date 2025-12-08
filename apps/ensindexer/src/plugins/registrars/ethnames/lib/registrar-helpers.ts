import type { ENSNamespaceId } from "@ensnode/datasources";
import { type LabelHash, uint256ToHex32 } from "@ensnode/ensnode-sdk";

import type { RegistrarManagedName } from "@/lib/types";

/**
 * When direct subnames of Ethnames are registered through
 * the Ethnames ETHRegistrarController contract,
 * an ERC721 NFT is minted that tokenizes ownership of the registration.
 * The minted NFT will be assigned a unique tokenId which is
 * uint256(labelhash(label)) where label is the direct subname of
 * the Ethname that was registered.
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 */
export function tokenIdToLabelHash(tokenId: bigint): LabelHash {
  return uint256ToHex32(tokenId);
}

/**
 * Get the registrar managed name for the Ethnames subregistry for the selected ENS namespace.
 *
 * @param namespaceId
 * @returns registrar managed name
 */
export function getRegistrarManagedName(namespaceId: ENSNamespaceId): RegistrarManagedName {
  switch (namespaceId) {
    case "mainnet":
    case "sepolia":
    case "holesky":
    case "ens-test-env":
      return "eth";
  }
}

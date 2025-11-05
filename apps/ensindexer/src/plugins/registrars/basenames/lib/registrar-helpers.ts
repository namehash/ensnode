import type { ENSNamespaceId } from "@ensnode/datasources";
import { type LabelHash, uint256ToHex32 } from "@ensnode/ensnode-sdk";

import type { RegistrarManagedName } from "@/lib/types";

/**
 * When direct subnames of Basenames are registered through
 * the Basenames RegistrarController contract,
 * an ERC721 NFT is minted that tokenizes ownership of the registration.
 * The minted NFT will be assigned a unique tokenId represented as
 * uint256(labelhash(label)) where label is the direct subname of
 * the Basename that was registered.
 * https://github.com/base/basenames/blob/1b5c1ad/src/L2/RegistrarController.sol#L488
 */
export function tokenIdToLabelHash(tokenId: bigint): LabelHash {
  return uint256ToHex32(tokenId);
}

/**
 * Get registrar managed name for `basenames` subregistry for selected ENS namespace.
 *
 * @param namespaceId
 * @returns registrar managed name
 * @throws an error when no registrar managed name could be returned
 */
export function getRegistrarManagedName(namespaceId: ENSNamespaceId): RegistrarManagedName {
  switch (namespaceId) {
    case "mainnet":
      return "base.eth";
    case "sepolia":
      return "basetest.eth";
    case "holesky":
    case "ens-test-env":
      throw new Error(
        `No registrar managed name is known for the 'basenames' subregistry within the "${namespaceId}" namespace.`,
      );
  }
}

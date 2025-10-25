import type { RegistrarManagedName } from "@/lib/types";
import type { ENSNamespaceId } from "@ensnode/datasources";
import { type LabelHash, uint256ToHex32 } from "@ensnode/ensnode-sdk";

/**
 * When direct subnames of linea.eth are registered through the linea.eth ETHRegistrarController
 * contract on Linea, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId represented as uint256(labelhash(label)) where label is the
 * direct subname of linea.eth that was registered.
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
  switch (namespaceId) {
    case "mainnet":
      return "linea.eth";
    case "sepolia":
      return "linea-sepolia.eth";
    case "holesky":
    case "ens-test-env":
      throw new Error(
        `No registrar managed name is known for the 'lineanames' subregistry within the "${namespaceId}" namespace.`,
      );
  }
}

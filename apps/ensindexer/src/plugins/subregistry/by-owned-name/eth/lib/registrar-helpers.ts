import type { RegistrarManagedName } from "@/lib/types";
import type { ENSNamespaceId } from "@ensnode/datasources";
import { type LabelHash, uint256ToHex32 } from "@ensnode/ensnode-sdk";

/**
 * When direct subnames of .eth are registered through the ETHRegistrarController contract on
 * Ethereum mainnet, an ERC721 NFT is minted that tokenizes ownership of the registration. The minted NFT
 * will be assigned a unique tokenId which is uint256(labelhash(label)) where label is the
 * direct subname of .eth that was registered.
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 */
export function tokenIdToLabelHash(tokenId: bigint): LabelHash {
  return uint256ToHex32(tokenId);
}

/**
 * Get registrar managed name for ENS subregistry for selected ENS namespace.
 *
 * @param namespaceId
 * @param pluginName
 * @returns registrar managed name
 * @throws an error when no registrar managed name could be returned
 */
export function getRegistrarManagedName(namespaceId: ENSNamespaceId): RegistrarManagedName {
  switch (namespaceId) {
    case "mainnet":
      return "eth";
    case "sepolia":
      return "eth";
    case "holesky":
      return "eth";
    case "ens-test-env":
      throw new Error(
        `No registrar managed name is known for the ENS subregistry within the "${namespaceId}" namespace.`,
      );
  }
}

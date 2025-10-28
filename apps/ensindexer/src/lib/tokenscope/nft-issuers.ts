import { type DatasourceName, DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";
import {
  type AccountId,
  accountIdEqual,
  BASENAMES_NODE,
  ETH_NODE,
  type LabelHash,
  LINEANAMES_NODE,
  makeSubdomainNode,
  type Node,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";

import { getDatasourceContract, maybeGetDatasourceContract } from "@/lib/datasource-helpers";
import {
  type AssetNamespace,
  AssetNamespaces,
  type SupportedNFT,
  type TokenId,
} from "@/lib/tokenscope/assets";

/**
 * A contract that issues tokenized ENS names in a manner that is supported by
 * TokenScope.
 */
export interface SupportedNFTIssuer {
  /**
   * The CAIP-19 Asset Namespace of all the NFTs minted by the SupportedNFTIssuer.
   */
  assetNamespace: AssetNamespace;

  /**
   * The AccountId of the SupportedNFTIssuer contract.
   *
   * To qualify as a SupportedNFTIssuer, if the assetNamespace is `erc1155` the
   * contract must never have a balance or amount > 1 for any tokenId.
   */
  contract: AccountId;

  /**
   * Applies the SupportedNFTIssuer contract's logic for converting from the token id
   * representation of a domain to the domain id (Node) representation of a domain.
   */
  getDomainId: (tokenId: TokenId) => Node;
}

/**
 * Converts the tokenId from an ENS name token-issuing contract to a Node
 * for the case that the contract generates each tokenId using namehash of
 * the full name.
 *
 * @param tokenId - The tokenId to convert
 * @returns The Node of the tokenId
 */
const nameHashGeneratedTokenIdToNode = (tokenId: TokenId): Node => {
  return uint256ToHex32(tokenId);
};

/**
 * Converts the tokenId from an ENS name token-issuing contract to a Node
 * for the case that the contract generates each tokenId using labelhash of
 * the direct subname of the parent node.
 *
 * @param tokenId - The tokenId to convert
 * @param parentNode - the parent Node that the token issuing contract issues subnames under
 * @returns The Node of the tokenId issued under the parentNode
 */
const labelHashGeneratedTokenIdToNode = (tokenId: TokenId, parentNode: Node): Node => {
  const labelHash: LabelHash = uint256ToHex32(tokenId);
  return makeSubdomainNode(labelHash, parentNode);
};

/**
 * Gets all the SupportedNFTIssuer for the specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns an array of 0 or more SupportedNFTIssuer for the specified namespace
 */
const getSupportedNFTIssuers = (namespaceId: ENSNamespaceId): SupportedNFTIssuer[] => {
  const ethBaseRegistrar = maybeGetDatasourceContract(
    namespaceId,
    DatasourceNames.ENSRoot,
    "BaseRegistrar",
  );
  const nameWrapper = maybeGetDatasourceContract(
    namespaceId,
    DatasourceNames.ENSRoot,
    "NameWrapper",
  );
  const threeDnsBaseRegistrar = maybeGetDatasourceContract(
    namespaceId,
    DatasourceNames.ThreeDNSBase,
    "ThreeDNSToken",
  );
  const threeDnsOptimismRegistrar = maybeGetDatasourceContract(
    namespaceId,
    DatasourceNames.ThreeDNSOptimism,
    "ThreeDNSToken",
  );
  const lineanamesRegistrar = maybeGetDatasourceContract(
    namespaceId,
    DatasourceNames.Lineanames,
    "BaseRegistrar",
  );
  const basenamesRegistrar = maybeGetDatasourceContract(
    namespaceId,
    DatasourceNames.Basenames,
    "BaseRegistrar",
  );

  const result: SupportedNFTIssuer[] = [];

  if (ethBaseRegistrar) {
    result.push({
      assetNamespace: AssetNamespaces.ERC721,
      contract: ethBaseRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, ETH_NODE);
      },
    });
  }

  if (nameWrapper) {
    result.push({
      assetNamespace: AssetNamespaces.ERC1155,
      contract: nameWrapper,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (threeDnsBaseRegistrar) {
    result.push({
      assetNamespace: AssetNamespaces.ERC1155,
      contract: threeDnsBaseRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (threeDnsOptimismRegistrar) {
    result.push({
      assetNamespace: AssetNamespaces.ERC1155,
      contract: threeDnsOptimismRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (lineanamesRegistrar) {
    result.push({
      assetNamespace: AssetNamespaces.ERC721,
      contract: lineanamesRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, LINEANAMES_NODE);
      },
    });
  }

  if (basenamesRegistrar) {
    result.push({
      assetNamespace: AssetNamespaces.ERC721,
      contract: basenamesRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, BASENAMES_NODE);
      },
    });
  }

  return result;
};

/**
 * Gets the SupportedNFTIssuer for the given contract in the specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *  'ens-test-env')
 * @param contract - The AccountId of the contract to get the SupportedNFTIssuer for
 * @returns the SupportedNFTIssuer for the given contract, or null
 *          if the contract is not a SupportedNFTIssuer in the specified namespace
 */
export const getSupportedNFTIssuer = (
  namespaceId: ENSNamespaceId,
  contract: AccountId,
): SupportedNFTIssuer | null => {
  const nftIssuers = getSupportedNFTIssuers(namespaceId);
  return nftIssuers.find((nftIssuer) => accountIdEqual(nftIssuer.contract, contract)) ?? null;
};

export const buildSupportedNFT = (
  namespaceId: ENSNamespaceId,
  datasourceName: DatasourceName,
  contractName: string,
  tokenId: TokenId,
): SupportedNFT => {
  const contract = getDatasourceContract(namespaceId, datasourceName, contractName);

  const nftIssuer = getSupportedNFTIssuer(namespaceId, contract);
  if (!nftIssuer) {
    throw new Error(
      `Error getting nftIssuer for contract name ${contractName} at address ${contract.address} on chainId ${contract.chainId} in datasource ${datasourceName} in namespace ${namespaceId}.`,
    );
  }
  const domainId = nftIssuer.getDomainId(tokenId);

  return {
    contract,
    tokenId,
    assetNamespace: nftIssuer.assetNamespace,
    domainId,
  };
};

import { maybeGetDatasourceContract } from "@/lib/datasource-helpers";
import { TokenId } from "@/lib/tokenscope/assets";
import { DatasourceNames, ENSNamespaceId } from "@ensnode/datasources";
import {
  AccountId,
  BASENAMES_NODE,
  ETH_NODE,
  LINEANAMES_NODE,
  LabelHash,
  type Node,
  accountIdEqual,
  makeSubdomainNode,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";

/**
 * A contract that issues tokenized ENS names.
 */
export interface TokenIssuer {
  /**
   * The AccountId of the token issuer contract.
   */
  contract: AccountId;

  /**
   * Applies the token issuer contract's logic for converting from the token id
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
export const nameHashGeneratedTokenIdToNode = (tokenId: TokenId): Node => {
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
export const labelHashGeneratedTokenIdToNode = (tokenId: TokenId, parentNode: Node): Node => {
  const labelHash: LabelHash = uint256ToHex32(tokenId);
  return makeSubdomainNode(labelHash, parentNode);
};

/**
 * Gets the contracts known to provide tokenized name ownership within the
 * specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns an array of 0 or more known TokenIssuer for the specified namespace
 */
const getKnownTokenIssuers = (namespaceId: ENSNamespaceId): TokenIssuer[] => {
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

  const result: TokenIssuer[] = [];

  if (ethBaseRegistrar) {
    result.push({
      contract: ethBaseRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, ETH_NODE);
      },
    });
  }

  if (nameWrapper) {
    result.push({
      contract: nameWrapper,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (threeDnsBaseRegistrar) {
    result.push({
      contract: threeDnsBaseRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (threeDnsOptimismRegistrar) {
    result.push({
      contract: threeDnsOptimismRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return nameHashGeneratedTokenIdToNode(tokenId);
      },
    });
  }

  if (lineanamesRegistrar) {
    result.push({
      contract: lineanamesRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, LINEANAMES_NODE);
      },
    });
  }

  if (basenamesRegistrar) {
    result.push({
      contract: basenamesRegistrar,
      getDomainId: (tokenId: TokenId): Node => {
        return labelHashGeneratedTokenIdToNode(tokenId, BASENAMES_NODE);
      },
    });
  }

  return result;
};

/**
 * Gets the known token issuer for the given contract in the specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *  'ens-test-env')
 * @param contract - The AccountId of the contract to get the known token issuer for
 * @returns the known token issuer for the given contract, or null
 *          if the contract is not a known token issuer in the specified namespace
 */
export const getKnownTokenIssuer = (
  namespaceId: ENSNamespaceId,
  contract: AccountId,
): TokenIssuer | null => {
  const tokenIssuers = getKnownTokenIssuers(namespaceId);
  return tokenIssuers.find((tokenIssuer) => accountIdEqual(tokenIssuer.contract, contract)) ?? null;
};

import { type ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";

/**
 * Default ENSNode API endpoint URL for Mainnet
 */
export const DEFAULT_ENSNODE_API_URL_MAINNET = "https://api.alpha.ensnode.io" as const;

/**
 * Default ENSNode API endpoint URL for Sepolia
 */
export const DEFAULT_ENSNODE_API_URL_SEPOLIA = "https://api.alpha-sepolia.ensnode.io" as const;

/**
 * Gets the default ENSNode URL for the provided ENSNamespaceId.
 *
 * @param namespace - The ENSNamespaceId to get the default ENSNode URL for
 * @returns The default ENSNode URL for the provided ENSNamespaceId
 * @throws If the provided ENSNamespaceId does not have a default ENSNode URL defined
 */
export const getDefaultEnsNodeUrl = (namespace: ENSNamespaceId): URL => {
  switch (namespace) {
    case ENSNamespaceIds.Mainnet:
      return new URL(DEFAULT_ENSNODE_API_URL_MAINNET);
    case ENSNamespaceIds.Sepolia:
      return new URL(DEFAULT_ENSNODE_API_URL_SEPOLIA);
    default:
      throw new Error(`ENSNamespaceId ${namespace} does not have a default ENSNode URL defined`);
  }
};

import { type ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";

/**
 * Default ENSNode URL for Mainnet
 */
export const DEFAULT_ENSNODE_URL_MAINNET = "https://api.alpha.ensnode.io" as const;

/**
 * Default ENSNode URL for Sepolia
 */
export const DEFAULT_ENSNODE_URL_SEPOLIA = "https://api.alpha-sepolia.ensnode.io" as const;

/**
 * Default ENSNode URL for Sepolia-V2
 */
export const DEFAULT_ENSNODE_URL_SEPOLIA_V2 = "https://api.v2-sepolia.ensnode.io" as const;

/**
 * Gets the default ENSNode URL for the provided ENSNamespaceId.
 *
 * @param namespace - Optional. The ENSNamespaceId to get the default ENSNode URL for. If not
 *                    provided, defaults to Mainnet.
 * @returns The default ENSNode URL for the provided ENSNamespaceId, or for Mainnet if no
 *          namespace is provided.
 * @throws If the provided ENSNamespaceId does not have a default ENSNode URL defined
 */
export const getDefaultEnsNodeUrl = (namespace?: ENSNamespaceId): URL => {
  const effectiveNamespace = namespace ?? ENSNamespaceIds.Mainnet;
  switch (effectiveNamespace) {
    case ENSNamespaceIds.Mainnet:
      return new URL(DEFAULT_ENSNODE_URL_MAINNET);
    case ENSNamespaceIds.Sepolia:
      return new URL(DEFAULT_ENSNODE_URL_SEPOLIA);
    case ENSNamespaceIds.SepoliaV2:
      return new URL(DEFAULT_ENSNODE_URL_SEPOLIA_V2);
    default:
      throw new Error(
        `ENSNamespaceId ${effectiveNamespace} does not have a default ENSNode URL defined`,
      );
  }
};

import { http } from "viem";
import { holesky, mainnet, sepolia } from "viem/chains";
import { createConfig } from "wagmi";

// Get RPC URLs from environment variables
const getRpcUrl = (chainId: number): string => {
  const envVar = `RPC_URL_${chainId}`;
  const url = process.env[envVar];

  if (!url) {
    console.warn(`No RPC URL found for chain ID ${chainId} (${envVar}). Using fallback.`);

    // Fallbacks for development - should be replaced with proper RPC URLs in production
    if (chainId === mainnet.id) return "https://eth.drpc.org";
    if (chainId === sepolia.id) return "https://sepolia.drpc.org";
    if (chainId === holesky.id) return "https://holesky.drpc.org";

    throw new Error(`No fallback RPC URL available for chain ID ${chainId}`);
  }

  return url;
};

// Create wagmi config with supported chains
export const config = createConfig({
  chains: [mainnet, sepolia, holesky],
  transports: {
    [mainnet.id]: http(getRpcUrl(mainnet.id)),
    [sepolia.id]: http(getRpcUrl(sepolia.id)),
    [holesky.id]: http(getRpcUrl(holesky.id)),
  },
});

/**
 * Supported chain ID for requested ENS Deployment Chain.
 */
export type SupportedEnsDeploymentChainId = (typeof config.chains)[number]["id"];
/**
 * Get the supported chain ID by chain name.
 * @param chainName
 * @returns chain ID or undefined if chain name could not be parsed
 */
export function parseEnsDeploymentChain(
  chainName: string,
): SupportedEnsDeploymentChainId | undefined {
  switch (chainName.toLowerCase()) {
    case "mainnet":
      return mainnet.id;
    case "sepolia":
      return sepolia.id;
    case "holesky":
      return holesky.id;
    default:
      return undefined;
  }
}

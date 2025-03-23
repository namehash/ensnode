import { ENSDeploymentChain } from "@ensnode/ens-deployments";
import { http } from "viem";
import { anvil, holesky, mainnet, sepolia } from "viem/chains";
import { createConfig } from "wagmi";
import { parseEnsDeploymentChainIntoChainId } from "./chains";

// Get RPC URLs from environment variables
const getRpcUrl = (ensDeploymentChain: ENSDeploymentChain): string => {
  const chainId = parseEnsDeploymentChainIntoChainId(ensDeploymentChain);
  const envVar = `RPC_URL_${chainId}`;
  const url = process.env[envVar];

  if (!url) {
    console.warn(`No RPC URL found for chain ID ${chainId} (${envVar}). Using fallback.`);

    // Fallbacks for development - should be replaced with proper RPC URLs in production
    switch (ensDeploymentChain) {
      case "mainnet":
        return "https://eth.drpc.org";
      case "sepolia":
        return "https://sepolia.drpc.org";
      case "holesky":
        return "https://holesky.drpc.org";
      case "ens-test-env":
        return anvil.rpcUrls.default.http["0"];
    }
  }

  return url;
};

// Create wagmi config with supported chains
export const config = createConfig({
  chains: [mainnet, sepolia, holesky],
  transports: {
    [mainnet.id]: http(getRpcUrl("mainnet")),
    [sepolia.id]: http(getRpcUrl("sepolia")),
    [holesky.id]: http(getRpcUrl("holesky")),
    [anvil.id]: http(getRpcUrl("ens-test-env")),
  },
});

import { ENSDeploymentChain } from "@ensnode/ens-deployments";
import { http } from "viem";
import { anvil, holesky, mainnet, sepolia } from "viem/chains";
import { createConfig } from "wagmi";
import { parseUrl } from "./env";

/**
 * Get RPC URLs from environment variables for a requested ENS deployment chain.
 * NOTE: Environment variables have to be read using direct `process.env` access
 * because otherwise Next.js will not expose them to the client.
 *
 * @param chain ENS deployment chain
 * @returns RPC URL
 */
function getEnsDeploymentRpcUrl(chain: ENSDeploymentChain): URL {
  let envVarName: string;
  let envVarValue: string | undefined;

  switch (chain) {
    case "mainnet":
      envVarName = `NEXT_PUBLIC_RPC_URL_1`;
      envVarValue = process.env.NEXT_PUBLIC_RPC_URL_1;
      break;
    case "sepolia":
      envVarName = `NEXT_PUBLIC_RPC_URL_11155111`;
      envVarValue = process.env.NEXT_PUBLIC_RPC_URL_11155111;
      break;
    case "holesky":
      envVarName = `NEXT_PUBLIC_RPC_URL_17000`;
      envVarValue = process.env.NEXT_PUBLIC_RPC_URL_17000;
      break;
    case "ens-test-env":
      envVarName = `NEXT_PUBLIC_RPC_URL_31337`;
      envVarValue = process.env.NEXT_PUBLIC_RPC_URL_31337;
      break;
    default:
      throw new Error(`Unsupported ENS deployment chain: ${chain}`);
  }

  if (!envVarValue) {
    throw new Error(`No RPC URL was set for ENS deployment chain ${chain} (${envVarName}).`);
  }

  try {
    return parseUrl(envVarValue);
  } catch (error) {
    throw new Error(`Invalid ${envVarName} value "${envVarValue}". It should be a valid URL.`);
  }
}

// Create wagmi config with supported chains
export const config = createConfig({
  chains: [mainnet, sepolia, holesky, anvil],
  transports: {
    [mainnet.id]: http(getEnsDeploymentRpcUrl("mainnet").toString()),
    [sepolia.id]: http(getEnsDeploymentRpcUrl("sepolia").toString()),
    [holesky.id]: http(getEnsDeploymentRpcUrl("holesky").toString()),
    [anvil.id]: http(getEnsDeploymentRpcUrl("ens-test-env").toString()),
  },
});

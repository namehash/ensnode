import { http } from "viem";
import { anvil, holesky, mainnet, sepolia } from "viem/chains";
import { createConfig } from "wagmi";
import { parseUrl } from "./env";
import {ENSNamespaceId, ENSNamespaceIds} from "@ensnode/datasources";

/**
 * Get RPC URLs from environment variables for a requested ENS namespace.
 * NOTE: Environment variables have to be read using direct `process.env` access
 * because otherwise Next.js will not expose them to the client.
 *
 * @param namespaceId ENS namespace
 * @returns RPC URL
 */
function getEnsDeploymentRpcUrl(namespaceId: ENSNamespaceId): URL {
  let envVarName: string;
  let envVarValue: string | undefined;

  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      envVarName = `NEXT_PUBLIC_RPC_URL_1`; //TODO: Won't these changes break anything?
      envVarValue = process.env.NEXT_PUBLIC_RPC_URL_1;
      break;
    case ENSNamespaceIds.Sepolia:
      envVarName = `NEXT_PUBLIC_RPC_URL_11155111`;
      envVarValue = process.env.NEXT_PUBLIC_RPC_URL_11155111;
      break;
    case ENSNamespaceIds.Holesky:
      envVarName = `NEXT_PUBLIC_RPC_URL_17000`;
      envVarValue = process.env.NEXT_PUBLIC_RPC_URL_17000;
      break;
    case ENSNamespaceIds.EnsTestEnv:
      envVarName = `NEXT_PUBLIC_RPC_URL_31337`;
      envVarValue = process.env.NEXT_PUBLIC_RPC_URL_31337;
      break;
    default:
      throw new Error(`Unsupported ENS namespace: ${namespaceId}`);
  }

  if (!envVarValue) {
    throw new Error(`No RPC URL was set for ENS namespace ${namespaceId} (${envVarName}).`);
  }

  try {
    return parseUrl(envVarValue);
  } catch (error) {
    throw new Error(`Invalid ${envVarName} value "${envVarValue}". It should be a valid URL.`);
  }
}

// Create wagmi config with supported namespaces

//TODO: check with @tko what he meant in his PR comment there ("Try applying ens-deployments package config:")
// -> basically to do what tko proposed in the PR comment, to use chains declared in ensnode/datasources package and not directly from viem (that would make a nicer dependency)
export const config = createConfig({
  chains: [mainnet, sepolia, holesky, anvil],
  transports: {
    [mainnet.id]: http(getEnsDeploymentRpcUrl(ENSNamespaceIds.Mainnet).toString()),
    [sepolia.id]: http(getEnsDeploymentRpcUrl(ENSNamespaceIds.Sepolia).toString()),
    [holesky.id]: http(getEnsDeploymentRpcUrl(ENSNamespaceIds.Holesky).toString()),
    [anvil.id]: http(getEnsDeploymentRpcUrl(ENSNamespaceIds.EnsTestEnv).toString()),
  },
});

/**
 * Supported chain ID type.
 */
export type SupportedChainId = (typeof config.chains)[number]["id"];
/**
 * Get the supported chain ID by chain name.
 * @param name
 * @returns
 */

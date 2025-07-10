import { ENSNamespaceId, ENSNamespaceIds, getENSRootChain } from "@ensnode/datasources";
import { CreateConfigParameters } from "@wagmi/core";
import { http } from "viem";
import { parseUrl } from "./env";

/**
 * Get RPC URLs from environment variables for a requested ENS namespace.
 *
 * NOTE: Environment variables have to be read using direct `process.env` access
 * because otherwise Next.js will not expose them to the client.
 *
 * @param namespaceId ENS namespace
 * @returns RPC URL for the requested ENS namespace.
 * @throws an error if the environment variable for the requested RPC URL is not defined
 * or is not a valid URL
 */
function getEnsNamespaceRpcUrl(namespaceId: ENSNamespaceId): URL {
  let envVarName: string;
  let envVarValue: string | undefined;

  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      envVarName = `NEXT_PUBLIC_RPC_URL_1`;
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
      envVarName = `NEXT_PUBLIC_RPC_URL_1337`;
      envVarValue = process.env.NEXT_PUBLIC_RPC_URL_1337;
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

/**
 * Returns valid parameters for the wagmi config object
 *
 * @throws an error if no valid RPC URL was provided in env vars
 */
export const wagmiConfigParametersForEnsNamespace = (
  namespaceId: ENSNamespaceId,
): CreateConfigParameters => {
  const rootDatasourceChain = getENSRootChain(namespaceId);
  const chainRpcUrl = getEnsNamespaceRpcUrl(namespaceId);

  return {
    chains: [rootDatasourceChain],
    transports: {
      [rootDatasourceChain.id]: http(chainRpcUrl.toString()),
    },
  };
};

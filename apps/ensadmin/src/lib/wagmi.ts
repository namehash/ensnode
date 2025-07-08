import {
  DatasourceNames,
  ENSNamespaceId,
  ENSNamespaceIds,
  getDatasource,
} from "@ensnode/datasources";
import { http, Chain, Transport } from "viem";
import { parseUrl } from "./env";

/**
 * Get RPC URLs from environment variables for a requested ENS namespace.
 *
 * NOTE: Environment variables have to be read using direct `process.env` access
 * because otherwise Next.js will not expose them to the client.
 *
 * @param namespaceId ENS namespace
 * @returns RPC URL, or throws an error if an RPC URL is not defined as an env variable,
 * or its URL is invalid
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

// Create wagmi config with supported namespaces
export type WagmiConfigForEnsNamespaces = {
  readonly chains: [Chain, ...Chain[]];
  readonly transports: Record<Chain["id"], Transport>;
};

/**
 * Returns a valid input for a wagmi config object
 */
export const wagmiConfigForEnsNamespace = (namespaceId: ENSNamespaceId) => {
  const rootDatasourceChain = getDatasource(namespaceId, DatasourceNames.ENSRoot).chain;

  // `getEnsNamespaceRpcUrl` call would throw an error if no valid RPC URL was provided i.e. in env vars
  const chainRpcUrl = getEnsNamespaceRpcUrl(namespaceId);

  return {
    chains: [rootDatasourceChain],
    transports: {
      [rootDatasourceChain.id]: http(chainRpcUrl.toString()),
    },
  } satisfies WagmiConfigForEnsNamespaces;
};

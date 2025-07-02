import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { SupportedChainId, parseSupportedChainIdByName } from "@/lib/wagmi";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { EnsNode } from "./types";

/**
 * Fetches the ENSNode status.
 *
 * @param baseUrl ENSNode URL
 * @returns Information about the ENSNode runtime, environment, dependencies, and more.
 */
async function fetchEnsNodeStatus(baseUrl: URL): Promise<EnsNode.Metadata> {
  const response = await fetch(new URL(`/metadata`, baseUrl), {
    headers: {
      "content-type": "application/json",
      "x-ensadmin-version": await ensAdminVersion(),
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch ENSNode status", response);
    throw new Error("Failed to fetch ENSNode status");
  }

  return response.json();
}

type UseIndexingStatusQueryResult = UseQueryResult<EnsNode.Metadata, Error>;

/**
 * Hook to fetch the indexing status of the ENS node.
 * @param searchParams The URL search params including the selected ENS node URL.
 * @returns React Query hook result.
 */
export function useIndexingStatusQuery(
  searchParams: URLSearchParams,
): UseIndexingStatusQueryResult {
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);

  return useQuery({
    queryKey: ["indexing-status", ensNodeUrl],
    queryFn: () => fetchEnsNodeStatus(ensNodeUrl),
    select(data) {
      validateResponse(data);

      return data;
    },
    throwOnError(error) {
      throw new Error(`Could not fetch ENSNode data from '${ensNodeUrl}'. Cause: ${error.message}`);
    },
  });
}

/**
 * Checks if the response has the expected structure.
 * @param response
 * @throws Error if the response is invalid
 */
function validateResponse(response: EnsNode.Metadata) {
  const { chainIndexingStatuses } = response.runtime;

  if (typeof chainIndexingStatuses === "undefined") {
    throw new Error(`Chain indexing status not found in the response.`);
  }

  if (Object.keys(chainIndexingStatuses).length === 0) {
    throw new Error(`No chain indexing status found response.`);
  }

  const chainsWithoutFirstBlockToIndex = Object.entries(chainIndexingStatuses).filter(
    ([, chain]) => chain.firstBlockToIndex === null,
  );

  if (chainsWithoutFirstBlockToIndex.length > 0) {
    throw new Error(
      `Missing first block to index for some chains with the following chain IDs: ${chainsWithoutFirstBlockToIndex
        .map(([chainId]) => chainId)
        .join(", ")}`,
    );
  }
}

/**
 * Gets chainId of the ENS root Datasource
 *
 * @param indexingStatus The ENSNode indexing status.
 * @returns The chain ID or undefined if the status is not available.
 * @throws Error if the chain ID is not supported within the configured namespace
 */
export function useENSRootDatasourceChainId(
  indexingStatus: UseIndexingStatusQueryResult["data"],
): SupportedChainId | undefined {
  if (!indexingStatus) return undefined;
  // TODO: this should use the namespace's ensroot datasource's chain ID, not the namespace identifier itself
  return parseSupportedChainIdByName(indexingStatus.env.NAMESPACE);
}

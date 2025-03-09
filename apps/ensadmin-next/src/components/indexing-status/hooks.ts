import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import type { MetadataMiddlewareResponse } from "@ensnode/ponder-metadata";
import { useQuery } from "@tanstack/react-query";

// TODO: make `EnsNodeMetadata` interface to extend from
// `MetadataMiddlewareResponse` of ENSNode SDK package (once it's available)
// as it will include precise types for currently unknown-type fields (i.e. `env.ENS_DEPLOYMENT_CHAIN`)
/**
 * The status of the ENS node.
 */
export interface EnsNodeMetadata extends MetadataMiddlewareResponse {}

/**
 * Fetches the ENSNode status.
 *
 * @param baseUrl ENSNode URL
 * @returns Information about the ENSNode runtime, environment, dependencies, and more.
 */
async function fetchEnsNodeStatus(baseUrl: string): Promise<EnsNodeMetadata> {
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

/**
 * Hook to fetch the indexing status of the ENS node.
 * @param searchParams The URL search params including the selected ENS node URL.
 * @returns React Query hook result.
 */
export function useIndexingStatus(searchParams: URLSearchParams) {
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);

  return useQuery({
    queryKey: ["indexing-status", ensNodeUrl],
    queryFn: () => fetchEnsNodeStatus(ensNodeUrl),
    select(data) {
      validateResponse(data);

      return data;
    },
    throwOnError(error) {
      throw new Error(`ENSNode request error at '${ensNodeUrl}'. Cause: ${error.message}`);
    },
  });
}

/**
 * Checks if the response has the expected structure.
 * @param response
 * @throws Error if the response is invalid
 */
function validateResponse(response: EnsNodeMetadata) {
  const { networkIndexingStatusByChainId } = response.runtime;

  if (typeof networkIndexingStatusByChainId === "undefined") {
    throw new Error(`Network indexing status not found in the response.`);
  }

  if (Object.keys(networkIndexingStatusByChainId).length === 0) {
    throw new Error(`No network indexing status found response.`);
  }

  const networksWithoutFirstBlockToIndex = Object.entries(networkIndexingStatusByChainId).filter(
    ([, network]) => network.firstBlockToIndex === null,
  );

  if (networksWithoutFirstBlockToIndex.length > 0) {
    throw new Error(
      `Missing first block to index for some networks with the following chain IDs: ${networksWithoutFirstBlockToIndex
        .map(([chainId]) => chainId)
        .join(", ")}`,
    );
  }
}

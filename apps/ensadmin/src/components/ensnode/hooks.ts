import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { SupportedChainId, parseSupportedChainIdByName } from "@/lib/wagmi";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { ENSNodeError } from "./errors";
import type { EnsNode } from "./types";

/**
 * Fetches the ENSNode status.
 *
 * @param baseUrl ENSNode URL
 * @returns Information about the ENSNode runtime, environment, dependencies, and more.
 */
async function fetchEnsNodeStatus(baseUrl: URL): Promise<EnsNode.Metadata> {
  let response;

  try {
    response = await fetch(new URL(`/metadata`, baseUrl), {
      headers: {
        "content-type": "application/json",
        "x-ensadmin-version": await ensAdminVersion(),
      },
    });
  } catch (error) {
    throw ENSNodeError.ensNodeConnectionError(
      `Network error; ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  if (!response.ok) {
    throw ENSNodeError.ensNodeConnectionError(`Server error; ${response.statusText}`);
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
  });
}

/**
 * Checks if the response has the expected structure.
 * @param response
 * @throws Error if the response is invalid
 */
function validateResponse(response: EnsNode.Metadata) {
  const { networkIndexingStatusByChainId } = response.runtime;

  if (typeof networkIndexingStatusByChainId === "undefined") {
    throw ENSNodeError.ensNodeResponseValidationError(
      `Network indexing status not found in the response.`,
    );
  }

  if (Object.keys(networkIndexingStatusByChainId).length === 0) {
    throw ENSNodeError.ensNodeResponseValidationError(`No network indexing status found response.`);
  }

  const networksWithoutFirstBlockToIndex = Object.entries(networkIndexingStatusByChainId).filter(
    ([, network]) => network.firstBlockToIndex === null,
  );

  if (networksWithoutFirstBlockToIndex.length > 0) {
    throw ENSNodeError.ensNodeResponseValidationError(
      `Missing first block to index for some networks with the following chain IDs: ${networksWithoutFirstBlockToIndex
        .map(([chainId]) => chainId)
        .join(", ")}`,
    );
  }

  const networksWithoutLastIndexedBlock = Object.entries(networkIndexingStatusByChainId).filter(
    ([, network]) => network.lastIndexedBlock === null,
  );

  if (networksWithoutLastIndexedBlock.length > 0) {
    throw ENSNodeError.ensNodeResponseValidationError(
      `Missing last indexed block for some networks with the following chain IDs: ${networksWithoutLastIndexedBlock
        .map(([chainId]) => chainId)
        .join(", ")}`,
    );
  }
}

/**
 * Selects the indexed chain ID from the indexing status.
 *
 * @param indexingStatus The ENSNode indexing status.
 * @returns The indexed chain ID or null if the status is not available.
 * @throws Error if the ENS Deployment Chain is not a supported chain.
 */
export function useIndexedChainId(
  indexingStatus: UseIndexingStatusQueryResult["data"],
): SupportedChainId | undefined {
  // If the status is not available, return undefined
  if (!indexingStatus) {
    return undefined;
  }

  return parseSupportedChainIdByName(indexingStatus.env.ENS_DEPLOYMENT_CHAIN);
}

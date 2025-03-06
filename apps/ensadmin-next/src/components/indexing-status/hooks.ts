import { selectedEnsNodeUrl } from "@/lib/env";
import type { PonderMetadataMiddlewareResponse } from "@ensnode/ponder-metadata";
import { useQuery } from "@tanstack/react-query";

/**
 * The status of the ENS node.
 */
export interface EnsNodeMetadata extends PonderMetadataMiddlewareResponse {}

async function fetchEnsNodeStatus(baseUrl: string): Promise<EnsNodeMetadata> {
  const response = await fetch(new URL(`/metadata`, baseUrl));

  if (!response.ok) {
    throw new Error("Failed to fetch indexing status");
  }

  return response.json();
}

export function useIndexingStatus(searchParams: URLSearchParams) {
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

function validateResponse(response: EnsNodeMetadata) {
  const logPrefix = `[${response.app.name}@${response.app.version}]:`;
  const { networkIndexingStatusByChainId } = response.runtime;

  if (typeof networkIndexingStatusByChainId === "undefined") {
    throw new Error(`${logPrefix} Network indexing status not found`);
  }

  if (Object.keys(networkIndexingStatusByChainId).length === 0) {
    throw new Error(`${logPrefix} No network indexing status found`);
  }

  if (Object.values(networkIndexingStatusByChainId).some((n) => n.firstBlockToIndex === null)) {
    throw new Error(`${logPrefix} Failed to fetch first block to index for some networks`);
  }
}

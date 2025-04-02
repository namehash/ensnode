import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { type SupportedEnsDeploymentChainId, parseEnsDeploymentChain } from "@/lib/wagmi";
import DeploymentConfigs, {
  type SubregistryDeploymentConfig,
  type SubregistryName,
} from "@ensnode/ens-deployments";
import { BlockInfo, NetworkIndexingStatus } from "@ensnode/ponder-metadata";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
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
      throw new Error(`ENSNode request error at '${ensNodeUrl}'. Cause: ${error.message}`);
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

/**
 * Selects the chain ID of selected ENS Deployment Chain from the indexing status.
 *
 * @param indexingStatus The ENSNode indexing status.
 * @returns The indexed chain ID or null if the status is not available.
 */
export function useEnsDeploymentChain(
  indexingStatus: UseIndexingStatusQueryResult["data"],
): SupportedEnsDeploymentChainId | undefined {
  // If the status is not available, return undefined
  if (!indexingStatus) {
    return undefined;
  }

  return parseEnsDeploymentChain(indexingStatus.env.ENS_DEPLOYMENT_CHAIN);
}

/**
 * Hook to get ENS Subregistry configuration extracted from ENSNode metadata by its name.
 *
 * @param ensNodeMetadata
 * @param subregistryName
 * @returns
 */
export function useEnsSubregistryConfig(
  ensNodeMetadata: EnsNode.Metadata | undefined,
  subregistryName: SubregistryName = "eth",
): SubregistryDeploymentConfig | undefined {
  if (!ensNodeMetadata) {
    return undefined;
  }

  const ensDeploymentChain = ensNodeMetadata.env.ENS_DEPLOYMENT_CHAIN;

  return ensDeploymentChain === "mainnet"
    ? DeploymentConfigs[ensDeploymentChain][subregistryName]
    : DeploymentConfigs[ensDeploymentChain]["eth"];
}

interface UseBlockInfoProps {
  chainId: number | undefined;
  blockNumber: number | undefined;
}

/**
 * Hook to fetch the block info from network.
 *
 * @returns {BlockInfo|undefined} block info or undefined if ENSMetadata is not available yet
 */
export function useBlockInfo({ blockNumber, chainId }: UseBlockInfoProps): BlockInfo | undefined {
  const publicClient = usePublicClient({
    chainId,
  });
  const [blockInfo, setBlockInfo] = useState<BlockInfo | undefined>();

  useEffect(() => {
    if (!blockNumber || !publicClient) {
      setBlockInfo(undefined);

      return;
    }

    publicClient.getBlock({ blockNumber: BigInt(blockNumber) }).then((block) =>
      setBlockInfo(
        () =>
          ({
            number: Number(block.number),
            timestamp: Number(block.timestamp),
          }) satisfies BlockInfo,
      ),
    );
  }, [blockNumber, publicClient]);

  return blockInfo;
}

interface UseIndexedNetworkBlockProps {
  blockName: keyof NetworkIndexingStatus;
  chainId: number | undefined;
  ensNodeMetadata: EnsNode.Metadata | undefined;
}

export function useIndexedNetworkBlock({
  blockName,
  chainId,
  ensNodeMetadata,
}: UseIndexedNetworkBlockProps): BlockInfo | undefined {
  if (!ensNodeMetadata) {
    return undefined;
  }

  if (!chainId) {
    return undefined;
  }

  const networkIndexingStatus = ensNodeMetadata.runtime.networkIndexingStatusByChainId[chainId];

  if (!networkIndexingStatus) {
    throw new Error(`Could not find network indexing status for '${chainId}' chain ID`);
  }

  if (!networkIndexingStatus[blockName]) {
    throw new Error(
      `Could not find network indexing status for '${chainId}' chain ID and '${blockName}' block name`,
    );
  }

  return networkIndexingStatus[blockName];
}

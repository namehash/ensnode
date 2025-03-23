import { parseEnsDeploymentChainIntoChainId } from "@/lib/chains";
import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import DeploymentConfigs, {
  type SubregistryDeploymentConfig,
  type SubregistryName,
} from "@ensnode/ens-deployments";
import { BlockInfo, NetworkIndexingStatus } from "@ensnode/ponder-metadata";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { EnsNode } from "./types";

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
    queryKey: ["ensnode", ensNodeUrl, "metadata"],
    queryFn: () => fetchEnsNodeStatus(ensNodeUrl),
    select(data) {
      validateEnsNodeStatusResponse(data);

      return data;
    },
  });
}

/**
 * Selects the chain ID of selected ENS Deployment Chain from the indexing status.
 *
 * @param indexingStatus The ENSNode indexing status.
 * @returns The indexed chain ID or null if the status is not available.
 */
export function useEnsDeploymentChain(
  indexingStatus: UseIndexingStatusQueryResult["data"],
): UseQueryResult<number, Error> {
  return useQuery({
    enabled: Boolean(indexingStatus),
    queryKey: ["ensnode", indexingStatus],
    async queryFn() {
      if (!indexingStatus) {
        throw new Error("Cannot select ENS Deployment Chain, indexing status is missing");
      }

      return parseEnsDeploymentChainIntoChainId(indexingStatus.env.ENS_DEPLOYMENT_CHAIN);
    },
  });
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
): UseQueryResult<SubregistryDeploymentConfig, Error> {
  return useQuery({
    enabled: Boolean(ensNodeMetadata),
    queryKey: ["ensnode", ensNodeMetadata, subregistryName],
    async queryFn() {
      if (!ensNodeMetadata) {
        throw new Error("Cannot select ENS Subregistry Config, ensNodeMetadata is missing");
      }

      const ensDeploymentChain = ensNodeMetadata.env.ENS_DEPLOYMENT_CHAIN;

      return ensDeploymentChain === "mainnet"
        ? DeploymentConfigs[ensDeploymentChain][subregistryName]
        : DeploymentConfigs[ensDeploymentChain]["eth"];
    },
  });
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
export function useBlockInfo({
  blockNumber,
  chainId,
}: UseBlockInfoProps): UseQueryResult<BlockInfo, Error> {
  const publicClient = usePublicClient({
    chainId,
  });

  return useQuery({
    enabled: Boolean(publicClient) && typeof blockNumber === "number",
    queryKey: ["ensnode", "block", chainId, blockNumber],
    async queryFn() {
      if (!publicClient) {
        throw new Error("Cannot query block info with unavailable public client");
      }

      if (typeof blockNumber === "undefined") {
        throw new Error("Cannot query public client with no block number provided");
      }

      if (blockNumber < 0) {
        throw new Error("Cannot query public client with negative block number");
      }

      return publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
    },
    select(block) {
      return {
        number: Number(block.number),
        timestamp: Number(block.timestamp),
      } satisfies BlockInfo;
    },
  });
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
}: UseIndexedNetworkBlockProps): UseQueryResult<BlockInfo, Error> {
  return useQuery({
    enabled: Boolean(ensNodeMetadata && chainId),
    queryKey: ["ensnode", "metadata", chainId, blockName],
    async queryFn() {
      if (!ensNodeMetadata) {
        throw new Error("Cannot query network block, ensNodeMetadata is missing");
      }

      if (!chainId) {
        throw new Error("Cannot query network block, chainId is missing");
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
    },
  });
}

/**
 * Fetches the ENSNode status.
 *
 * @param baseUrl ENSNode URL
 * @returns Information about the ENSNode runtime, environment, dependencies, and more.
 */
async function fetchEnsNodeStatus(baseUrl: string): Promise<EnsNode.Metadata> {
  const response = await fetch(new URL(`/metadata`, baseUrl), {
    headers: {
      "content-type": "application/json",
      "x-ensadmin-version": await ensAdminVersion(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch ENSNode status");
  }

  return response.json();
}

/**
 * Checks if the response has the expected structure.
 * @param response
 * @throws Error if the response is invalid
 */
function validateEnsNodeStatusResponse(response: EnsNode.Metadata) {
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

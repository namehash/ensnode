import type { BlockInfo } from "@ensnode/ponder-metadata";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { ensNodeMetadataQueryOptions } from "./metadata-query";
import type { EnsNode } from "./types";

type UseIndexingStatusQueryResult = UseQueryResult<EnsNode.Metadata, Error>;

/**
 * Hook to fetch the indexing status of the ENS node.
 * @param {URL} ensNodeUrl the selected ENS node URL.
 * @returns React Query hook result.
 */
export function useIndexingStatusQuery(ensNodeUrl: URL): UseIndexingStatusQueryResult {
  return useQuery(ensNodeMetadataQueryOptions(ensNodeUrl));
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

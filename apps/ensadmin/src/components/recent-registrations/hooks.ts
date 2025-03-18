import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { BlockInfo } from "@ensnode/ponder-metadata";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { DeploymentConfigs, type EnsNode, type SubregistryName } from "../ensnode";
import { BlockInfoViewModel, blockViewModel } from "../indexing-status/view-models";
import { RecentRegistrationsResponse } from "./types";

/**
 * Fetches info about the 5 most recently registered .eth domains that have been indexed.
 *
 * @param baseUrl ENSNode URL
 * @returns Info about the 5 most recently registered .eth domains that have been indexed.
 */
async function fetchRecentRegistrations(baseUrl: string): Promise<RecentRegistrationsResponse> {
  const query = `
    query RecentRegistrationsQuery {
      registrations(first: 5, orderBy: registrationDate, orderDirection: desc) {
        registrationDate
        expiryDate
        domain {
          id
          name
          labelName
          createdAt
          expiryDate
          owner {
            id
          }
          wrappedOwner {
            id
          }
        }
      }
    }
  `;

  const response = await fetch(new URL(`/subgraph`, baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ensadmin-version": await ensAdminVersion(),
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    console.error("Failed to fetch recent registrations", response);
    throw new Error("Failed to fetch recent registrations");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch info about the 5 most recently registered .eth domains that have been indexed.
 * @param searchParams The URL search params including the selected ENSNode URL.
 * @returns React Query hook result.
 */
export function useRecentRegistrations(searchParams: URLSearchParams) {
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);

  return useQuery({
    queryKey: ["recent-registrations", ensNodeUrl],
    queryFn: () => fetchRecentRegistrations(ensNodeUrl),
    throwOnError(error) {
      throw new Error(`ENSNode request error at '${ensNodeUrl}'. Cause: ${error.message}`);
    },
  });
}

/**
 * Hook to fetch the start block for Registrations.
 *
 * @param searchParams The URL search params including the selected ENSNode URL
 * @param subregistryName By default `eth` but might be pointing to other subregistries that follow ENSIndexer plugin names
 * @returns {BlockInfo|undefined} block info or undefined if ENSMetadata is not available yet
 */
export function useRegistrationsStartBlock(
  ensNodeMetadata: EnsNode.Metadata | undefined,
  subregistryName: SubregistryName = "eth",
): BlockInfoViewModel | undefined {
  const publicClient = usePublicClient();
  const [blockInfo, setBlockInfo] = useState<BlockInfoViewModel | undefined>();

  useEffect(() => {
    if (!ensNodeMetadata || !publicClient) {
      setBlockInfo(undefined);

      return;
    }

    const ensDeploymentChain = ensNodeMetadata.env.ENS_DEPLOYMENT_CHAIN;

    const ensSubregistryConfig =
      ensDeploymentChain === "mainnet"
        ? DeploymentConfigs[ensDeploymentChain][subregistryName]
        : DeploymentConfigs[ensDeploymentChain]["eth"];

    publicClient
      .getBlock({
        blockNumber: BigInt(ensSubregistryConfig.contracts.BaseRegistrar.startBlock),
      })
      .then((block) =>
        setBlockInfo(() =>
          blockViewModel({
            number: Number(block.number),
            timestamp: Number(block.timestamp),
          } satisfies BlockInfo),
        ),
      );
  }, [ensNodeMetadata, subregistryName, publicClient]);

  return blockInfo;
}

import packageJson from "@/../package.json";

import type { ReadonlyDrizzle } from "ponder";
import type { PublicClient } from "viem";

import config from "@/config/app-config";
import {
  createEnsRainbowVersionFetcher,
  createFirstBlockToIndexByChainIdFetcher,
  createPrometheusMetricsFetcher,
  getEnsDeploymentChainId,
} from "@/lib/ponder-helpers";
import { PrometheusMetrics, queryPonderMeta, queryPonderStatus } from "@ensnode/ponder-metadata";
import type { PonderMetadataProvider } from "@ensnode/ponder-subgraph";

// setup block indexing status fetching
export const fetchFirstBlockToIndexByChainId = createFirstBlockToIndexByChainIdFetcher(
  import("@/../ponder.config").then((m) => m.default),
);

// setup ENSRainbow version fetching
export const fetchEnsRainbowVersion = createEnsRainbowVersionFetcher();

// setup prometheus metrics fetching
export const fetchPrometheusMetrics = createPrometheusMetricsFetcher(config.port);

export const makePonderMetdataProvider = ({
  db,
  publicClients,
}: {
  db: ReadonlyDrizzle<Record<string, unknown>>;
  publicClients: Record<string, PublicClient>;
}): PonderMetadataProvider => {
  // get the chain ID for the ENS deployment
  const ensDeploymentChainId = getEnsDeploymentChainId();
  const availableNetworkNames = Object.keys(publicClients);

  if (availableNetworkNames.length === 0) {
    throw new Error(`Invariant: no available publicClients for constructing ponder metadata.`);
  }

  // use the deployment chain's publicClient if available, otherwise warn and use first found
  let publicClient = publicClients[ensDeploymentChainId];
  if (!publicClient) {
    const networkId = availableNetworkNames[0]!; // length check done above
    console.warn(
      `No public client available for chain '${ensDeploymentChainId}', using status of chain '${networkId}' to power 'Query._meta'.`,
    );
    publicClient = publicClients[networkId]!; // must exist
  }

  /**
   * Get the last block indexed by Ponder.
   *
   * @returns the block info fetched from the public client
   */
  const getLastIndexedDeploymentChainBlock = async () => {
    const ponderStatus = await queryPonderStatus(config.ponderDatabaseSchema, db);
    const chainStatus = ponderStatus.find(
      (status) => status.network_name === ensDeploymentChainId.toString(),
    );

    if (!chainStatus || !chainStatus.block_number) {
      throw new Error(
        `Could not find latest indexed block number for chain ID: ${ensDeploymentChainId}`,
      );
    }

    return publicClient.getBlock({
      blockNumber: BigInt(chainStatus.block_number),
    });
  };

  /**
   * Get the Ponder build ID
   * @returns The Ponder build ID
   */
  const getPonderBuildId = async (): Promise<string> => {
    const meta = await queryPonderMeta(config.ponderDatabaseSchema, db);

    return meta.build_id;
  };

  /**
   * Check if there are any indexing errors logged in the prometheus metrics
   * @returns true if there are no indexing errors, false otherwise
   */
  const hasIndexingErrors = async () => {
    const metrics = PrometheusMetrics.parse(await fetchPrometheusMetrics());
    return metrics.getValue("ponder_indexing_has_error") === 1;
  };

  return {
    version: packageJson.version,
    getLastIndexedDeploymentChainBlock,
    getPonderBuildId,
    hasIndexingErrors,
  };
};

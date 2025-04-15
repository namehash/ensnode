import packageJson from "@/../package.json";

import { db, publicClients } from "ponder:api";
import type { PublicClient } from "viem";

import {
  createEnsRainbowVersionFetcher,
  createFirstBlockToIndexByChainIdFetcher,
  createPrometheusMetricsFetcher,
  getEnsDeploymentChainId,
  ponderDatabaseSchema,
  ponderPort,
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
export const fetchPrometheusMetrics = createPrometheusMetricsFetcher(ponderPort());

export const makePonderMetdataProvider = (): PonderMetadataProvider => {
  // get the chain ID for the ENS deployment
  const ensDeploymentChainId = getEnsDeploymentChainId();

  /**
   * Get the public client for the ENS deployment chain
   * @returns the public client for the ENS deployment chain
   * @throws an error if the public client is not found
   */
  function getEnsDeploymentPublicClient(): PublicClient {
    // get the public client for the ENS deployment chain
    const publicClient = publicClients[ensDeploymentChainId];

    if (!publicClient) {
      throw new Error(`Could not find public client for chain ID: ${ensDeploymentChainId}`);
    }

    return publicClient;
  }

  /**
   * Get the last block indexed by Ponder.
   *
   * @returns the block info fetched from the public client
   */
  const getLastIndexedBlock = async () => {
    const ponderStatus = await queryPonderStatus(ponderDatabaseSchema(), db);
    const chainStatus = ponderStatus.find(
      (status) => status.network_name === ensDeploymentChainId.toString(),
    );

    if (!chainStatus || !chainStatus.block_number) {
      throw new Error(
        `Could not find latest indexed block number for chain ID: ${ensDeploymentChainId}`,
      );
    }

    return getEnsDeploymentPublicClient().getBlock({
      blockNumber: BigInt(chainStatus.block_number),
    });
  };

  /**
   * Get the Ponder build ID
   * @returns The Ponder build ID
   */
  const getPonderBuildId = async (): Promise<string> => {
    const meta = await queryPonderMeta(ponderDatabaseSchema(), db);

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
    getLastIndexedBlock,
    getPonderBuildId,
    hasIndexingErrors,
  };
};

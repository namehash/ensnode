import packageJson from "@/../package.json";

import type { ReadonlyDrizzle } from "ponder";
import type { PublicClient } from "viem";

import config from "@/config";
import { getENSRainbowApiClient } from "@/lib/ensraibow-api-client";
import {
  createFirstBlockToIndexByChainIdFetcher,
  createPonderStatusFetcher,
  createPrometheusMetricsFetcher,
} from "@/lib/ponder-helpers";
import { getENSRootChainId } from "@ensnode/datasources";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";
import { PrometheusMetrics, queryPonderMeta } from "@ensnode/ponder-metadata";
import type { PonderMetadataProvider } from "@ensnode/ponder-subgraph";

// setup block indexing status fetching
export const fetchFirstBlockToIndexByChainId = createFirstBlockToIndexByChainIdFetcher(
  import("@/../ponder.config").then((m) => m.default),
);

// setup ENSRainbow version fetching
export const fetchEnsRainbowVersion = async (): Promise<EnsRainbow.VersionInfo> => {
  const ensRainbowApiClient = getENSRainbowApiClient();

  try {
    const versionResponse = await ensRainbowApiClient.version();
    return {
      version: versionResponse.versionInfo.version,
      schema_version: versionResponse.versionInfo.schema_version,
    };
  } catch (error) {
    console.error("Failed to fetch ENSRainbow version", error);
    return {
      version: "unknown",
      schema_version: 0,
    };
  }
};

// setup prometheus metrics fetching
export const fetchPrometheusMetrics = createPrometheusMetricsFetcher(config.port);

// setup Ponder Status fetching
export const fetchPonderStatus = createPonderStatusFetcher(config.port);

export const makePonderMetadataProvider = ({
  db,
  publicClients,
}: {
  db: ReadonlyDrizzle<Record<string, unknown>>;
  publicClients: Record<string, PublicClient>;
}): PonderMetadataProvider => {
  // get the root datasource's chain ID
  const ensRootChainId = getENSRootChainId(config.namespace);
  const availableNetworkNames = Object.keys(publicClients);

  if (availableNetworkNames.length === 0) {
    throw new Error(`Invariant: no available publicClients for constructing ponder metadata.`);
  }

  // use the root chain's publicClient if available, otherwise warn and use first found
  let publicClient = publicClients[ensRootChainId];
  if (!publicClient) {
    const networkId = availableNetworkNames[0]!; // length check done above
    console.warn(
      `No public client available for chain '${ensRootChainId}', using status of chain '${networkId}' to power 'Query._meta'.`,
    );
    publicClient = publicClients[networkId]!; // must exist
  }

  /**
   * Get the last block indexed by Ponder.
   *
   * @returns the block info fetched from the public client
   */
  const getLastIndexedENSRootChainBlock = async () => {
    const ponderStatus = await fetchPonderStatus();
    const chainStatus = Object.values(ponderStatus).find(
      (ponderStatusForChain) => ponderStatusForChain.id === ensRootChainId,
    );

    if (!chainStatus || !chainStatus.block.number) {
      throw new Error(`Could not find latest indexed block number for chain ID: ${ensRootChainId}`);
    }

    return publicClient.getBlock({
      blockNumber: BigInt(chainStatus.block.number),
    });
  };

  /**
   * Get the Ponder build ID
   * @returns The Ponder build ID
   */
  const getPonderBuildId = async (): Promise<string> => {
    const meta = await queryPonderMeta(config.databaseSchemaName, db);

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
    getLastIndexedENSRootChainBlock,
    getPonderBuildId,
    hasIndexingErrors,
  };
};

import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";
import { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { queryPonderMeta, queryPonderStatus } from "./db-helpers";
import { PrometheusMetrics } from "./prometheus-metrics";
import type {
  PonderEnvVarsInfo,
  PonderMetadataMiddlewareOptions,
  PonderMetadataMiddlewareResponse,
} from "./types/api";
import type { BlockInfo, NetworkIndexingStatus, PonderBlockStatus } from "./types/common";

/**
 * Ponder Metadata types definition.
 */
interface PonderMetadataModule {
  /** Application info */
  AppInfo: {
    /** Application name */
    name: string;
    /** Application version */
    version: string;
  };

  /** Environment Variables info */
  EnvVars: {
    /** Database schema */
    DATABASE_SCHEMA: string;
  } & PonderEnvVarsInfo;

  /** Runtime info */
  RuntimeInfo: {
    /**
     * Application build id
     * https://github.com/ponder-sh/ponder/blob/626e524/packages/core/src/build/index.ts#L425-L431
     **/
    codebaseBuildId: string;

    /** Network indexing status by chain ID */
    networkIndexingStatusByChainId: Record<number, NetworkIndexingStatus>;

    /** ENSRainbow version info */
    ensRainbow?: EnsRainbow.VersionInfo;
  };
}

export type MetadataMiddlewareResponse = PonderMetadataMiddlewareResponse<
  PonderMetadataModule["AppInfo"],
  PonderMetadataModule["EnvVars"],
  PonderMetadataModule["RuntimeInfo"]
>;

export function ponderMetadata<
  AppInfo extends PonderMetadataModule["AppInfo"],
  EnvVars extends PonderMetadataModule["EnvVars"],
>({
  app,
  db,
  env,
  query,
  publicClients,
}: PonderMetadataMiddlewareOptions<AppInfo, EnvVars>): MiddlewareHandler {
  return async function ponderMetadataMiddleware(ctx) {
    const indexedChainIds = Object.keys(publicClients).map(Number);

    const ponderStatus = await queryPonderStatus(env.DATABASE_SCHEMA, db);
    const metrics = PrometheusMetrics.parse(await query.prometheusMetrics());

    const networkIndexingStatusByChainId: Record<number, NetworkIndexingStatus> = {};

    for (const indexedChainId of indexedChainIds) {
      const publicClient = publicClients[indexedChainId];

      if (!publicClient) {
        throw new HTTPException(500, {
          message: `No public client found for chainId ${indexedChainId}`,
        });
      }

      /**
       * Fetches block metadata from blockchain network for a given block number.
       * @param blockNumber
       * @returns block metadata
       * @throws {Error} if failed to fetch block metadata from blockchain network
       */
      const fetchBlockMetadata = async (blockNumber: number): Promise<BlockInfo> => {
        const block = await publicClient.getBlock({
          blockNumber: BigInt(blockNumber),
        });

        if (!block) {
          throw new Error(
            `Failed to fetch block metadata for block number ${blockNumber} with chain ID ${indexedChainId}`,
          );
        }

        return {
          number: Number(block.number),
          timestamp: Number(block.timestamp),
        } satisfies BlockInfo;
      };

      const latestSafeBlockData = await publicClient.getBlock();

      if (!latestSafeBlockData) {
        throw new HTTPException(500, {
          message: `Failed to fetch latest safe block for chainId ${indexedChainId}`,
        });
      }

      // mapping latest safe block
      const latestSafeBlock = {
        number: Number(latestSafeBlockData.number),
        timestamp: Number(latestSafeBlockData.timestamp),
      } satisfies BlockInfo;

      // mapping chain id to its string representation for metric queries
      const network = indexedChainId.toString();

      // mapping last synced block if available
      const lastSyncedBlockHeight = metrics.getValue("ponder_sync_block", {
        network,
      });
      let lastSyncedBlock: BlockInfo | null = null;
      if (lastSyncedBlockHeight) {
        try {
          lastSyncedBlock = await fetchBlockMetadata(lastSyncedBlockHeight);
        } catch (error) {
          console.error("Failed to fetch block metadata for last synced block", error);
        }
      }

      // mapping ponder status for current network
      const ponderStatusForNetwork = ponderStatus.find(
        (ponderStatusEntry) => ponderStatusEntry.network_name === network,
      );

      // mapping last indexed block if available
      let lastIndexedBlock: BlockInfo | null = null;
      if (ponderStatusForNetwork) {
        lastIndexedBlock = ponderBlockInfoToBlockMetadata(ponderStatusForNetwork);
      }

      networkIndexingStatusByChainId[indexedChainId] = {
        lastSyncedBlock,
        lastIndexedBlock,
        latestSafeBlock,
        firstBlockToIndex: await query.firstBlockToIndexByChainId(indexedChainId, publicClient),
      } satisfies NetworkIndexingStatus;
    }

    // mapping ponder app build id if available
    let ponderAppBuildId: string | undefined;
    try {
      ponderAppBuildId = (await queryPonderMeta(env.DATABASE_SCHEMA, db)).build_id;
    } catch (error) {
      console.error("Failed to fetch ponder metadata", error);
    }

    // fetch ENSRainbow version if available
    let ensRainbowVersionInfo = undefined;
    if (query.ensRainbowVersion) {
      try {
        ensRainbowVersionInfo = await query.ensRainbowVersion();
      } catch (error) {
        console.error("Failed to fetch ENSRainbow version", error);
      }
    }

    const response = {
      app,
      deps: {
        ponder: formatTextMetricValue(metrics.getLabel("ponder_version_info", "version")),
        nodejs: formatTextMetricValue(metrics.getLabel("nodejs_version_info", "version")),
      },
      env,
      runtime: {
        codebaseBuildId: formatTextMetricValue(ponderAppBuildId),
        networkIndexingStatusByChainId,
        ensRainbow: ensRainbowVersionInfo,
      },
    } satisfies MetadataMiddlewareResponse;

    // validate if response is in correct state
    validateResponse(response);

    return ctx.json(response);
  };
}

/**
 * Validates the metadata middleware response to ensure correct state.
 *
 * @param response The response to validate
 * @throws {HTTPException} if the response is in an invalid state
 */
function validateResponse(response: MetadataMiddlewareResponse): void {
  const { networkIndexingStatusByChainId } = response.runtime;

  if (Object.keys(networkIndexingStatusByChainId).length === 0) {
    throw new HTTPException(500, {
      message: "No network indexing status found",
    });
  }

  if (Object.values(networkIndexingStatusByChainId).some((n) => n.firstBlockToIndex === null)) {
    throw new HTTPException(500, {
      message: "Failed to fetch first block to index for some networks",
    });
  }
}

/**
 * Formats a text metric value.
 * @param value
 * @returns
 */
function formatTextMetricValue(value?: string): string {
  return value ?? "unknown";
}

/**
 * Converts a Ponder block status to a block info object.
 **/
function ponderBlockInfoToBlockMetadata(block: PonderBlockStatus | undefined): BlockInfo | null {
  if (!block) {
    return null;
  }

  if (!block.block_number || !block.block_timestamp) {
    return null;
  }

  return {
    number: block.block_number,
    timestamp: block.block_timestamp,
  };
}

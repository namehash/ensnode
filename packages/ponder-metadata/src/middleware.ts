import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";
import { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { queryPonderMeta } from "./db-helpers";
import { PrometheusMetrics } from "./prometheus-metrics";
import type {
  PonderEnvVarsInfo,
  PonderMetadataMiddlewareOptions,
  PonderMetadataMiddlewareResponse,
} from "./types/api";
import type { BlockInfo, NetworkIndexingStatus } from "./types/common";

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
    const indexedChainNames = Object.keys(publicClients);

    const ponderStatus = await query.ponderStatus();

    const metrics = PrometheusMetrics.parse(await query.prometheusMetrics());

    const networkIndexingStatusByChainId: Record<number, NetworkIndexingStatus> = {};

    for (const indexedChainName of indexedChainNames) {
      const publicClient = publicClients[indexedChainName];

      if (!publicClient || typeof publicClient.chain === "undefined") {
        throw new HTTPException(500, {
          message: `No public client found for "${indexedChainName}" chain name`,
        });
      }

      const publicClientChainId = publicClient.chain.id;

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
            `Failed to fetch block metadata for block number ${blockNumber} for "${publicClientChainId}" chain ID`,
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
          message: `Failed to fetch latest safe block for "${publicClientChainId}" chain ID`,
        });
      }

      // mapping latest safe block
      const latestSafeBlock = {
        number: Number(latestSafeBlockData.number),
        timestamp: Number(latestSafeBlockData.timestamp),
      } satisfies BlockInfo;

      // mapping indexed chain name to its metric representation for metric queries
      const chain = indexedChainName;

      // mapping last synced block if available
      const lastSyncedBlockHeight = metrics.getValue("ponder_sync_block", {
        chain,
      });
      let lastSyncedBlock: BlockInfo | null = null;
      if (lastSyncedBlockHeight) {
        try {
          lastSyncedBlock = await fetchBlockMetadata(lastSyncedBlockHeight);
        } catch (error) {
          console.error("Failed to fetch block metadata for last synced block", error);
        }
      }

      // mapping ponder status for current chain
      const ponderStatusForChain = Object.values(ponderStatus).find(
        (ponderStatusEntry) => ponderStatusEntry.id === publicClientChainId,
      );

      // mapping last indexed block if available
      let lastIndexedBlock: BlockInfo | null = null;
      if (ponderStatusForChain) {
        lastIndexedBlock = ponderBlockInfoToBlockMetadata(ponderStatusForChain.block);
      }

      networkIndexingStatusByChainId[publicClientChainId] = {
        lastSyncedBlock,
        lastIndexedBlock,
        latestSafeBlock,
        firstBlockToIndex: await query.firstBlockToIndexByChainId(
          publicClientChainId,
          publicClient,
        ),
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
function ponderBlockInfoToBlockMetadata(block: Partial<BlockInfo> | undefined): BlockInfo | null {
  if (!block) {
    return null;
  }

  if (!block.number || !block.timestamp) {
    return null;
  }

  return {
    number: block.number,
    timestamp: block.timestamp,
  };
}

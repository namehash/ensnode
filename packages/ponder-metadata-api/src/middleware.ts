import { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { queryPonderMeta, queryPonderStatus } from "./db-helpers";
import { PrometheusMetrics } from "./prometheus-metrics";
import { PonderMetadataMiddlewareOptions, PonderMetadataMiddlewareResponse } from "./types/api";
import type { BlockInfo, NetworkIndexingStatus, PonderBlockStatus } from "./types/common";

export function ponderMetadata({
  app,
  db,
  env,
  query,
  publicClients,
}: PonderMetadataMiddlewareOptions): MiddlewareHandler {
  return async function ponderMetadataMiddleware(ctx) {
    const indexedChainIds = Object.keys(publicClients).map(Number);

    const ponderStatus = await queryPonderStatus(env.DATABASE_SCHEMA, db);
    const ponderMeta = await queryPonderMeta(env.DATABASE_SCHEMA, db);
    const metrics = PrometheusMetrics.parse(await query.prometheusMetrics());

    const networkIndexingStatusByChainId: Record<number, NetworkIndexingStatus> = {};

    for (const indexedChainId of indexedChainIds) {
      const publicClient = publicClients[indexedChainId];

      if (!publicClient) {
        throw new HTTPException(500, {
          message: `No public client found for chainId ${indexedChainId}`,
        });
      }

      const fetchBlockMetadata = async (blockNumber: number): Promise<BlockInfo | null> => {
        const block = await publicClient.getBlock({
          blockNumber: BigInt(blockNumber),
        });

        if (!block) {
          return null;
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
        lastSyncedBlock = await fetchBlockMetadata(lastSyncedBlockHeight);
      }

      // mapping last indexed block if available
      const ponderStatusForNetwork = ponderStatus.find((s) => s.network_name === network);
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

    const response = {
      app,
      deps: {
        ponder: formatTextMetricValue(metrics.getLabel("ponder_version_info", "version")),
        nodejs: formatTextMetricValue(metrics.getLabel("nodejs_version_info", "version")),
      },
      env,
      runtime: {
        codebaseBuildId: formatTextMetricValue(ponderMeta.build_id),
        networkIndexingStatusByChainId,
      },
    } satisfies PonderMetadataMiddlewareResponse;

    // validate if response is in correct state
    validateResponse(response);

    return ctx.json(response);
  };
}

function validateResponse(response: PonderMetadataMiddlewareResponse) {
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

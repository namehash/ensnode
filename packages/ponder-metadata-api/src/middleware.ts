import { MiddlewareHandler } from "hono";
import { ReadonlyDrizzle } from "ponder";
import { PublicClient } from "viem";
import { queryPonderMeta, queryPonderStatus } from "./db-helpers";
import { PrometheusMetrics } from "./prometheus-metrics";
import type { BlockMetadata, NetworkIndexingStatus } from "./types/common";

export function ponderMetadata({
  app,
  db,
  env,
  fetchIndexingStartBlockNumbersByChainId,
  fetchPrometheusMetrics,
  publicClients,
}: {
  db: ReadonlyDrizzle<Record<string, unknown>>;
  app: {
    name: string;
    version: string;
  };
  env: {
    DATABASE_SCHEMA: string;
  } & Record<string, unknown>;
  fetchPrometheusMetrics: () => Promise<string>;
  fetchIndexingStartBlockNumbersByChainId: (chainId: number) => Promise<{
    number: number | null;
    timestamp: number | null;
  } | null>;
  publicClients: Record<number, PublicClient>;
}): MiddlewareHandler {
  return async function ponderMetadataMiddleware(ctx) {
    const indexedChainIds = Object.keys(publicClients).map(Number);

    const ponderStatus = await queryPonderStatus(env.DATABASE_SCHEMA, db);
    const ponderMeta = await queryPonderMeta(env.DATABASE_SCHEMA, db);
    const metrics = PrometheusMetrics.parse(await fetchPrometheusMetrics());

    const networkIndexingStatus: Record<string, NetworkIndexingStatus> = {};

    for (const indexedChainId of indexedChainIds) {
      const publicClient = publicClients[indexedChainId];

      if (!publicClient) {
        throw new Error(`No public client found for chainId ${indexedChainId}`);
      }

      const latestSafeBlock = await publicClient.getBlock();

      const network = indexedChainId.toString();
      const ponderStatusForNetwork = ponderStatus.find((s) => s.network_name === network);

      const lastSyncedBlockHeight =
        metrics.getValue("ponder_sync_block", {
          network,
        }) ?? null;

      const lastSyncedBlock = lastSyncedBlockHeight
        ? await publicClient.getBlock({
            blockNumber: BigInt(lastSyncedBlockHeight),
          })
        : null;

      const firstIndexedBlock = await fetchIndexingStartBlockNumbersByChainId(indexedChainId);
      const lastIndexedBlock = mapPonderStatusBlockToBlockMetadata(ponderStatusForNetwork);

      networkIndexingStatus[network] = {
        totalBlocksCount:
          metrics.getValue("ponder_historical_total_blocks", {
            network,
          }) ?? null,
        cachedBlocksCount:
          metrics.getValue("ponder_historical_cached_blocks", {
            network,
          }) ?? null,
        firstBlockToIndex: firstIndexedBlock ? blockInfo(firstIndexedBlock) : null,
        lastSyncedBlock: lastSyncedBlock
          ? blockInfo({
              number: Number(lastSyncedBlock.number),
              timestamp: Number(lastSyncedBlock.timestamp),
            })
          : null,
        latestSafeBlock: blockInfo({
          number: Number(latestSafeBlock.number),
          timestamp: Number(latestSafeBlock.timestamp),
        }),
        lastIndexedBlock,
        isRealtime: Boolean(metrics.getValue("ponder_sync_is_realtime", { network })),
        isComplete: Boolean(metrics.getValue("ponder_sync_is_complete", { network })),
        isQueued: lastIndexedBlock === null,
      } satisfies NetworkIndexingStatus;
    }

    return ctx.json({
      app,
      // application dependencies version
      deps: {
        ponder: metrics.getLabel("ponder_version_info", "version"),
        nodejs: metrics.getLabel("nodejs_version_info", "version"),
      },
      // application environment variables
      env,
      // application runtime information
      runtime: {
        // application build id
        // https://github.com/ponder-sh/ponder/blob/626e524/packages/core/src/build/index.ts#L425-L431
        codebaseBuildId: ponderMeta?.build_id,
        networkIndexingStatus,
      },
    });
  };
}

function blockInfo(block: {
  number: number | null;
  timestamp: number | null;
}): BlockMetadata | null {
  if (!block.number) {
    return null;
  }

  return {
    height: block.number,
    timestamp: block.timestamp ?? 0,
    utc: block.timestamp ? new Date(block.timestamp * 1000).toISOString() : "",
  };
}

function mapPonderStatusBlockToBlockMetadata(
  block:
    | {
        block_number: number | null;
        block_timestamp: number | null;
      }
    | undefined,
): BlockMetadata | null {
  if (!block?.block_number) {
    return null;
  }

  return blockInfo({
    number: block.block_number,
    timestamp: block.block_timestamp,
  });
}

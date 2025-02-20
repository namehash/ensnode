import { MiddlewareHandler } from "hono";
import { PublicClient } from "viem";
import { getEnsDeploymentChain } from "./ponder-helpers";
import { PrometheusMetrics } from "./prometheus-metrics";

interface BlockMetadata {
  height: number;
  timestamp: number;
  utc: string;
}

interface NetworkIndexingStatus {
  /**
   * Number of blocks required for the historical sync.
   */
  totalBlocksCount: number | undefined;

  /**
   *  Number of blocks that were found in the cache for the historical sync.
   */
  cachedBlocksCount: number | undefined;

  /**
   * Closest-to-tip synced block number.
   */
  lastSyncedBlock: BlockMetadata | undefined;

  /**
   * Last block processed & indexed by the indexer.
   */
  lastIndexedBlock: BlockMetadata | undefined;

  /**
   * Latest safe block available on the chain.
   */
  latestSafeBlock: BlockMetadata | undefined;

  /**
   * Indicating if the sync is realtime mode.
   */
  isRealtime: boolean;

  /**
   * Indicating if the sync has synced all blocks up to the tip.
   */
  isComplete: boolean;

  /**
   * Indicating if the sync is queued.
   */
  isQueued: boolean;

  /**
   * Human-readable description of the current indexing state
   */
  status: string;
}

export function ensNodeMetadata({
  publicClients,
}: {
  publicClients: Record<number, PublicClient>;
}): MiddlewareHandler {
  return async function ensNodeMetadataMiddleware(ctx) {
    const packageJson = await import("../../package.json").then((m) => m.default);

    const metricsResponse = await fetch(`http://localhost:${process.env.PORT}/metrics`);

    const metrics = new PrometheusMetrics();

    metrics.parseText(await metricsResponse.text());

    const chainIds = Object.keys(publicClients).map(Number);

    let networkIndexingStatus: Record<string, NetworkIndexingStatus> = {};

    for (const chainId of chainIds) {
      const network = chainId.toString();
      const publicClient = publicClients[chainId];

      if (!publicClient) {
        throw new Error(`No public client found for chainId ${chainId}`);
      }

      const latestSafeBlock = await publicClient.getBlock();

      const lastSyncedBlockHeight = metrics.getValue("ponder_sync_block", {
        network,
      });
      const lastSyncedBlockTimestamp = 0;

      const lastIndexedBlockTimestamp = metrics.getValue("ponder_indexing_timestamp", {
        network,
      });
      const lastIndexedBlockHeight = 0;

      const networkStatus = {
        totalBlocksCount: metrics.getValue("ponder_historical_total_blocks", {
          network,
        }),
        cachedBlocksCount: metrics.getValue("ponder_historical_cached_blocks", {
          network,
        }),
        lastSyncedBlock: {
          height: lastSyncedBlockHeight ?? 0,
          timestamp: lastSyncedBlockTimestamp ?? 0,
          utc: "",
        },
        lastIndexedBlock: {
          height: 0,
          timestamp: lastIndexedBlockTimestamp ?? 0,
          utc: "",
        },
        latestSafeBlock: {
          height: Number(latestSafeBlock.number),
          timestamp: Number(latestSafeBlock.timestamp),
          utc: new Date(Number(latestSafeBlock.timestamp) * 1000).toISOString(),
        },
        isRealtime: Boolean(metrics.getValue("ponder_sync_is_realtime", { network })),
        isComplete: Boolean(metrics.getValue("ponder_sync_is_complete", { network })),
        isQueued: typeof metrics.getValue("ponder_sync_block", { network }) === "undefined",
        status: "",
      } satisfies NetworkIndexingStatus;

      if (Object.values(networkStatus).every((v) => typeof v === "undefined")) {
        // no data for this network
        continue;
      }

      networkIndexingStatus[network] = networkStatus;
    }

    return ctx.json({
      name: packageJson.name,
      version: packageJson.version,
      deps: {
        ponder: metrics.getLabel("ponder_version_info", "version"),
      },
      env: {
        ACTIVE_PLUGINS: process.env.ACTIVE_PLUGINS,
        DATABASE_SCHEMA: process.env.DATABASE_SCHEMA,
        ENS_DEPLOYMENT_CHAIN: getEnsDeploymentChain(),
      },
      runtime: {
        networkIndexingStatus,
      },
    });
  };
}

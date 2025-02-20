import { MiddlewareHandler } from "hono";
import { PublicClient } from "viem";
import { PrometheusMetrics } from "./prometheus-metrics";
import { getEnsDeploymentChain } from "./ponder-helpers";

interface NetworkIndexingStatus {
  /**
   * Number of blocks required for the historical sync.
   */
  totalBlocks: number | undefined;

  /**
   *  Number of blocks that were found in the cache for the historical sync.
   */
  cachedBlocks: number | undefined;

  /**
   * Closest-to-tip synced block number.
   */
  syncBlock: number | undefined;

  /**
   * Latest block number.
   */
  latestBlock: number;

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
    const packageJson = await import("../../package.json").then(
      (m) => m.default
    );

    const metricsResponse = await fetch(
      `http://localhost:${process.env.PORT}/metrics`
    );

    const metrics = new PrometheusMetrics();

    metrics.parseText(await metricsResponse.text());

    const chainIds = Object.keys(publicClients).map(Number);

    const networkIndexingStatus = chainIds.reduce((acc, chainId) => {
      const network = chainId.toString();
      const networkStatus = {
        totalBlocks: metrics.getValue("ponder_historical_total_blocks", {
          network,
        }),
        cachedBlocks: metrics.getValue("ponder_historical_cached_blocks", {
          network,
        }),
        syncBlock: metrics.getValue("ponder_sync_block", { network }),
        latestBlock: 0,
        isRealtime: Boolean(
          metrics.getValue("ponder_sync_is_realtime", { network })
        ),
        isComplete: Boolean(
          metrics.getValue("ponder_sync_is_complete", { network })
        ),
        isQueued:
          typeof metrics.getValue("ponder_sync_block", { network }) ===
          "undefined",
        status: "",
      } satisfies NetworkIndexingStatus;

      if (Object.values(networkStatus).every((v) => typeof v === "undefined")) {
        // no data for this network
        return acc;
      }

      networkStatus.status = getHumanFriendlyIndexingStatus(networkStatus);
      acc[network] = networkStatus;

      return acc;
    }, {} as Record<string, NetworkIndexingStatus>);

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

/**
 * Generates a human-friendly status message for network indexing state
 */
function getHumanFriendlyIndexingStatus(status: NetworkIndexingStatus): string {
  // Chain not yet indexed
  if (status.isQueued) {
    return "Waiting to start indexing";
  }

  // Missing core metrics
  if (typeof status.totalBlocks === "undefined") {
    return "Initializing indexer";
  }

  const blocksBehind = status.latestBlock - (status.syncBlock ?? 0);
  const blocksProgress =
    status.cachedBlocks && status.totalBlocks
      ? ((status.cachedBlocks / status.totalBlocks) * 100).toFixed(1)
      : "0";

  // Fully synced state
  if (status.isComplete) {
    if (status.isRealtime) {
      if (blocksBehind > 100) {
        return `Catching up: ${blocksBehind.toLocaleString()} blocks behind tip`;
      }
      return "Synced and processing new blocks in real-time";
    }
    return "Fully synced to historical block range";
  }

  // Actively syncing state
  if (status.isRealtime) {
    return `Processing historical blocks: ${blocksProgress}% complete (${status.cachedBlocks?.toLocaleString()} / ${status.totalBlocks?.toLocaleString()} blocks, ${blocksBehind.toLocaleString()} behind tip)`;
  }

  return `Indexing historical blocks: ${blocksProgress}% complete (${status.cachedBlocks?.toLocaleString()} / ${status.totalBlocks?.toLocaleString()} blocks)`;
}

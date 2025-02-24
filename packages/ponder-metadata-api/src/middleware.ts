import { MiddlewareHandler } from "hono";
import { ReadonlyDrizzle, eq } from "ponder";
import { PublicClient } from "viem";
import { queryPonderMeta, queryPonderStatus } from "./db-helpers";
import { MetricsParser, parsePrometheusText } from "./prometheus-metrics";

interface BlockMetadata {
  height: number;
  timestamp: number;
  utc: string;
}

interface NetworkIndexingStatus {
  /**
   * Number of blocks required for the historical sync.
   */
  totalBlocksCount: number | null;

  /**
   *  Number of blocks that were found in the cache for the historical sync.
   */
  cachedBlocksCount: number | null;

  /**
   * Closest-to-tip synced block number.
   */
  lastSyncedBlock: BlockMetadata | null;

  /**
   * Last block processed & indexed by the indexer.
   */
  lastIndexedBlock: BlockMetadata | null;

  /**
   * Latest safe block available on the chain.
   */
  latestSafeBlock: BlockMetadata | null;

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

export function ponderMetadata({
  app,
  db,
  env,
  fetchPrometheusMetrics,
  publicClients,
}: {
  // TODO: apply correct type for db to include the ponder meta and status tables
  db: ReadonlyDrizzle<Record<string, unknown>>;
  app: {
    name: string;
    version: string;
  };
  env: Record<string, string | undefined>;
  fetchPrometheusMetrics: () => Promise<string>;
  publicClients: Record<number, PublicClient>;
}): MiddlewareHandler {
  return async function ponderMetadataMiddleware(ctx) {
    const indexedChainIds = Object.keys(publicClients).map(Number);
    const dbSchema = env.DATABASE_SCHEMA ?? "public";
    const ponderStatus = await queryPonderStatus(dbSchema, db);
    const ponderMeta = await queryPonderMeta(dbSchema, db);
    const metrics = new MetricsParser(parsePrometheusText(await fetchPrometheusMetrics()));

    let networkIndexingStatus: Record<string, NetworkIndexingStatus> = {};

    for (const indexedChainId of indexedChainIds) {
      const network = indexedChainId.toString();
      const publicClient = publicClients[indexedChainId];
      const ponderNetworkStatus = ponderStatus.find((s) => s.network_name === network);

      if (!publicClient) {
        throw new Error(`No public client found for chainId ${indexedChainId}`);
      }

      const latestSafeBlock = await publicClient.getBlock();

      const lastIndexedBlock = mapPonderStatusBlockToBlockMetadata(ponderNetworkStatus);

      const networkStatus = {
        totalBlocksCount:
          metrics.getValue("ponder_historical_total_blocks", {
            network,
          }) ?? null,
        cachedBlocksCount:
          metrics.getValue("ponder_historical_cached_blocks", {
            network,
          }) ?? null,
        lastSyncedBlock: blockInfo({
          number:
            metrics.getValue("ponder_sync_block", {
              network,
            }) ?? 0,
          timestamp: 0,
        }),
        latestSafeBlock: blockInfo({
          number: Number(latestSafeBlock.number),
          timestamp: Number(latestSafeBlock.timestamp),
        }),
        lastIndexedBlock,
        isRealtime: Boolean(metrics.getValue("ponder_sync_is_realtime", { network })),
        isComplete: Boolean(metrics.getValue("ponder_sync_is_complete", { network })),
        isQueued: lastIndexedBlock === null,
        status: "",
      } satisfies NetworkIndexingStatus;

      if (Object.values(networkStatus).every((v) => typeof v === "undefined")) {
        // no data for this network
        continue;
      }

      networkIndexingStatus[network] = networkStatus;
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
        // tableNames: meta?.table_names,
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

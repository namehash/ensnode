import { MiddlewareHandler } from "hono";
import { ReadonlyDrizzle, eq } from "ponder";
import { PublicClient } from "viem";
import {
  GetPonderMetaType,
  GetPonderStatusType,
  getPonderMeta,
  getPonderStatus,
} from "./db-helpers";
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
    const dbSchema = process.env.DATABASE_SCHEMA || "public";
    // TODO: drop ts ignore after fixing the types
    // @ts-ignore
    const PONDER_META = getPonderMeta(dbSchema);
    const PONDER_STATUS = getPonderStatus(dbSchema);

    const meta = (await db
      // @ts-ignore
      .select({ value: PONDER_META.value })
      // @ts-ignore
      .from(PONDER_META)
      // @ts-ignore
      .where(eq(PONDER_META.key, "app"))
      .limit(1)
      .then(
        (result: any) => result[0]?.value
      )) as GetPonderMetaType["$inferSelect"]["value"];

    const status = (await db
      .select()
      // TODO: drop ts ignore after fixing the types
      // @ts-ignore
      .from(PONDER_STATUS)) as unknown as Array<
      GetPonderStatusType["$inferSelect"]
    >;

    console.log("meta", meta, status);

    const metrics = new PrometheusMetrics();

    metrics.parseText(await fetchPrometheusMetrics());

    let networkIndexingStatus: Record<string, NetworkIndexingStatus> = {};

    for (const indexedChainId of indexedChainIds) {
      const network = indexedChainId.toString();
      const publicClient = publicClients[indexedChainId];
      const ponderNetworkStatus = status.find(
        (s) => s.network_name === network
      );

      if (!publicClient) {
        throw new Error(`No public client found for chainId ${indexedChainId}`);
      }

      const latestSafeBlock = await publicClient.getBlock();

      const lastSyncedBlockHeight = metrics.getValue("ponder_sync_block", {
        network,
      });
      const lastSyncedBlockTimestamp = 0;

      const lastSyncedBlock: BlockMetadata | null = lastSyncedBlockHeight
        ? {
            height: lastSyncedBlockHeight ?? 0,
            timestamp: lastSyncedBlockTimestamp ?? 0,
            utc: lastSyncedBlockTimestamp
              ? new Date(Number(lastSyncedBlockTimestamp) * 1000).toISOString()
              : "",
          }
        : null;

      const lastIndexedBlock = ponderNetworkStatus?.block_number
        ? {
            height: ponderNetworkStatus.block_number ?? 0,
            timestamp: ponderNetworkStatus.block_timestamp ?? 0,
            utc: ponderNetworkStatus.block_timestamp
              ? new Date(
                  Number(ponderNetworkStatus.block_timestamp) * 1000
                ).toISOString()
              : "",
          }
        : null;

      const networkStatus = {
        totalBlocksCount:
          metrics.getValue("ponder_historical_total_blocks", {
            network,
          }) ?? null,
        cachedBlocksCount:
          metrics.getValue("ponder_historical_cached_blocks", {
            network,
          }) ?? null,
        lastSyncedBlock,
        lastIndexedBlock,
        latestSafeBlock: {
          height: Number(latestSafeBlock.number),
          timestamp: Number(latestSafeBlock.timestamp),
          utc: new Date(Number(latestSafeBlock.timestamp) * 1000).toISOString(),
        },
        isRealtime: Boolean(
          metrics.getValue("ponder_sync_is_realtime", { network })
        ),
        isComplete: Boolean(
          metrics.getValue("ponder_sync_is_complete", { network })
        ),
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
        codebaseBuildId: meta?.build_id,
        // tableNames: meta?.table_names,
        networkIndexingStatus,
      },
    });
  };
}

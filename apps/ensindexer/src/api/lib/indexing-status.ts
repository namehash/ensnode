import { publicClients } from "ponder:api";
import { createMiddleware } from "hono/factory";
import config from "../../../ponder.config.js";
import ensIndexerConfig from "../../config/index.js";

const BASE_URL = ensIndexerConfig.ensIndexerPrivateUrl;

type BlockRef = { number: number; timestamp: number };

type ChainIndexingStatus =
  /**
   * Not started
   *
   * Notes:
   * - The "not_started" status applies when using omnichain ordering and the
   *   overall progress checkpoint has not reached the startBlock of the chain.
   */
  | {
      status: "not_started";
      config: { startBlock: BlockRef; endBlock: BlockRef | null };
    }
  /**
   * Backfill
   *
   * Notes:
   * - The backfillEndBlock is the latest block when the process starts up.
   * - When latestIndexedBlock reaches backfillEndBlock, the backfill is complete
   *   and the status will change to "following" or "completed".
   *
   * Invariants:
   * - latestIndexedBlock is always before or the same as latestKnownBlock
   * - backfillEndBlock is always the same as latestKnownBlock
   */
  | {
      status: "backfill";
      config: { startBlock: BlockRef; endBlock: BlockRef | null };
      latestIndexedBlock: BlockRef;
      latestKnownBlock: BlockRef;
      backfillEndBlock: BlockRef;
    }
  /**
   * Following
   *
   * Invariants:
   * - latestIndexedBlock is always before or the same as latestKnownBlock
   */
  | {
      status: "following";
      config: { startBlock: BlockRef; endBlock: BlockRef | null };
      latestIndexedBlock: BlockRef;
      latestKnownBlock: BlockRef;
      approximateRealtimeDistance: number;
    }
  /**
   * Completed
   *
   * Notes:
   * - The "completed" status only applies when all contracts, accounts, and block intervals
   *   have a defined endBlock. This means the chain will not enter the "following" status.
   *
   * Invariants:
   * - latestIndexedBlock is always the same as latestKnownBlock
   */
  | {
      status: "completed";
      config: { startBlock: BlockRef; endBlock: BlockRef | null };
      latestIndexedBlock: BlockRef;
      latestKnownBlock: BlockRef;
    };

type IndexingStatus = { chains: Record<number, ChainIndexingStatus> };

// Fetch chain start and end blocks in module scope. These RPC requests happen
// only once on startup. If they fail, Ponder's build step will fail.
const chainConfigs = new Map<string, { startBlock: BlockRef; endBlock: BlockRef | null }>();
await Promise.all(
  Object.keys(config.chains).map(async (chainName) => {
    // let minStartBlock: number | null = null;
    // let maxEndBlock: number | null = null;

    const startBlocks: (number | string | undefined | null)[] = [];
    const endBlocks: (number | string | undefined | null)[] = [];

    for (const source of [
      ...Object.values(config.contracts ?? {}),
      ...Object.values(config.accounts ?? {}),
      ...Object.values(config.blocks ?? {}),
    ]) {
      const chain = (source as any).chain;
      // let startBlock: any;
      // let endBlock: any;

      if (typeof chain === "string" && chain === chainName) {
        startBlocks.push((source as any).startBlock);
        endBlocks.push((source as any).endBlock);
      } else if (typeof chain === "object" && chain?.[chainName]) {
        startBlocks.push(chain[chainName].startBlock);
        endBlocks.push(chain[chainName].endBlock);
      }
    }

    const validStartBlocks = startBlocks.filter((block) => typeof block === "number");
    const minStartBlock = validStartBlocks.length > 0 ? Math.min(...validStartBlocks) : null;

    const validEndBlocks = endBlocks.filter((block) => typeof block === "number");
    const maxEndBlock = validEndBlocks.length > 0 ? Math.max(...validEndBlocks) : null;

    if (minStartBlock === null) {
      throw new Error(
        `No minimum start block found for chain '${chainName}'. Either all contracts, accounts, and block intervals use "latest" (unsupported) or the chain is misconfigured.`,
      );
    }

    const client = publicClients[chainName];
    if (client === undefined) {
      throw new Error(`Client not found for chain ${chainName}`);
    }

    const [startBlock, endBlock] = await Promise.all([
      client.getBlock({ blockNumber: BigInt(minStartBlock) }),
      maxEndBlock ? client.getBlock({ blockNumber: BigInt(maxEndBlock) }) : null,
    ]);

    chainConfigs.set(chainName, {
      startBlock: {
        number: Number(startBlock.number),
        timestamp: Number(startBlock.timestamp),
      },
      endBlock: endBlock
        ? {
            number: Number(endBlock.number),
            timestamp: Number(endBlock.timestamp),
          }
        : null,
    });
  }),
);

// Fetch chain backfill end blocks on an interval, to account for lag between when
// the module executes and when the ponder_historical_total_blocks metric gets set
// by Ponder. If we can't get a result within 10 seconds, crash the process.
let chainBackfillEndBlocks: { [chainName: string]: BlockRef } | null = null;

const shutdownTimeout = setTimeout(() => {
  console.error("Unable to fetch backfill end blocks within 10 seconds, shutting down");
  process.exit(1);
}, 10_000);

const chainBackfillEndBlockInterval = setInterval(async () => {
  if (chainBackfillEndBlocks !== null) {
    clearInterval(chainBackfillEndBlockInterval);
    clearTimeout(shutdownTimeout);
    return;
  }

  try {
    const metricsText = await fetch(`${BASE_URL}/metrics`).then((r) => r.text());
    const metrics = parsePrometheusMetrics(metricsText);

    const backfillEndBlocks = await Promise.all(
      Object.keys(config.chains).map(async (chainName) => {
        const chainConfig = chainConfigs.get(chainName);
        if (chainConfig === undefined) {
          throw new Error(`No chain config found for chain ${chainName}`);
        }

        const client = publicClients[chainName];
        if (client === undefined) {
          throw new Error(`Client not found for chain ${chainName}`);
        }

        const historicalTotalBlocks = metrics.getMetricValue("ponder_historical_total_blocks", {
          chain: chainName,
        });

        if (historicalTotalBlocks === undefined) {
          throw new Error(`No historical total blocks metric found for chain ${chainName}`);
        }

        const backfillEndBlockNumber = chainConfig.startBlock.number + historicalTotalBlocks;
        const block = await client.getBlock({
          blockNumber: BigInt(backfillEndBlockNumber),
        });

        const blockRef = {
          number: Number(block.number),
          timestamp: Number(block.timestamp),
        } satisfies BlockRef;

        return [chainName, blockRef] as const;
      }),
    );

    chainBackfillEndBlocks = Object.fromEntries(backfillEndBlocks);
    clearInterval(chainBackfillEndBlockInterval);
    clearTimeout(shutdownTimeout);
  } catch (error) {
    console.error("Error fetching backfill end blocks, retrying in 1 second");
    console.error(error);
    return;
  }
}, 1_000);

export const indexingStatusMiddleware = createMiddleware(async (c) => {
  try {
    const [metricsText, statusJson] = await Promise.all([
      fetch(`${BASE_URL}/metrics`).then((r) => r.text()),
      fetch(`${BASE_URL}/status`).then((r) => r.json()),
    ]);

    const metrics = parsePrometheusMetrics(metricsText);
    const status = statusJson as {
      [chainName: string]: {
        id: number;
        block: { number: number; timestamp: number };
      };
    };

    const settingsInfo = metrics.getMetricValues("ponder_settings_info");
    const ordering = settingsInfo[0]?.labels.ordering;
    if (ordering === undefined) {
      throw new Error("No ordering metric found");
    }

    const chainResults = await Promise.all(
      Object.entries(config.chains).map(async ([chainName, chainObj]) => {
        const chainId = (chainObj as { id: number }).id;

        const chainConfig = chainConfigs.get(chainName);
        if (chainConfig === undefined) {
          throw new Error(`No chain config found for chain ${chainName}`);
        }

        const statusBlock = status[chainName]?.block;
        if (statusBlock === undefined) {
          throw new Error(`Chain ${chainName} found in config but not in status`);
        }

        // In omnichain ordering, if the startBlock is the same as the
        // status block, the chain has not started yet.
        if (ordering === "omnichain" && chainConfig.startBlock.number === statusBlock.number) {
          return {
            chainId,
            result: {
              status: "not_started" as const,
              config: chainConfig,
            } satisfies ChainIndexingStatus,
          };
        }

        const isCompleteNumber = metrics.getMetricValue("ponder_sync_is_complete", {
          chain: chainName,
        });
        if (isCompleteNumber === undefined) {
          throw new Error(`No ponder_sync_is_complete metric found for chain ${chainName}`);
        }
        const isComplete = isCompleteNumber === 1;

        if (isComplete === true) {
          return {
            chainId,
            result: {
              status: "completed" as const,
              config: chainConfig,
              latestIndexedBlock: statusBlock,
              latestKnownBlock: statusBlock,
            } satisfies ChainIndexingStatus,
          };
        }

        const isRealtimeNumber = metrics.getMetricValue("ponder_sync_is_realtime", {
          chain: chainName,
        });
        if (isRealtimeNumber === undefined) {
          throw new Error(`No ponder_sync_is_realtime metric found for chain ${chainName}`);
        }
        const isRealtime = isRealtimeNumber === 1;

        // The is_realtime metric reliably indicates that the backfill is complete,
        // so take advantage of that here to simplify the logic below.
        if (isRealtime === true) {
          const syncBlockNumber = metrics.getMetricValue("ponder_sync_block", {
            chain: chainName,
          });
          const syncBlockTimestamp = metrics.getMetricValue("ponder_sync_block_timestamp", {
            chain: chainName,
          });
          if (syncBlockNumber === undefined || syncBlockTimestamp === undefined) {
            throw new Error(
              `No ponder_sync_block or ponder_sync_block_timestamp metric found for chain ${chainName}`,
            );
          }
          const syncBlock = {
            number: syncBlockNumber,
            timestamp: syncBlockTimestamp,
          } satisfies BlockRef;

          const approximateRealtimeDistance = Date.now() - statusBlock.timestamp;

          return {
            chainId,
            result: {
              status: "following" as const,
              config: chainConfig,
              latestIndexedBlock: statusBlock,
              latestKnownBlock: syncBlock,
              approximateRealtimeDistance,
            } satisfies ChainIndexingStatus,
          };
        }

        const backfillEndBlock = chainBackfillEndBlocks?.[chainName];
        if (backfillEndBlock === undefined) {
          throw new Error(`No backfill end block found for chain ${chainName}`);
        }

        return {
          chainId,
          result: {
            status: "backfill" as const,
            config: chainConfig,
            latestIndexedBlock: statusBlock,
            // During the backfill, the latest known block is the backfill end block.
            latestKnownBlock: backfillEndBlock,
            backfillEndBlock,
          } satisfies ChainIndexingStatus,
        };
      }),
    );

    const result = {
      chains: Object.fromEntries(chainResults.map(({ chainId, result }) => [chainId, result])),
    } satisfies IndexingStatus;

    return c.json(result);
  } catch (error) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

type PromLabels = { [key: string]: string };
type PromMetric = { name: string; labels: PromLabels; value: number };

function parsePrometheusMetrics(text: string) {
  const metrics: PromMetric[] = [];

  for (const line of text.split("\n")) {
    // Skip comments and empty lines
    if (line.startsWith("#") || line.trim() === "") continue;

    // Parse metric line: metric_name{label1="value1",label2="value2"} value
    const metricMatch = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]*)\}\s+([0-9.-]+)$/);
    if (metricMatch) {
      const [, metricName, labelsStr, valueStr] = metricMatch;
      if (metricName && labelsStr !== undefined && valueStr) {
        const labels: PromLabels = {};

        // Parse labels: label1="value1",label2="value2"
        const labelMatches = labelsStr.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"([^"]*)"/g);
        for (const labelMatch of labelMatches) {
          const [, labelName, labelValue] = labelMatch;
          if (labelName && labelValue !== undefined) {
            labels[labelName] = labelValue;
          }
        }

        const value = Number.parseFloat(valueStr);
        if (!Number.isNaN(value)) {
          metrics.push({ name: metricName, labels, value });
        }
      }
    }

    // Parse metric line without labels: metric_name value
    const simpleMetricMatch = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\s+([0-9.-]+)$/);
    if (simpleMetricMatch) {
      const [, metricName, valueStr] = simpleMetricMatch;
      if (metricName && valueStr) {
        const value = Number.parseFloat(valueStr);
        if (!Number.isNaN(value)) {
          metrics.push({ name: metricName, labels: {}, value });
        }
      }
    }
  }

  return {
    getMetricValue: (metricName: string, labels?: PromLabels): number | undefined => {
      for (const metric of metrics) {
        if (metric.name === metricName) {
          if (!labels || Object.keys(labels).length === 0) {
            return metric.value;
          }

          // Check if all provided labels match
          const labelsMatch = Object.entries(labels).every(
            ([key, value]) => metric.labels[key] === value,
          );

          if (labelsMatch) {
            return metric.value;
          }
        }
      }
      return undefined;
    },
    getMetricValues: (metricName: string, labelFilter?: PromLabels): PromMetric[] => {
      return metrics.filter((metric) => {
        if (metric.name !== metricName) return false;

        if (!labelFilter || Object.keys(labelFilter).length === 0) {
          return true;
        }

        // Check if all provided labels match
        return Object.entries(labelFilter).every(([key, value]) => metric.labels[key] === value);
      });
    },
  };
}

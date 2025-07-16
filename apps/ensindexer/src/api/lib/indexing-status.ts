import { publicClients } from "ponder:api";
import { createMiddleware } from "hono/factory";
import config from "../../../ponder.config.js";

type BlockRef = { number: number; timestamp: number };

type ChainIndexingConfig = {
  // If all contracts, accounts, and block intervals are set to "latest",
  // startBlock will be null.
  startBlock: BlockRef | null;
  // If all contracts, accounts, and block intervals are set to undefined,
  // endBlock will be null.
  endBlock: BlockRef | null;
};

type ChainIndexingStatus =
  | {
      status: "not_started";
      config: ChainIndexingConfig;
      latestBlock: BlockRef;
    }
  | {
      status: "backfill";
      config: ChainIndexingConfig;
      latestSyncedBlock: BlockRef;
      latestIndexedBlock: BlockRef;
      latestBlock: BlockRef;
    }
  | {
      status: "realtime";
      config: ChainIndexingConfig;
      latestSyncedBlock: BlockRef;
      latestIndexedBlock: BlockRef;
      latestBlock: BlockRef;
    }
  | {
      status: "completed";
      config: ChainIndexingConfig;
      latestSyncedBlock: BlockRef;
      latestIndexedBlock: BlockRef;
      latestBlock: BlockRef;
    };

type IndexingStatus = { chains: Record<number, ChainIndexingStatus> };

export const indexingStatusMiddleware = createMiddleware(async (c) => {
  try {
    const baseUrl = c.req.url.replace(/\/[^\/]*$/, "");
    const [metricsText, statusJson] = await Promise.all([
      fetch(`${baseUrl}/metrics`).then((r) => r.text()),
      fetch(`${baseUrl}/status`).then((r) => r.json()),
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
      Object.entries(config.chains).map(async ([chainName, chainConfig]) => {
        const chainId = (chainConfig as { id: number }).id;

        const chainBlockConfig = await getChainConfig(chainName);

        const latestBlock = await getLatestBlock(chainName);

        const statusBlock = status[chainName]?.block;
        if (statusBlock === undefined) {
          throw new Error(`Chain ${chainName} found in config but not in status`);
        }

        const isCompleteNumber = metrics.getMetricValue("ponder_sync_is_complete", {
          chain: chainName,
        });
        if (isCompleteNumber === undefined) {
          throw new Error(`No ponder_sync_is_completed metric found for chain ${chainName}`);
        }
        const isComplete = isCompleteNumber === 1;

        if (isComplete === true) {
          return {
            chainId,
            result: {
              status: "completed" as const,
              config: chainBlockConfig,
              latestSyncedBlock: statusBlock,
              latestIndexedBlock: statusBlock,
              latestBlock,
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
          const latestSyncedBlockNumber = metrics.getMetricValue("ponder_sync_block", {
            chain: chainName,
          });
          if (latestSyncedBlockNumber === undefined) {
            throw new Error(`No ponder_sync_block metric found for realtime chain ${chainName}`);
          }

          // If the latest sync block number is the same as the latest indexed
          // block number, use the latest indexed block as an optimization to
          // avoid the extra RPC request.
          const latestSyncedBlock =
            latestSyncedBlockNumber === statusBlock.number
              ? statusBlock
              : await cachedGetBlockByNumber(chainName, latestSyncedBlockNumber);

          return {
            chainId,
            result: {
              status: "realtime" as const,
              config: chainBlockConfig,
              latestSyncedBlock,
              latestIndexedBlock: statusBlock,
              latestBlock,
            } satisfies ChainIndexingStatus,
          };
        }

        // If we're not in realtime yet and the startBlock is null ("latest"),
        // the chain has not started yet.
        if (chainBlockConfig.startBlock === null) {
          return {
            chainId,
            result: {
              status: "not_started" as const,
              config: chainBlockConfig,
              latestBlock,
            } satisfies ChainIndexingStatus,
          };
        }

        // In omnichain ordering, if the startBlock is the same as the
        // status block, the chain has not started yet.
        if (ordering === "omnichain" && chainBlockConfig.startBlock.number === statusBlock.number) {
          return {
            chainId,
            result: {
              status: "not_started" as const,
              config: chainBlockConfig,
              latestBlock,
            } satisfies ChainIndexingStatus,
          };
        }

        const historicalTotalBlocks = metrics.getMetricValue("ponder_historical_total_blocks", {
          chain: chainName,
        });
        const historicalCachedBlocks = metrics.getMetricValue("ponder_historical_cached_blocks", {
          chain: chainName,
        });
        if (historicalTotalBlocks === undefined || historicalCachedBlocks === undefined) {
          throw new Error(
            `No ponder_historical_total_blocks or ponder_historical_cached_blocks metric found for chain ${chainName}`,
          );
        }

        const historicalCompletedBlocks =
          metrics.getMetricValue("ponder_historical_completed_blocks", {
            chain: chainName,
          }) ?? 0;

        const hasSyncBackfill = historicalTotalBlocks > 0;

        // If the chain has a sync backfill but hasn't completed any blocks,
        // the chain has not started yet.
        if (hasSyncBackfill && historicalCompletedBlocks === 0) {
          return {
            chainId,
            result: {
              status: "not_started" as const,
              config: chainBlockConfig,
              latestBlock,
            } satisfies ChainIndexingStatus,
          };
        }

        // We can calculate the latest synced block number by adding
        // the historical cached + completed blocks to the start block.
        const latestSyncedBlockNumber =
          chainBlockConfig.startBlock.number + historicalCachedBlocks + historicalCompletedBlocks;

        // If the latest sync block number is the same as the latest indexed
        // block number, use the latest indexed block as an optimization to
        // avoid the extra RPC request.
        const latestSyncedBlock =
          latestSyncedBlockNumber === statusBlock.number
            ? statusBlock
            : await cachedGetBlockByNumber(chainName, latestSyncedBlockNumber);

        return {
          chainId,
          result: {
            status: "backfill" as const,
            config: chainBlockConfig,
            latestSyncedBlock,
            latestIndexedBlock: statusBlock,
            latestBlock,
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

async function getLatestBlock(chainName: string) {
  const client = publicClients[chainName];
  if (client === undefined) throw new Error(`Client not found for chain ${chainName}`);

  const block = await client.getBlock({ blockTag: "latest" });

  const blockRef = {
    number: Number(block.number),
    timestamp: Number(block.timestamp),
  } satisfies BlockRef;

  return blockRef;
}

const blockCache = new Map<string, Map<number, BlockRef>>();

async function cachedGetBlockByNumber(chainName: string, blockNumber: number) {
  let cache = blockCache.get(chainName);
  if (!cache) {
    cache = new Map<number, BlockRef>();
    blockCache.set(chainName, cache);
  }

  const cachedBlockRef = cache.get(blockNumber);
  if (cachedBlockRef) return cachedBlockRef;

  const client = publicClients[chainName];
  if (client === undefined) throw new Error(`Client not found for chain ${chainName}`);

  const block = await client.getBlock({ blockNumber: BigInt(blockNumber) });

  const blockRef = {
    number: Number(block.number),
    timestamp: Number(block.timestamp),
  } satisfies BlockRef;

  cache.set(blockNumber, blockRef);

  return blockRef;
}

async function getChainConfig(chainName: string) {
  let minStartBlock: number | null = null;
  let maxEndBlock: number | null = null;

  for (const source of [
    ...Object.values(config.contracts ?? {}),
    ...Object.values(config.accounts ?? {}),
    ...Object.values(config.blocks ?? {}),
  ]) {
    const chain = (source as any).chain;
    let startBlock: any;
    let endBlock: any;

    if (typeof chain === "string" && chain === chainName) {
      startBlock = (source as any).startBlock;
      endBlock = (source as any).endBlock;
    } else if (typeof chain === "object" && chain?.[chainName]) {
      startBlock = chain[chainName].startBlock;
      endBlock = chain[chainName].endBlock;
    }

    if (typeof startBlock === "number") {
      if (minStartBlock === null) {
        minStartBlock = startBlock;
      } else {
        minStartBlock = Math.min(minStartBlock, startBlock);
      }
    }

    if (typeof endBlock === "number") {
      if (maxEndBlock === null) {
        maxEndBlock = endBlock;
      } else {
        maxEndBlock = Math.max(maxEndBlock, endBlock);
      }
    }
  }

  return {
    startBlock: minStartBlock ? await cachedGetBlockByNumber(chainName, minStartBlock) : null,
    endBlock: maxEndBlock ? await cachedGetBlockByNumber(chainName, maxEndBlock) : null,
  };
}

type PromLabels = Record<string, string>;
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

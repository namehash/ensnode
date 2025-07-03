import { getPublicClientChainIds } from "@/lib/ponder-helpers";
import { PonderStatus } from "@ensnode/ponder-metadata";
import { differenceInSeconds, fromUnixTime, getUnixTime } from "date-fns";
import { MiddlewareHandler } from "hono";
import { PublicClient } from "viem";

interface UptimeMonitoringArgs {
  /**
   * Allowed difference (in seconds) between the current timestamp and
   * the lowest last indexed block timestamp across all chains.
   **/
  realtimeIndexingGapThreshold: number;

  /** Query methods */
  query: {
    /** Fetches Ponder Status object for Ponder application */
    ponderStatus(): Promise<PonderStatus>;
  };

  /** Public clients for fetching data from each chain */
  publicClients: {
    [chainName: string]: PublicClient;
  };
}

/**
 * Creates a Hono Middleware object to be used for providing uptime monitoring
 * tools with information about the current ENSNode service availability.
 */
export function uptimeMonitoring({
  realtimeIndexingGapThreshold,
  query,
  publicClients,
}: UptimeMonitoringArgs): MiddlewareHandler {
  return async (ctx) => {
    const currentDate = new Date();
    const publicClientChainIds = getPublicClientChainIds(publicClients);
    const ponderStatus = await query.ponderStatus();

    const lowestLastIndexedBlockTimestamp = getLowestLastIndexedBlockTimestamp(
      publicClientChainIds,
      ponderStatus,
    );

    const lowestLastIndexedBlockDate = fromUnixTime(lowestLastIndexedBlockTimestamp);
    const currentRealtimeIndexingGap = differenceInSeconds(currentDate, lowestLastIndexedBlockDate);

    // realtime indexing gap threshold was exceeded
    if (currentRealtimeIndexingGap > realtimeIndexingGapThreshold) {
      // signal the ENSNode service is not available
      ctx.status(503);
    } else {
      // signal the ENSNode service is up and caught-up with realtime indexing
      ctx.status(200);
    }

    return ctx.json({
      gapThreshold: realtimeIndexingGapThreshold,
      currentGap: currentRealtimeIndexingGap,
    });
  };

  /**
   * Get the lowest timestamp across all last indexed blocks for every chain ID.
   *
   * @param chainIds
   * @param ponderStatus
   * @returns
   */
  function getLowestLastIndexedBlockTimestamp(
    chainIds: number[],
    ponderStatus: PonderStatus,
  ): number {
    let lastIndexedBlockTimestamps: number[] = [];

    for (const chainId of chainIds) {
      // mapping ponder status for current chain ID
      const ponderStatusForChain = Object.values(ponderStatus).find(
        (ponderStatusEntry) => ponderStatusEntry.id === chainId,
      );

      if (ponderStatusForChain) {
        const lastIndexedBlock = ponderStatusForChain.block;

        lastIndexedBlockTimestamps.push(lastIndexedBlock.timestamp);
      }
    }

    return Math.min(...lastIndexedBlockTimestamps);
  }
}

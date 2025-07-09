import { getOldestLastIndexedBlockDate } from "@/lib/ponder-helpers";
import type { Duration, RealtimeIndexingStatusMonitoring } from "@ensnode/ensnode-sdk";
import type { PonderStatus } from "@ensnode/ponder-metadata";
import { differenceInSeconds } from "date-fns";

interface GetRealtimeIndexingStatusArgs {
  /**
   * A date for which to calculate the realtime indexing lag.
   */
  currentDate: Date;

  /**
   * Maxim
   */
  maxAllowedIndexingLag: Duration;

  ponderStatus: PonderStatus;
}

/**
 * Get the current realtime indexing status based on the provided Ponder Status.
 */
export function getRealtimeIndexingStatus({
  currentDate,
  ponderStatus,
  maxAllowedIndexingLag,
}: GetRealtimeIndexingStatusArgs): RealtimeIndexingStatusMonitoring.RealtimeIndexingStatus {
  const oldestLastIndexedBlockDate = getOldestLastIndexedBlockDate(ponderStatus);

  const currentRealtimeIndexingLag = differenceInSeconds(currentDate, oldestLastIndexedBlockDate);

  const hasAchievedRequestedRealtimeIndexingGap =
    currentRealtimeIndexingLag <= maxAllowedIndexingLag;

  return {
    currentRealtimeIndexingLag,
    hasAchievedRequestedRealtimeIndexingGap,
    oldestLastIndexedBlockDate,
  } satisfies RealtimeIndexingStatusMonitoring.RealtimeIndexingStatus;
}

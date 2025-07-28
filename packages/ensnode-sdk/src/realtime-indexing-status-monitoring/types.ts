import { Duration } from "../utils";

export namespace RealtimeIndexingStatusMonitoring {
  export interface RealtimeIndexingStatus {
    /**
     * Describes the current lag between
     * the date of the last known block for a chain and
     * the date of the last indexed block on that chain.
     *
     * Must be a non-negative integer.
     */
    currentRealtimeIndexingLag: Duration;

    /**
     * Tells if the requested realtime indexing lag was achieved.
     */
    hasAchievedRequestedRealtimeIndexingGap: boolean;

    /**
     * Date of the oldest last indexed block across all chains.
     */
    oldestLastIndexedBlockDate: Date;
  }

  /**
   * Request object.
   */
  export interface Request {
    maxAllowedIndexingLag: Duration;
  }

  /**
   * Response object.
   */
  export interface Response {
    /**
     * Describes the acceptable lag between
     * the date of the last known block for a chain and
     * the date of the last indexed block on that chain.
     *
     * Must be a non-negative integer.
     */
    maxAllowedIndexingLag: Duration;

    /**
     * Describes the current lag between
     * the date of the last known block for a chain and
     * the date of the last indexed block on that chain.
     *
     * Must be a non-negative integer.
     */
    currentRealtimeIndexingLag: Duration;

    /**
     * Unix timestamp of the oldest last indexed block across all chains.
     *
     * Must be a non-negative integer.
     */
    oldestLastIndexedBlockTimestamp: number;
  }
}

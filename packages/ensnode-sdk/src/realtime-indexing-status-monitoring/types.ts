export namespace RealtimeIndexingStatusMonitoring {
  /**
   * Represents a Unix Timestamp.
   *
   * Must be a non-negative integer.
   */
  export type UnixTimestamp = number;

  /**
   * Represents a span of time in seconds.
   *
   * Must be a non-negative integer.
   */
  export type TimeSpanInSeconds = number;

  export interface RealtimeIndexingStatus {
    /**
     * Describes the current lag between
     * the date of the last known block for a chain and
     * the date of the last indexed block on that chain.
     *
     * Must be a non-negative integer.
     */
    currentRealtimeIndexingLag: TimeSpanInSeconds;

    /**
     *
     *
     * Must be a non-negative integer.
     */
    oldestLastIndexedBlockTimestamp: UnixTimestamp;
  }

  /**
   * Request object.
   */
  export interface Request {
    maxAllowedIndexingLag: string | undefined;
  }

  /**
   * Response object.
   */
  export interface Response extends RealtimeIndexingStatus {
    /**
     * Describes the acceptable lag between
     * the date of the last known block for a chain and
     * the date of the last indexed block on that chain.
     *
     * Must be a non-negative integer.
     */
    maxAllowedIndexingLag: TimeSpanInSeconds;
  }
}

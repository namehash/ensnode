import type { RealtimeIndexingStatusProjection } from "../../ensindexer";
import {
  type AbstractResultOk,
  type Duration,
  ResultCodes,
  type ResultInsufficientIndexingProgress,
  type ResultInternalServerError,
  type ResultInvalidRequest,
  type ResultServiceUnavailable,
  type UnixTimestamp,
} from "../../shared";

/**
 * Data included with a successful "Am I Realtime?" result.
 */
export interface ResultOkAmIRealtimeData {
  /**
   * The client's requested max worst-case distance from the current "tip" of
   * all indexed chains.
   */
  requestedMaxWorstCaseDistance: Duration;

  /**
   * Worst-case distance in seconds.
   *
   * See {@link RealtimeIndexingStatusProjection.worstCaseDistance} for details.
   *
   * Guarantees:
   * - `worstCaseDistance` is always less than or equal to `requestedMaxWorstCaseDistance`.
   */
  worstCaseDistance: Duration;

  /**
   * The timestamp of the "slowest" latest indexed block timestamp across all indexed chains.
   *
   * See {@link RealtimeIndexingStatusProjection.slowestChainIndexingCursor} for details.
   */
  slowestChainIndexingCursor: UnixTimestamp;

  /**
   * The server's current time.
   *
   * Guarantees:
   * - `serverNow` is always greater than or equal to `slowestChainIndexingCursor`.
   * - `serverNow - slowestChainIndexingCursor` always equals to `worstCaseDistance`.
   */
  serverNow: UnixTimestamp;
}

/**
 * Successful result for "Am I Realtime?" API requests.
 */
export type ResultOkAmIRealtime = AbstractResultOk<ResultOkAmIRealtimeData>;

export function buildResultOkAmIRealtime(data: ResultOkAmIRealtimeData): ResultOkAmIRealtime {
  return {
    resultCode: ResultCodes.Ok,
    data,
  };
}

/**
 * The operation result for "Am I Realtime?" API requests.
 *
 * Use the `resultCode` field to determine the specific type interpretation
 * at runtime.
 */
export type AmIRealtimeServerResult =
  | ResultOkAmIRealtime
  | ResultInvalidRequest
  | ResultInternalServerError // used when Indexing Status middleware was not correctly applied
  | ResultServiceUnavailable // used when Indexing Status couldn't be determined yet
  | ResultInsufficientIndexingProgress; // used when Indexing Status could be determined but indexing progress was insufficient

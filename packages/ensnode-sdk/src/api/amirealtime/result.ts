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
 * Successful result data for "Am I Realtime?" API requests.
 */
export interface AmIRealtimeResultOkData {
  /**
   * Represents the maximum worst-case distance from the current "tip" of
   * all indexed chains. `maxWorstCaseDistance` is defined by the client
   * making the request.
   */
  maxWorstCaseDistance: Duration;

  /**
   * Worst-case distance in seconds.
   *
   * See {@link RealtimeIndexingStatusProjection.worstCaseDistance} for details.
   *
   * Guarantees:
   * - `worstCaseDistance` is always less than or equal to `maxWorstCaseDistance`.
   */
  worstCaseDistance: Duration;

  /**
   * The timestamp of the "slowest" latest indexed block timestamp across all indexed chains.
   *
   * See {@link RealtimeIndexingStatusProjection.slowestChainIndexingCursor} for details.
   */
  slowestChainIndexingCursor: UnixTimestamp;
}

/**
 * Successful result for "Am I Realtime?" API requests.
 */
export type AmIRealtimeResultOk = AbstractResultOk<AmIRealtimeResultOkData>;

export function buildAmIRealtimeResultOk(data: AmIRealtimeResultOkData): AmIRealtimeResultOk {
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
  | AmIRealtimeResultOk
  | ResultInvalidRequest
  | ResultInternalServerError
  | ResultServiceUnavailable
  | ResultInsufficientIndexingProgress;

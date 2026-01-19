import type { RealtimeIndexingStatusProjection } from "../../ensindexer";
import type {
  Duration,
  ResultInternalServerError,
  ResultInvalidRequest,
  ResultServerOk,
  ResultServiceUnavailable,
  UnixTimestamp,
} from "../../shared";

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
 * The operation result for "Am I Realtime?" API requests.
 *
 * Use the `resultCode` field to determine the specific type interpretation
 * at runtime.
 */
export type AmIRealtimeResult =
  | ResultServerOk<AmIRealtimeResultOkData>
  | ResultInvalidRequest
  | ResultInternalServerError
  | ResultServiceUnavailable;

import type { UnixTimestamp } from "../../shared";
import type {
  ResultCode,
  ResultCodeClientError,
  ResultCodeServerError,
  ResultCodes,
} from "./result-code";

/************************************************************
 * Abstract results
 *
 * These are base interfaces that should be extended to
 * create concrete result types.
 ************************************************************/

/**
 * Abstract representation of any result.
 */
export interface AbstractResult<TResultCode extends ResultCode> {
  /**
   * The classification of the result.
   */
  resultCode: TResultCode;
}

/**
 * Abstract representation of a successful result.
 */
export interface AbstractResultOk<TDataType> extends AbstractResult<typeof ResultCodes.Ok> {
  /**
   * The data of the result.
   */
  data: TDataType;
}

/**
 * Abstract representation of a successful result with data guaranteed to be
 * at least up to a certain timestamp.
 */
export interface AbstractResultOkTimestamped<TDataType> extends AbstractResultOk<TDataType> {
  /**
   * The minimum indexing cursor timestamp that the data is
   * guaranteed to be accurate as of.
   *
   * Guarantees:
   * - `data` is guaranteed to be at least up to `minIndexingCursor`, but
   *   may be indexed with timestamps higher than `minIndexingCursor`.
   *   - This guarantee may temporarily be violated during a chain reorg.
   *     ENSNode automatically recovers from chain reorgs, but during one
   *     the `minIndexingCursor` may theoretically be some seconds ahead of
   *     the true state of indexed data.
   */
  minIndexingCursor: UnixTimestamp;
}

/**
 * Abstract representation of an error result.
 */
export interface AbstractResultError<
  TResultCode extends ResultCodeServerError | ResultCodeClientError,
  TDataType = undefined,
> extends AbstractResult<TResultCode> {
  /**
   * A description of the error.
   */
  errorMessage: string;

  /**
   * Identifies if it may be relevant to retry the operation.
   *
   * If `false`, retrying the operation is unlikely to be helpful.
   */
  suggestRetry: boolean;

  /**
   * Optional data associated with the error.
   */
  data?: TDataType;
}

/**
 * Abstract representation of a loading result.
 */
export interface AbstractResultLoading<TDataType = undefined>
  extends AbstractResult<typeof ResultCodes.Loading> {
  /**
   * Optional data associated with the loading operation.
   */
  data?: TDataType;
}

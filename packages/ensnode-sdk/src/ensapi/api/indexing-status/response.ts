import type { RealtimeIndexingStatusProjection } from "../../../indexing-status/realtime-indexing-status-projection";
import type { EnsApiPublicConfig } from "../../config";

/**
 * A status code for indexing status responses.
 */
export const EnsApiIndexingStatusResponseCodes = {
  /**
   * Represents that the indexing status is available.
   */
  Ok: "ok",

  /**
   * Represents that the indexing status is unavailable.
   */
  Error: "error",
} as const;

/**
 * A status code for indexing status responses.
 *
 * @deprecated Use {@link EnsApiIndexingStatusResponseCodes} instead.
 */
export const IndexingStatusResponseCodes = EnsApiIndexingStatusResponseCodes;

/**
 * The derived string union of possible {@link EnsApiIndexingStatusResponseCodes}.
 */
export type EnsApiIndexingStatusResponseCode =
  (typeof EnsApiIndexingStatusResponseCodes)[keyof typeof EnsApiIndexingStatusResponseCodes];

/**
 * The derived string union of possible {@link EnsApiIndexingStatusResponseCodes}.
 *
 * @deprecated Use {@link EnsApiIndexingStatusResponseCode} instead.
 */
export type IndexingStatusResponseCode = EnsApiIndexingStatusResponseCode;

/**
 * An indexing status response when the indexing status is available.
 */
export type EnsApiIndexingStatusResponseOk = {
  responseCode: typeof EnsApiIndexingStatusResponseCodes.Ok;
  realtimeProjection: RealtimeIndexingStatusProjection;
  config: EnsApiPublicConfig;
};

/**
 * An indexing status response when the indexing status is available.
 *
 * @deprecated Use {@link EnsApiIndexingStatusResponseOk} instead.
 */
export type IndexingStatusResponseOk = EnsApiIndexingStatusResponseOk;

/**
 * An indexing status response when the indexing status is unavailable.
 */
export type EnsApiIndexingStatusResponseError = {
  responseCode: typeof EnsApiIndexingStatusResponseCodes.Error;
};

/**
 * An indexing status response when the indexing status is unavailable.
 *
 * @deprecated Use {@link EnsApiIndexingStatusResponseError} instead.
 */
export type IndexingStatusResponseError = EnsApiIndexingStatusResponseError;

/**
 * Indexing status response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type EnsApiIndexingStatusResponse =
  | EnsApiIndexingStatusResponseOk
  | EnsApiIndexingStatusResponseError;

/**
 * Indexing status response.
 *
 * @deprecated Use {@link EnsApiIndexingStatusResponse} instead.
 */
export type IndexingStatusResponse = EnsApiIndexingStatusResponse;

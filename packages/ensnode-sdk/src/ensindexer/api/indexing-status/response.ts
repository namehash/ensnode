import type { RealtimeIndexingStatusProjection } from "../../../indexing-status/realtime-indexing-status-projection";

/**
 * A status code for ENSIndexer indexing status responses.
 */
export const EnsIndexerIndexingStatusResponseCodes = {
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
 * The derived string union of possible {@link EnsIndexerIndexingStatusResponseCodes}.
 */
export type EnsIndexerIndexingStatusResponseCode =
  (typeof EnsIndexerIndexingStatusResponseCodes)[keyof typeof EnsIndexerIndexingStatusResponseCodes];

/**
 * An ENSIndexer indexing status response when the indexing status is available.
 */
export type EnsIndexerIndexingStatusResponseOk = {
  responseCode: typeof EnsIndexerIndexingStatusResponseCodes.Ok;
  realtimeProjection: RealtimeIndexingStatusProjection;
};

/**
 * An ENSIndexer indexing status response when the indexing status is unavailable.
 */
export type EnsIndexerIndexingStatusResponseError = {
  responseCode: typeof EnsIndexerIndexingStatusResponseCodes.Error;
};

/**
 * ENSIndexer indexing status response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type EnsIndexerIndexingStatusResponse =
  | EnsIndexerIndexingStatusResponseOk
  | EnsIndexerIndexingStatusResponseError;

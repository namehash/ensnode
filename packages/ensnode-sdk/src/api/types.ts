import type { ENSIndexerPublicConfig, RealtimeIndexingStatusProjection } from "../ensindexer";
import type {
  ForwardResolutionArgs,
  MultichainPrimaryNameResolutionArgs,
  MultichainPrimaryNameResolutionResult,
  ResolverRecordsResponse,
  ResolverRecordsSelection,
  ReverseResolutionArgs,
  ReverseResolutionResult,
} from "../resolution";
import type { ProtocolTrace } from "../tracing";

/**
 * API Error Response Type
 */
export interface ErrorResponse {
  message: string;
  details?: unknown; // subject to change
}

export interface TraceableRequest {
  trace?: boolean;
}

export interface TraceableResponse {
  trace?: ProtocolTrace;
}

export interface AcceleratableRequest {
  accelerate?: boolean;
}

export interface AcceleratableResponse {
  accelerationAttempted: boolean;
}

/**
 * Resolve Records Request Type
 */
export interface ResolveRecordsRequest<SELECTION extends ResolverRecordsSelection>
  extends ForwardResolutionArgs<SELECTION>,
    AcceleratableRequest,
    TraceableRequest {}

/**
 * Resolve Records Response Type
 */
export interface ResolveRecordsResponse<SELECTION extends ResolverRecordsSelection>
  extends AcceleratableResponse,
    TraceableResponse {
  records: ResolverRecordsResponse<SELECTION>;
}

/**
 * Resolve Primary Name Request Type
 */
export interface ResolvePrimaryNameRequest
  extends ReverseResolutionArgs,
    AcceleratableRequest,
    TraceableRequest {}

/**
 * Resolve Primary Name Response Type
 */
export interface ResolvePrimaryNameResponse extends AcceleratableResponse, TraceableResponse {
  name: ReverseResolutionResult;
}

export interface ResolvePrimaryNamesRequest
  extends MultichainPrimaryNameResolutionArgs,
    AcceleratableRequest,
    TraceableRequest {}

export interface ResolvePrimaryNamesResponse extends AcceleratableResponse, TraceableResponse {
  names: MultichainPrimaryNameResolutionResult;
}

/**
 * ENSIndexer Public Config Response
 */
export type ConfigResponse = ENSIndexerPublicConfig;

/**
 * Represents a request to Indexing Status API.
 */
export type IndexingStatusRequest = {};

/**
 * A status code for generating an indexing status response.
 */
export const IndexingStatusResponseCodes = {
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
 * The derived string union of possible {@link IndexingStatusResponseCodes}.
 */
export type IndexingStatusResponseCode =
  (typeof IndexingStatusResponseCodes)[keyof typeof IndexingStatusResponseCodes];

/**
 * An indexing status response when the indexing status is available.
 */
export type IndexingStatusResponseOk = {
  responseCode: typeof IndexingStatusResponseCodes.Ok;
  realtimeProjection: RealtimeIndexingStatusProjection;
};

/**
 * An indexing status response when the indexing status is unavailable.
 */
export type IndexingStatusResponseError = {
  responseCode: typeof IndexingStatusResponseCodes.Error;
};

/**
 * Indexing status response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type IndexingStatusResponse = IndexingStatusResponseOk | IndexingStatusResponseError;

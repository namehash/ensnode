import type { ENSIndexerOverallIndexingStatus, ENSIndexerPublicConfig } from "../ensindexer";
import type {
  ForwardResolutionArgs,
  MultichainPrimaryNameResolutionArgs,
  MultichainPrimaryNameResolutionResult,
  ResolverRecordsResponse,
  ResolverRecordsSelection,
  ReverseResolutionArgs,
  ReverseResolutionResult,
} from "../resolution";
import type { Duration } from "../shared";
import type { ProtocolTrace } from "../tracing";

/**
 * API Error Response Type
 */
export interface ErrorResponse {
  message: string;
  details?: unknown; // subject to change
}

interface TraceableRequest {
  trace?: boolean;
}

interface TraceableResponse {
  trace?: ProtocolTrace;
}

export interface AcceleratableRequest {
  accelerate?: boolean;
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
  extends TraceableResponse {
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
export interface ResolvePrimaryNameResponse extends TraceableResponse {
  name: ReverseResolutionResult;
}

export interface ResolvePrimaryNamesRequest
  extends MultichainPrimaryNameResolutionArgs,
    AcceleratableRequest,
    TraceableRequest {}

export interface ResolvePrimaryNamesResponse extends TraceableResponse {
  names: MultichainPrimaryNameResolutionResult;
}

/**
 * ENSIndexer Public Config Response
 */
export type ConfigResponse = ENSIndexerPublicConfig;

/**
 * ENSIndexer Overall Indexing Status Request
 */
export interface IndexingStatusRequest {
  /**
   * Max Realtime Distance (optional)
   *
   * A duration value in seconds, representing the max allowed distance
   * between the latest indexed block of each chain and the “tip” of
   * all indexed chains. Setting this parameter influences the HTTP response
   * code as follows:
   * - Success (200 OK): The latest indexed block of each chain
   *   is within the requested distance from realtime.
   * - Service Unavailable (503): The latest indexed block of each chain
   *   is NOT within the requested distance from realtime.
   */
  maxRealtimeDistance?: Duration;
}

/**
 * ENSIndexer Overall Indexing Status Response
 */
export type IndexingStatusResponse = ENSIndexerOverallIndexingStatus;

/**
 * ENSIndexer Overall Indexing Status Response Codes
 *
 * Define a custom response code for known responses.
 */
export const IndexingStatusResponseCodes = {
  IndexerError: 512,
  RequestedDistanceNotAchievedError: 513,
} as const;

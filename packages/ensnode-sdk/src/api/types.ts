import type {
  ForwardResolutionArgs,
  ResolverRecordsResponse,
  ResolverRecordsSelection,
  ReverseResolutionArgs,
  ReverseResolutionRecordsResponse,
} from "../resolution";
import type { ProtocolTrace } from "../tracing";

/**
 * API Error Response Type
 */
export interface ErrorResponse {
  error: string;
  // TODO: the following?
  // code?: string;
  // details?: Record<string, unknown>;
}

interface TraceableRequest {
  trace?: boolean;
}

interface TraceableResponse {
  trace?: ProtocolTrace;
}

/**
 * Forward Resolution Request Type
 */
export interface ForwardResolutionRequest<SELECTION extends ResolverRecordsSelection>
  extends ForwardResolutionArgs<SELECTION>,
    TraceableRequest {}

/**
 * Forward Resolution Response Type
 */
export interface ForwardResolutionResponse<SELECTION extends ResolverRecordsSelection>
  extends TraceableResponse {
  records: ResolverRecordsResponse<SELECTION>;
}

/**
 * Reverse Resolution Request Type
 */
export interface ReverseResolutionRequest extends ReverseResolutionArgs, TraceableRequest {}

/**
 * Reverse Resolution Response Type
 */
export interface ReverseResolutionResponse extends TraceableResponse {
  records: ReverseResolutionRecordsResponse;
}

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
 * Resolve Records Request Type
 */
export interface ResolveRecordsRequest<SELECTION extends ResolverRecordsSelection>
  extends ForwardResolutionArgs<SELECTION>,
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
export interface ResolvePrimaryNameRequest extends ReverseResolutionArgs, TraceableRequest {}

/**
 * Resolve Primary Name Response Type
 */
export interface ResolvePrimaryNameResponse extends TraceableResponse {
  records: ReverseResolutionRecordsResponse;
}

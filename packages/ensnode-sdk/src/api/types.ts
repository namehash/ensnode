import type {
  ResolverRecordsResponse,
  ResolverRecordsSelection,
  ReverseResolutionRecordsResponse,
} from "../resolution";
import type { ProtocolTrace } from "../tracing";

/**
 * API error response
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

interface TraceableResponse {
  trace?: ProtocolTrace;
}

/**
 * Forward Resolution Response
 */
export interface ForwardResolutionResponse<SELECTION extends ResolverRecordsSelection>
  extends TraceableResponse {
  records: ResolverRecordsResponse<SELECTION>;
}

/**
 * Reverse Resolution Response
 */
export interface ReverseResolutionResponse extends TraceableResponse {
  records: ReverseResolutionRecordsResponse;
}

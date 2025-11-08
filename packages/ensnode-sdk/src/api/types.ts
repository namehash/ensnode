import type z from "zod/v4";

import type { Node } from "../ens";
import type { ENSApiPublicConfig } from "../ensapi";
import type { RealtimeIndexingStatusProjection } from "../ensindexer";
import type { RegistrarAction, RegistrationLifecycleDomain } from "../registrars";
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
import type { ErrorResponseSchema } from "./zod-schemas";

/**
 * API Error Response Type
 */
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

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
  accelerationRequested: boolean;
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
export type ConfigResponse = ENSApiPublicConfig;

/**
 * Represents a request to Indexing Status API.
 */
export type IndexingStatusRequest = {};

/**
 * A status code for indexing status responses.
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

/**
 * Registrar Actions response
 */

/**
 * Represents a request to Registrar Actions API.
 */
export type RegistrarActionsRequest = {};

/**
 * A status code for indexing status responses.
 */
export const RegistrarActionsResponseCodes = {
  /**
   * Represents that Registrar Actions are available.
   */
  Ok: "ok",

  /**
   * Represents that Registrar Actions are unavailable.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link RegistrarActionsResponseCodes}.
 */
export type RegistrarActionsResponseCode =
  (typeof RegistrarActionsResponseCodes)[keyof typeof RegistrarActionsResponseCodes];

/**
 * A response when Registrar Actions are available.
 */
export type RegistrarActionsResponseOk = {
  responseCode: typeof RegistrarActionsResponseCodes.Ok;
  registrarActions: RegistrarAction[];
  registrationLifecycleDomains: Record<Node, RegistrationLifecycleDomain>;
};

/**
 * A response when Registrar Actions are unavailable.
 */
export type RegistrarActionsResponseError = {
  responseCode: typeof IndexingStatusResponseCodes.Error;
};

/**
 * Registrar Actions response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type RegistrarActionsResponse = RegistrarActionsResponseOk | RegistrarActionsResponseError;

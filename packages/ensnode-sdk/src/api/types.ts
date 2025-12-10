import type { z } from "zod/v4";

import type { InterpretedName, Node } from "../ens";
import type { ENSApiPublicConfig } from "../ensapi";
import type { RealtimeIndexingStatusProjection } from "../ensindexer";
import type { RegistrarAction } from "../registrars";
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
import type { ErrorResponseSchema } from "./shared/errors/zod-schemas";

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
 * Records Filters: Comparators
 */
export const RegistrarActionsFilterComparators = {
  EqualsTo: "eq",
} as const;

export type RegistrarActionsFilterComparator =
  (typeof RegistrarActionsFilterComparators)[keyof typeof RegistrarActionsFilterComparators];

/**
 * Records Filters: Fields
 */
export const RegistrarActionsFilterFields = {
  SubregistryNode: "registrationLifecycle.subregistry.node",
} as const;

export type RegistrarActionsFilterField =
  (typeof RegistrarActionsFilterFields)[keyof typeof RegistrarActionsFilterFields];

export type RegistrarActionsFilter = {
  field: typeof RegistrarActionsFilterFields.SubregistryNode;
  comparator: typeof RegistrarActionsFilterComparators.EqualsTo;
  value: Node;
};

/**
 * Records Orders
 */
export const RegistrarActionsOrders = {
  LatestRegistrarActions: "orderBy[timestamp]=desc",
} as const;

export type RegistrarActionsOrder =
  (typeof RegistrarActionsOrders)[keyof typeof RegistrarActionsOrders];

/**
 * Represents a request to Registrar Actions API.
 */
export type RegistrarActionsRequest = {
  filter?: RegistrarActionsFilter;

  /**
   * Order applied while generating results.
   */
  order?: RegistrarActionsOrder;

  /**
   * Limit the count of items per page to selected count of records.
   *
   * Guaranteed to be a positive integer (if defined).
   */
  itemsPerPage?: number;
};

/**
 * A status code for Registrar Actions API responses.
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
 * "Logical registrar action" with its associated name.
 */
export interface NamedRegistrarAction {
  action: RegistrarAction;

  /**
   * Name
   *
   * FQDN of the name associated with `action`.
   *
   * Guarantees:
   * - `namehash(name)` is always `action.registrationLifecycle.node`.
   */
  name: InterpretedName;
}

/**
 * A response when Registrar Actions are available.
 */
export type RegistrarActionsResponseOk = {
  responseCode: typeof RegistrarActionsResponseCodes.Ok;
  registrarActions: NamedRegistrarAction[];
};

/**
 * A response when Registrar Actions are unavailable.
 */
export interface RegistrarActionsResponseError {
  responseCode: typeof IndexingStatusResponseCodes.Error;
  error: ErrorResponse;
}

/**
 * Registrar Actions response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type RegistrarActionsResponse = RegistrarActionsResponseOk | RegistrarActionsResponseError;

import type { QueryObserverOptions } from "@tanstack/react-query";

import type {
  AcceleratableRequest,
  ENSNamespaceId,
  EnsApiClientOptions,
  ResolvePrimaryNameRequest,
  ResolvePrimaryNameResponse,
  ResolvePrimaryNamesRequest,
  ResolvePrimaryNamesResponse,
  ResolveRecordsRequest,
  ResolveRecordsResponse,
  ResolverRecordsSelection,
  UnresolvedIdentity,
} from "@ensnode/ensnode-sdk";

/**
 * Configuration options for the ENSNode provider
 */
export interface EnsApiProviderOptions {
  /** The ENSApi client configuration */
  client: EnsApiClientOptions;
}

/**
 * Base query parameters that can be passed to hooks
 */
export interface QueryParameter<TData = unknown, TError = Error> {
  query?: Partial<QueryObserverOptions<TData, TError, TData, TData, readonly unknown[]>>;
}

/**
 * Configuration parameter for hooks that need access to config
 */
export interface WithEnsApiProviderOptions<
  TOptions extends EnsApiProviderOptions = EnsApiProviderOptions,
> {
  options?: TOptions | undefined;
}

/**
 * Parameters for the useRecords hook.
 *
 * If `name` is null, the query will not be executed.
 */
export interface UseRecordsParameters<SELECTION extends ResolverRecordsSelection>
  extends Omit<ResolveRecordsRequest<SELECTION>, "name">,
    QueryParameter<ResolveRecordsResponse<SELECTION>> {
  name: ResolveRecordsRequest<SELECTION>["name"] | null;
}

/**
 * Parameters for the usePrimaryName hook.
 *
 * If `address` is null, the query will not be executed.
 */
export interface UsePrimaryNameParameters
  extends Omit<ResolvePrimaryNameRequest, "address">,
    QueryParameter<ResolvePrimaryNameResponse> {
  address: ResolvePrimaryNameRequest["address"] | null;
}

/**
 * Parameters for the usePrimaryNames hook.
 *
 * If `address` is null, the query will not be executed.
 */
export interface UsePrimaryNamesParameters
  extends Omit<ResolvePrimaryNamesRequest, "address">,
    QueryParameter<ResolvePrimaryNamesResponse> {
  address: ResolvePrimaryNamesRequest["address"] | null;
}

/**
 * Parameters for the useResolvedIdentity hook.
 */
export interface UseResolvedIdentityParameters
  extends QueryParameter<ResolvePrimaryNameResponse>,
    AcceleratableRequest {
  identity: UnresolvedIdentity;
  namespace?: ENSNamespaceId;
}

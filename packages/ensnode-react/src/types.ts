import type {
  ClientOptions,
  ResolveRecordsRequest,
  ResolveRecordsResponse,
  ResolverRecordsSelection,
  ResolvePrimaryNameRequest,
  ResolvePrimaryNameResponse,
} from "@ensnode/ensnode-sdk";

import type { QueryObserverOptions } from "@tanstack/react-query";

/**
 * Configuration options for the ENSNode provider
 */
export interface ENSNodeConfig {
  /** The ENSNode API client configuration */
  client: ClientOptions;
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
export interface ConfigParameter<TConfig extends ENSNodeConfig = ENSNodeConfig> {
  config?: TConfig | undefined;
}

/**
 * Parameters for the useRecords hook
 */
export interface UseRecordsParameters<SELECTION extends ResolverRecordsSelection>
  extends ResolveRecordsRequest<SELECTION>,
    QueryParameter<ResolveRecordsResponse<SELECTION>> {}

/**
 * Parameters for the usePrimaryName hook
 */
export interface UsePrimaryNameParameters
  extends ResolvePrimaryNameRequest,
    QueryParameter<ResolvePrimaryNameResponse> {}

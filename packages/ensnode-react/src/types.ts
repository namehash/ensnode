import type {
  ClientOptions,
  ResolvePrimaryNameRequest,
  ResolvePrimaryNameResponse,
  ResolveRecordsRequest,
  ResolveRecordsResponse,
  ResolverRecordsSelection,
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
 * * If `address` is null, the query will not be executed.
 */
export interface UsePrimaryNameParameters
  extends Omit<ResolvePrimaryNameRequest, "address">,
    QueryParameter<ResolvePrimaryNameResponse> {
  address: ResolvePrimaryNameRequest["address"] | null;
}

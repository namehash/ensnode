import type { QueryObserverOptions } from "@tanstack/react-query";

import type {
  ClientOptions,
  ResolvePrimaryNameRequest,
  ResolvePrimaryNameResponse,
  ResolvePrimaryNamesRequest,
  ResolvePrimaryNamesResponse,
  ResolveRecordsRequest,
  ResolveRecordsResponse,
  ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";

/**
 * Configuration options for the ENSNode provider
 */
export interface ENSNodeSDKConfig {
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
export interface WithSDKConfigParameter<TConfig extends ENSNodeSDKConfig = ENSNodeSDKConfig> {
  config?: TConfig | undefined;
}

/**
 * Parameters for the useRecords hook.
 */
export interface UseRecordsParameters<SELECTION extends ResolverRecordsSelection>
  extends Omit<ResolveRecordsRequest<SELECTION>, "name">,
    QueryParameter<ResolveRecordsResponse<SELECTION>> {
  /**
   * If null, the query will not be executed.
   */
  name: ResolveRecordsRequest<SELECTION>["name"] | null;
}

/**
 * Parameters for the usePrimaryName hook.
 */
export interface UsePrimaryNameParameters
  extends Omit<ResolvePrimaryNameRequest, "address">,
    QueryParameter<ResolvePrimaryNameResponse> {
  /**
   * If null, the query will not be executed.
   */
  address: ResolvePrimaryNameRequest["address"] | null;
}

/**
 * Parameters for the usePrimaryNames hook.
 */
export interface UsePrimaryNamesParameters
  extends Omit<ResolvePrimaryNamesRequest, "address">,
    QueryParameter<ResolvePrimaryNamesResponse> {
  /**
   * If null, the query will not be executed.
   */
  address: ResolvePrimaryNamesRequest["address"] | null;
}

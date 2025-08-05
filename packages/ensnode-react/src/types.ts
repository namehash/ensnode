import type {
  ClientOptions,
  ForwardResolutionRequest,
  ForwardResolutionResponse,
  ResolverRecordsSelection,
  ReverseResolutionRequest,
  ReverseResolutionResponse,
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
 * Parameters for the useForwardResolution hook
 */
export interface UseForwardResolutionParameters<SELECTION extends ResolverRecordsSelection>
  extends ForwardResolutionRequest<SELECTION>,
    QueryParameter<ForwardResolutionResponse<SELECTION>> {}

/**
 * Parameters for the useReverseResolution hook
 */
export interface UseReverseResolutionParameters
  extends ReverseResolutionRequest,
    QueryParameter<ReverseResolutionResponse> {}

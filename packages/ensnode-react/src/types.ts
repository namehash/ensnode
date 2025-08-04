import type { ClientOptions } from "@ensnode/ensnode-sdk";
import type { QueryObserverOptions, UseQueryResult } from "@tanstack/react-query";

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
 * Parameters for the useResolveName hook
 */
export interface UseResolveNameParameters
  extends QueryParameter<import("@ensnode/ensnode-sdk").ForwardResponse> {
  /** The ENS name to resolve */
  name?: string;
  /** Selection criteria for what records to resolve */
  selection?: import("@ensnode/ensnode-sdk").ForwardResolutionSelection;
}

/**
 * Parameters for the useResolveAddress hook
 */
export interface UseResolveAddressParameters
  extends QueryParameter<import("@ensnode/ensnode-sdk").ReverseResponse> {
  /** The address to resolve */
  address?: string;
  /** Optional chain ID for multichain resolution */
  chainId?: number;
}

/**
 * Return type for query hooks (re-export of TanStack Query's UseQueryResult)
 */
export type UseQueryReturnType<TData = unknown, TError = Error> = UseQueryResult<TData, TError>;

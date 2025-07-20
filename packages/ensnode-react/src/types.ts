import type { Resolution } from "@ensnode/ensnode-sdk";
import type { QueryObserverOptions } from "@tanstack/react-query";

/**
 * Configuration options for the ENSNode provider
 */
export interface ENSNodeConfig {
  /** The resolution API client configuration */
  client: Resolution.ClientOptions;
}

/**
 * Base query parameters that can be passed to hooks
 */
export interface QueryParameter<TData = unknown, TError = Error> {
  query?: Partial<
    QueryObserverOptions<TData, TError, TData, TData, readonly unknown[]>
  >;
}

/**
 * Configuration parameter for hooks that need access to config
 */
export interface ConfigParameter<
  TConfig extends ENSNodeConfig = ENSNodeConfig
> {
  config?: TConfig | undefined;
}

/**
 * Parameters for the useName hook
 */
export interface UseNameParameters
  extends QueryParameter<Resolution.ForwardResponse> {
  /** The ENS name to resolve */
  name?: string;
  /** Selection criteria for what records to resolve */
  selection?: Resolution.RecordsSelection;
}

/**
 * Parameters for the useAddress hook
 */
export interface UseAddressParameters
  extends QueryParameter<Resolution.ReverseResponse> {
  /** The address to resolve */
  address?: string;
  /** Optional chain ID for multichain resolution */
  chainId?: number;
}

/**
 * Return type for query hooks
 */
export type UseQueryReturnType<TData = unknown, TError = Error> = {
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isPending: boolean;
  refetch: () => void;
};

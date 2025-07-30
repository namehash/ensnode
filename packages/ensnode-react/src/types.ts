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
 * Represents a connection to an ENSNode endpoint
 */
export interface Connection {
  /** The URL of the ENSNode endpoint */
  url: string;
  /** Whether this is a default/built-in connection */
  isDefault: boolean;
}

/**
 * Variables for adding a new connection
 */
export interface AddConnectionVariables {
  /** The URL to add as a new connection */
  url: string;
}

/**
 * Variables for removing a connection
 */
export interface RemoveConnectionVariables {
  /** The URL of the connection to remove */
  url: string;
}

/**
 * Parameters for the useConnections hook
 */
export interface UseConnectionsParameters {
  /** The currently selected ENSNode URL */
  selectedUrl?: string | URL;
  /** List of default connection URLs */
  defaultUrls?: Array<string | URL>;
  /** Storage key for persisting connections */
  storageKey?: string;
}

/**
 * Return type for the useConnections hook
 */
export interface UseConnectionsReturnType {
  /** List of all available connections */
  connections: Connection[];
  /** Whether connections are being loaded */
  isLoading: boolean;
  /** Currently selected connection URL */
  currentUrl: string;
  /** Function to change the current connection */
  setCurrentUrl: (url: string) => void;
  /** Mutation to add a new connection */
  addConnection: {
    mutate: (variables: AddConnectionVariables) => void;
    mutateAsync: (variables: AddConnectionVariables) => Promise<{ url: string }>;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    reset: () => void;
  };
  /** Mutation to remove a connection */
  removeConnection: {
    mutate: (variables: RemoveConnectionVariables) => void;
    mutateAsync: (variables: RemoveConnectionVariables) => Promise<{ url: string }>;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    reset: () => void;
  };
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
  selection?: import("@ensnode/ensnode-sdk").RecordsSelection;
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

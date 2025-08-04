"use client";

import { ENSNodeClient } from "@ensnode/ensnode-sdk";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { createElement, useCallback, useMemo, useState } from "react";

import { ConnectionContext, type ConnectionContextState, ENSNodeContext } from "./context";
import type { ENSNodeConfig } from "./types";

export interface ENSNodeProviderProps {
  /** ENSNode configuration */
  config: ENSNodeConfig;
  /**
   * Optional QueryClient instance. If provided, you must wrap your app with QueryClientProvider yourself.
   * If not provided, ENSNodeProvider will create and manage its own QueryClient internally.
   */
  queryClient?: QueryClient;
  /**
   * Custom query client options when auto-creating a QueryClient.
   * Only used when queryClient is not provided.
   */
  queryClientOptions?: ConstructorParameters<typeof QueryClient>[0];
  /**
   * Enable connection management. When enabled, the provider will automatically
   * switch endpoints when connections are changed via useConnections.
   */
  enableConnectionManagement?: boolean;
  /**
   * Initial connection URL when connection management is enabled.
   * Defaults to the config's endpoint URL.
   */
  initialConnectionUrl?: string;
}

function ENSNodeInternalProvider({
  children,
  config,
  enableConnectionManagement = false,
  initialConnectionUrl,
}: {
  children: React.ReactNode;
  config: ENSNodeConfig;
  enableConnectionManagement?: boolean;
  initialConnectionUrl?: string;
}) {
  // State for connection management
  const [currentUrl, setCurrentUrlState] = useState(
    () => initialConnectionUrl || config.client.endpointUrl.toString(),
  );

  // Callback to update current URL
  const setCurrentUrl = useCallback((url: string) => {
    setCurrentUrlState(url);
  }, []);

  // Create dynamic config based on current connection
  const memoizedConfig = useMemo(() => {
    if (!enableConnectionManagement || currentUrl === config.client.endpointUrl.toString()) {
      return config;
    }

    // Create new config with different endpoint
    return {
      client: {
        ...config.client,
        endpointUrl: new URL(currentUrl),
      },
    };
  }, [config, enableConnectionManagement, currentUrl]);

  // Connection context value
  const connectionContextValue: ConnectionContextState = useMemo(
    () => ({
      currentUrl,
      setCurrentUrl,
      isConnectionManaged: enableConnectionManagement,
    }),
    [currentUrl, setCurrentUrl, enableConnectionManagement],
  );

  // Wrap with connection context if connection management is enabled
  if (enableConnectionManagement) {
    return createElement(
      ConnectionContext.Provider,
      { value: connectionContextValue },
      createElement(ENSNodeContext.Provider, { value: memoizedConfig }, children),
    );
  }

  return createElement(ENSNodeContext.Provider, { value: memoizedConfig }, children);
}

export function ENSNodeProvider(parameters: React.PropsWithChildren<ENSNodeProviderProps>) {
  const {
    children,
    config,
    queryClient,
    queryClientOptions,
    enableConnectionManagement,
    initialConnectionUrl,
  } = parameters;

  // Check if we're already inside a QueryClientProvider
  let hasExistingQueryClient = false;
  try {
    hasExistingQueryClient = Boolean(useQueryClient());
  } catch {
    // useQueryClient throws if not inside a QueryClientProvider
    hasExistingQueryClient = false;
  }

  // If user provided a queryClient, they must handle QueryClientProvider themselves
  if (queryClient) {
    if (!hasExistingQueryClient) {
      throw new Error(
        "When providing a custom queryClient, you must wrap your app with QueryClientProvider. " +
          "Either remove the queryClient prop to use auto-managed setup, or wrap with QueryClientProvider.",
      );
    }
    return createElement(ENSNodeInternalProvider, {
      config,
      children,
      enableConnectionManagement,
      initialConnectionUrl,
    });
  }

  // If already inside a QueryClientProvider, just use that
  if (hasExistingQueryClient) {
    return createElement(ENSNodeInternalProvider, {
      config,
      children,
      enableConnectionManagement,
      initialConnectionUrl,
    });
  }

  // Create our own QueryClient and QueryClientProvider
  const defaultQueryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
          },
        },
        ...queryClientOptions,
      }),
    [queryClientOptions],
  );

  return createElement(
    QueryClientProvider,
    { client: defaultQueryClient },
    createElement(ENSNodeInternalProvider, {
      config,
      children,
      enableConnectionManagement,
      initialConnectionUrl,
    }),
  );
}

/**
 * Helper function to create ENSNode configuration
 */
export function createConfig(options?: {
  url?: string | URL;
  debug?: boolean;
}): ENSNodeConfig {
  const endpointUrl = options?.url
    ? new URL(options.url)
    : ENSNodeClient.defaultOptions().endpointUrl;

  return {
    client: {
      ...ENSNodeClient.defaultOptions(),
      endpointUrl,
      debug: options?.debug,
    },
  };
}

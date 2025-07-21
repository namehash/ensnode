"use client";

import { ResolutionApiClient } from "@ensnode/ensnode-sdk";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { createElement, useMemo } from "react";
import { ENSNodeContext } from "./context.js";
import type { ENSNodeConfig } from "./types.js";

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
}

function ENSNodeInternalProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: ENSNodeConfig;
}) {
  // Memoize the config to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [config]);

  return createElement(ENSNodeContext.Provider, { value: memoizedConfig }, children);
}

export function ENSNodeProvider(parameters: React.PropsWithChildren<ENSNodeProviderProps>) {
  const { children, config, queryClient, queryClientOptions } = parameters;

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
    return createElement(ENSNodeInternalProvider, { config, children });
  }

  // If already inside a QueryClientProvider, just use that
  if (hasExistingQueryClient) {
    return createElement(ENSNodeInternalProvider, { config, children });
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
    createElement(ENSNodeInternalProvider, { config, children }),
  );
}

/**
 * Helper function to create ENSNode configuration
 */
export function createConfig(url?: string | URL, options?: { debug?: boolean }): ENSNodeConfig {
  const endpointUrl = url ? new URL(url) : ResolutionApiClient.defaultOptions().endpointUrl;

  return {
    client: {
      ...ResolutionApiClient.defaultOptions(),
      endpointUrl,
      ...options,
    },
  };
}

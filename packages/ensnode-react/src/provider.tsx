/** biome-ignore-all lint/correctness/useHookAtTopLevel: conditional hooks used correctly here */
"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { createElement, useMemo } from "react";

import { EnsNodeClient } from "@ensnode/ensnode-sdk";

import { EnsNodeContext } from "./context";
import type { EnsNodeProviderOptions } from "./types";

export interface EnsNodeProviderProps {
  /** ENSNode Provider Options */
  options: EnsNodeProviderOptions;

  /**
   * Optional QueryClient instance. If provided, you must wrap your app with QueryClientProvider yourself.
   * If not provided, EnsNodeProvider will create and manage its own QueryClient internally.
   */
  queryClient?: QueryClient;

  /**
   * Custom query client options when auto-creating a QueryClient.
   * Only used when queryClient is not provided.
   */
  queryClientOptions?: ConstructorParameters<typeof QueryClient>[0];
}

function EnsNodeInternalProvider({
  children,
  options,
}: {
  children?: React.ReactNode;
  options: EnsNodeProviderOptions;
}) {
  return createElement(EnsNodeContext.Provider, { value: options }, children);
}

export function EnsNodeProvider(parameters: React.PropsWithChildren<EnsNodeProviderProps>) {
  const { children, options, queryClient, queryClientOptions } = parameters;

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
    return createElement(EnsNodeInternalProvider, { options, children });
  }

  // If already inside a QueryClientProvider, just use that
  if (hasExistingQueryClient) {
    return createElement(EnsNodeInternalProvider, { options, children });
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
            refetchInterval: 1000 * 10, // 10 seconds
          },
        },
        ...queryClientOptions,
      }),
    [queryClientOptions],
  );

  return createElement(
    QueryClientProvider,
    { client: defaultQueryClient },
    createElement(EnsNodeInternalProvider, { options, children }),
  );
}

/**
 * Helper function to create ENSNode Provider Options
 */
export function createEnsNodeProviderOptions(options?: {
  url?: string | URL;
}): EnsNodeProviderOptions {
  const url = options?.url ? new URL(options.url) : EnsNodeClient.defaultOptions().url;

  return {
    client: {
      ...EnsNodeClient.defaultOptions(),
      url,
    },
  };
}

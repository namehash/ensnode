"use client";

import { type Resolution, ResolutionApiClient } from "@ensnode/ensnode-sdk";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { ENSNodeConfig, UseQueryReturnType } from "../types.js";

/**
 * Query key factory for ENSNode queries
 */
export const queryKeys = {
  all: ["ensnode"] as const,
  resolutions: () => [...queryKeys.all, "resolution"] as const,
  forward: (name: string, selection?: Resolution.RecordsSelection) =>
    [...queryKeys.resolutions(), "forward", name, selection] as const,
  reverse: (address: string, chainId?: number) =>
    [...queryKeys.resolutions(), "reverse", address, chainId] as const,
};

/**
 * Create query options for forward resolution (name to records)
 */
export function createForwardResolutionQueryOptions(
  config: ENSNodeConfig,
  name: string,
  selection?: Resolution.RecordsSelection,
) {
  return {
    queryKey: queryKeys.forward(name, selection),
    queryFn: async (): Promise<Resolution.ForwardResponse> => {
      const client = new ResolutionApiClient(config.client);
      return client.resolveName(name, selection);
    },
    enabled: Boolean(name),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  };
}

/**
 * Create query options for reverse resolution (address to name)
 */
export function createReverseResolutionQueryOptions(
  config: ENSNodeConfig,
  address: string,
  chainId?: number,
) {
  return {
    queryKey: queryKeys.reverse(address, chainId),
    queryFn: async (): Promise<Resolution.ReverseResponse> => {
      const client = new ResolutionApiClient(config.client);
      return client.resolveAddress(address as any, chainId);
    },
    enabled: Boolean(address),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  };
}

/**
 * Transform React Query result to our custom return type
 */
export function transformQueryResult<TData, TError = Error>(
  result: UseQueryResult<TData, TError>,
): UseQueryReturnType<TData, TError> {
  return {
    data: result.data,
    error: result.error,
    isLoading: result.isLoading,
    isError: result.isError,
    isSuccess: result.isSuccess,
    isPending: result.isPending,
    refetch: result.refetch,
  };
}

/**
 * Custom useQuery wrapper that returns our simplified interface
 */
export function useENSNodeQuery<TData, TError = Error>(
  options: Parameters<typeof useQuery<TData, TError>>[0],
): UseQueryReturnType<TData, TError> {
  const result = useQuery(options);
  return transformQueryResult(result);
}

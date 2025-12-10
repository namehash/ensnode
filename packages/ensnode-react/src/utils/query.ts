"use client";

import type { UndefinedInitialDataOptions } from "@tanstack/react-query";

import {
  ENSNodeClient,
  type NameTokensRequest,
  type RegistrarActionsRequest,
  type ResolvePrimaryNameRequest,
  type ResolvePrimaryNamesRequest,
  type ResolveRecordsRequest,
  type ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";

import type { ENSNodeSDKConfig } from "../types";

/**
 * Immutable query options for data that is assumed to be immutable and should only be fetched once per full page refresh per unique key.
 * Similar to SWR's immutable: true API.
 *
 * Use this for data that is assumed not to change (e.g., records for a specific name) until the next full page refresh.
 *
 * @example
 * ```tsx
 * useRecords({
 *   name: "vitalik.eth",
 *   selection: { texts: ["avatar"] },
 *   query: ASSUME_IMMUTABLE_QUERY
 * })
 * ```
 */
export const ASSUME_IMMUTABLE_QUERY = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
} as const satisfies Partial<UndefinedInitialDataOptions>;

/**
 * Query keys for hooks. Simply keys by path and arguments.
 */
export const queryKeys = {
  base: (url: string) => ["ensnode", url] as const,

  resolve: (url: string) => [...queryKeys.base(url), "resolve"] as const,

  records: (url: string, args: ResolveRecordsRequest<any>) =>
    [...queryKeys.resolve(url), "records", args] as const,

  primaryName: (url: string, args: ResolvePrimaryNameRequest) =>
    [...queryKeys.resolve(url), "primary-name", args] as const,

  primaryNames: (url: string, args: ResolvePrimaryNamesRequest) =>
    [...queryKeys.resolve(url), "primary-names", args] as const,

  config: (url: string) => [...queryKeys.base(url), "config"] as const,

  indexingStatus: (url: string) => [...queryKeys.base(url), "indexing-status"] as const,

  registrarActions: (url: string, args: RegistrarActionsRequest) =>
    [...queryKeys.base(url), "registrar-actions", args] as const,

  nameTokens: (url: string, args: NameTokensRequest) =>
    [...queryKeys.base(url), "name-tokens", args] as const,
};

/**
 * Creates query options for Records Resolution
 */
export function createRecordsQueryOptions<SELECTION extends ResolverRecordsSelection>(
  config: ENSNodeSDKConfig,
  args: ResolveRecordsRequest<SELECTION>,
) {
  return {
    enabled: true,
    queryKey: queryKeys.records(config.client.url.href, args),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.resolveRecords(args.name, args.selection, args);
    },
  };
}

/**
 * Creates query options for Primary Name Resolution
 */
export function createPrimaryNameQueryOptions(
  config: ENSNodeSDKConfig,
  args: ResolvePrimaryNameRequest,
) {
  return {
    enabled: true,
    queryKey: queryKeys.primaryName(config.client.url.href, args),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.resolvePrimaryName(args.address, args.chainId, args);
    },
  };
}

/**
 * Creates query options for Primary Name Resolution
 */
export function createPrimaryNamesQueryOptions(
  config: ENSNodeSDKConfig,
  args: ResolvePrimaryNamesRequest,
) {
  return {
    enabled: true,
    queryKey: queryKeys.primaryNames(config.client.url.href, args),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.resolvePrimaryNames(args.address, args);
    },
  };
}

/**
 * Creates query options for ENSNode Config API
 */
export function createConfigQueryOptions(config: ENSNodeSDKConfig) {
  return {
    enabled: true,
    queryKey: queryKeys.config(config.client.url.href),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.config();
    },
  };
}

/**
 * Creates query options for ENSNode Indexing Status API
 */
export function createIndexingStatusQueryOptions(config: ENSNodeSDKConfig) {
  return {
    enabled: true,
    queryKey: queryKeys.indexingStatus(config.client.url.href),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.indexingStatus();
    },
  };
}

/**
 * Creates query options for ENSNode Registrar Actions API
 */
export function createRegistrarActionsQueryOptions(
  config: ENSNodeSDKConfig,
  args: RegistrarActionsRequest,
) {
  return {
    enabled: true,
    queryKey: queryKeys.registrarActions(config.client.url.href, args),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);

      return client.registrarActions(args);
    },
  };
}

/**
 * Creates query options for Name Tokens API
 */
export function createNameTokensQueryOptions(config: ENSNodeSDKConfig, args: NameTokensRequest) {
  return {
    enabled: true,
    queryKey: queryKeys.nameTokens(config.client.url.href, args),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);

      return client.nameTokens(args);
    },
  };
}

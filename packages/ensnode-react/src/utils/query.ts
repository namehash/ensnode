"use client";

import {
  ENSNodeClient,
  IndexingStatusRequest,
  ResolvePrimaryNameRequest,
  ResolvePrimaryNamesRequest,
  ResolveRecordsRequest,
  ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";
import type { ENSNodeConfig } from "../types";

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

  indexingStatus: (url: string) => [...queryKeys.base(url), "config"] as const,
};

/**
 * Creates query options for Records Resolution
 */
export function createRecordsQueryOptions<SELECTION extends ResolverRecordsSelection>(
  config: ENSNodeConfig,
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
  config: ENSNodeConfig,
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
  config: ENSNodeConfig,
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
 * Creates query options for ENSIndexer Config API
 */
export function createENSIndexerConfigQueryOptions(config: ENSNodeConfig) {
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
 * Creates query options for ENSIndexer Indexing Status API
 */
export function createIndexingStatusQueryOptions(config: ENSNodeConfig) {
  return {
    enabled: true,
    queryKey: queryKeys.indexingStatus(config.client.url.href),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.indexingStatus();
    },
  };
}

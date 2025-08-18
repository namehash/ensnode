import { ENSNodeConfig } from "@ensnode/ensnode-react";
import { ENSNodeClient, IndexingStatusRequest } from "@ensnode/ensnode-sdk";

/**
 * Query keys for hooks. Simply keys by path and arguments.
 */
export const queryKeys = {
  base: (url: string) => ["ensnode", url] as const,

  config: (url: string) => [...queryKeys.base(url), "config"] as const,

  indexingStatus: (url: string, args: IndexingStatusRequest) =>
    [...queryKeys.base(url), "config", args] as const,
};

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
export function createIndexingStatusQueryOptions(
  config: ENSNodeConfig,
  args: IndexingStatusRequest,
) {
  return {
    enabled: true,
    queryKey: queryKeys.indexingStatus(config.client.url.href, args),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.indexingStatus(args);
    },
  };
}
